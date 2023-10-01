const path = require("path");
const debug = require("debug")("artifact-generator:App");
const glob = require("glob");

const GeneratorConfiguration = require("./config/GeneratorConfiguration");
const ArtifactGenerator = require("./generator/ArtifactGenerator");
const { ConfigFileGenerator } = require("./generator/ConfigFileGenerator");
const VocabWatcher = require("./VocabWatcher");
const CommandLine = require("./CommandLine");
const FileGenerator = require("./generator/FileGenerator");
const Resource = require("./Resource");
const Util = require("./Util");

// Just a sample configuration file name to use when initialising a YAML file
// for a user who wants a boilerplate YAML generated for them.
const SAMPLE_CONFIG_NAME = "sample-vocab.yml";

module.exports = class App {
  constructor(argv) {
    if (!argv) {
      throw new Error(
        "Application must be initialized with a configuration - none was provided.",
      );
    }

    // Normalize our inputs to remove single or double dots in file paths.
    argv.outputDirectory = Util.normalizePath(argv.outputDirectory);
    argv.vocabListFile = Util.normalizePath(argv.vocabListFile);
    argv.vocabListFileIgnore = Util.normalizePath(argv.vocabListFileIgnore);
    this.argv = argv;

    this.watcherList = [];
  }

  async configure() {
    return new GeneratorConfiguration(this.argv);
  }

  async run() {
    return await this.performFunctionPerGlobMatch(
      this,
      async function (app, config) {
        return await app.runWithConfig(config);
      },
    );
  }

  async runWithConfig(config) {
    const artifactGenerator = new ArtifactGenerator(config);
    return artifactGenerator
      .generate()
      .then(CommandLine.askForArtifactToBeNpmInstalled)
      .then((generationData) => {
        const publicationData = generationData;
        if (generationData.publish) {
          generationData.publish.forEach((publicationConfigKey) => {
            artifactGenerator.runPublish(publicationConfigKey);
          });
        }
        return publicationData;
      })
      .then(CommandLine.askForArtifactToBeDocumented);
  }

  async init() {
    FileGenerator.createDirectoryIfNotExist(this.argv.outputDirectory);

    const targetPath = path.join(this.argv.outputDirectory, SAMPLE_CONFIG_NAME);

    const configGen = new ConfigFileGenerator(this.argv);
    if (this.argv.noPrompt) {
      configGen.generateDefaultConfigFile(targetPath);
    } else {
      // By default, the user will be asked info about the artifacts to generate
      await configGen.collectConfigInfo();
      configGen.generateConfigFile(targetPath);
    }
    return targetPath;
  }

  async validate() {
    let configuration;
    try {
      configuration = new GeneratorConfiguration(this.argv);
    } catch (error) {
      throw new Error(`Invalid configuration: [${error}]`);
    }
    debug(
      "The configuration options are valid. Validating the vocabularies...",
    );

    const vocabsToValidate = [];
    const { vocabList } = configuration.configuration;
    for (let i = 0; i < vocabList.length; i += 1) {
      for (let j = 0; j < vocabList[i].inputResources.length; j += 1) {
        vocabsToValidate.push(
          Resource.readResourceViaCache(vocabList[i].inputResources[j]),
        );
      }
    }

    return Promise.all(vocabsToValidate).catch((error) => {
      throw new Error(`Invalid vocabulary: [${error}]`);
    });
  }

  async watch() {
    return await this.performFunctionPerGlobMatch(
      this,
      async function (app, config) {
        const watcher = new VocabWatcher(new ArtifactGenerator(config));
        await watcher.watch();

        app.watcherList.push(watcher);
        return app.watcherList.length;
      },
    );
  }

  async performFunctionPerGlobMatch(app, funcToCall) {
    if (this.argv.vocabListFile) {
      // Check if the vocab list file is actually a glob (e.g. yamls/**/*.yml).
      // Filter out any instances in 'Generated' directories (as we can have
      // '.yml' files in the 'node_modules' hierarchies of generated projects.
      const matchingConfigFile = glob
        .sync(
          this.argv.vocabListFile,
          this.argv.vocabListFileIgnore
            ? { ignore: this.argv.vocabListFileIgnore.split(",") }
            : {},
        )
        .filter((match) => !match.includes("/Generated/"));

      this.argv.globMatchPosition = 0;
      this.argv.globMatchTotal = matchingConfigFile.length;

      // If only one match, then it may (or may not) have been a glob that
      // simply matched one config file, so overwrite our input with the actual
      // match.
      if (matchingConfigFile.length === 1) {
        this.argv.vocabListFile = matchingConfigFile[0];
      }

      if (matchingConfigFile.length > 1) {
        // If we were given an explicit output directory, we'll generate our
        // output within that directory, but in sub-directories based from the
        // root of the specific glob. So if our specified output directory was
        // 'a/b/c', and our glob was 'resources/yamls/**/*.yml', and we found
        // YAMLs in 'resources/yamls/x/y/first.yml' and
        // 'resources/yamls/z/second.yml', then we'll generate artifacts in
        // 'a/b/c/x/y/Generated' and 'a/b/c/z/Generated'.
        // If no output directory was provided, we'll just generate relative to
        // the found YAMLs themselves, i.e. in 'resources/yamls/x/y/Generated'
        // and 'resources/yamls/z/Generated'.
        const origOutputDirectory = this.argv.outputDirectory;
        const rootOfGlob = this.argv.vocabListFile.substring(
          0,
          this.argv.vocabListFile.indexOf("*"),
        );

        // TODO: When generating artifacts from multiple config files, we
        //  should collect all results and return them all, and our calling code
        //  will need to be updated to always handle potentially multiple
        //  generation results...
        let result = undefined;
        // The following loop enforces sequential execution on purpose, because
        // there are possibilities that the generator requires user interaction,
        // in which case parallel execution is not acceptable.
        for (let configFile of matchingConfigFile) {
          const configDirectory = path.dirname(configFile);

          this.argv.globMatchPosition++;
          this.argv = {
            ...this.argv,
            vocabListFile: configFile,
            outputDirectory: origOutputDirectory
              ? path.join(
                  origOutputDirectory,
                  configDirectory.substring(rootOfGlob.length),
                )
              : configDirectory,
          };

          result = await funcToCall(this, await this.configure());
        }

        return result;
      }
    }

    this.argv.globMatchTotal = this.argv.globMatchPosition = 1;
    return await funcToCall(this, await this.configure());
  }

  async unwatch() {
    const watcherCount = this.watcherList.length;
    const plural = watcherCount != 1;
    debug(
      `Stopping ${plural ? "all " : ""}[${watcherCount}] watcher${
        plural ? "s" : ""
      }...`,
    );

    for (let i = 0; i < this.watcherList.length; i++) {
      await Promise.all(this.watcherList.map((watcher) => watcher.unwatch()));
    }

    this.watcherList = [];
  }
};
