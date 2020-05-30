const yaml = require("js-yaml");
const path = require("path");
const moment = require("moment");
const debug = require("debug")("lit-artifact-generator:GeneratorConfiguration");
const fs = require("fs");
const packageDotJson = require("../../package.json");
const CommandLine = require("../CommandLine");

const { COMMAND_INITIALIZE, COMMAND_GENERATE } = require("../App");

const { getArtifactDirectorySourceCode } = require("../Util");

const DEFAULT_PUBLISH_KEY = "_default";

const CONFIG_SOURCE_COMMAND_LINE = "<Command Line Config>";

// This is the path to the template directory
const RELATIVE_TEMPLATE_DIRECTORY = path.join("..", "..", "templates");

const WEBPACK_DEFAULT = {
  packagingTool: "webpack",
  packagingDirectory: "config",
  packagingTemplates: [
    {
      templateInternal: "webpack.dev.config.hbs",
      fileName: "webpack.dev.config.js",
    },
    {
      templateInternal: "webpack.prod.config.hbs",
      fileName: "webpack.prod.config.js",
    },
  ],
};

const NPM_DEFAULT = {
  packagingTool: "npm",
  npmModuleScope: "@lit/",
  publish: [
    { key: "local", command: "npm publish --registry https://localhost:4873" },
  ],
  packagingTemplates: [
    {
      templateInternal: path.join(
        "litVocabTermDependent",
        "javascript",
        "package.hbs"
      ),
      fileName: "package.json",
      template: path.join(
        "templates",
        "litVocabTermDependent",
        "javascript",
        "package.hbs"
      ),
    },
    {
      templateInternal: path.join(
        "litVocabTermDependent",
        "javascript",
        "index.hbs"
      ),
      fileName: "index.js",
      template: path.join(
        "templates",
        "litVocabTermDependent",
        "javascript",
        "index.hbs"
      ),
    },
  ],
};

const DEFAULT_CLI_ARTIFACT = [
  {
    programmingLanguage: "JavaScript",
    artifactDirectoryName: "JavaScript",
    templateInternal: path.join(
      "litVocabTermDependent",
      "javascript",
      "vocab.hbs"
    ),
    sourceFileExtension: "js",
    packaging: [NPM_DEFAULT],
    sourceCodeTemplate: path.join(
      "templates",
      "litVocabTermDependent",
      "javascript",
      "vocab.hbs"
    ),
  },
];

class GeneratorConfiguration {
  /**
   * Constructor for our configuration object. It is passed info collected
   * initially (e.g. from the command-line), potentially with sensible default
   * values and often referencing a configuration (like a YAML config file) with
   * more details.
   *
   * @param {Object} initialConfig the command line options
   */
  constructor(initialConfig) {
    if (initialConfig.vocabListFile) {
      // The command-line references a vocab list configuration file.
      this.configuration = {
        ...GeneratorConfiguration.normalizeCliOptions(initialConfig),
        ...GeneratorConfiguration.fromConfigFile(initialConfig.vocabListFile),
      };
    } else {
      this.configuration = {
        ...GeneratorConfiguration.normalizeCliOptions(initialConfig),
        ...GeneratorConfiguration.fromCommandLine(initialConfig),
      };
    }

    GeneratorConfiguration.normalizeConfigPaths(
      this.configuration,
      initialConfig.vocabListFile || CONFIG_SOURCE_COMMAND_LINE
    );

    // Extend the received arguments with contextual data.
    this.configuration.generatedTimestamp = moment().format("LLLL");
    this.configuration.generatorName = packageDotJson.name;
    this.configuration.artifactGeneratorVersion = packageDotJson.version;
  }

  /**
   * Normalizes paths that are found on the command line (e.g. outputDirectory).
   * @param {*} config
   */
  static normalizeCliOptions(cliConfig) {
    const normalizedConfig = { ...cliConfig };
    if (normalizedConfig.outputDirectory) {
      normalizedConfig.outputDirectory = GeneratorConfiguration.normalizeAbsolutePath(
        normalizedConfig.outputDirectory,
        process.cwd()
      );
    }

    return normalizedConfig;
  }

  static normalizeInputResources(vocabConfig, normalizedConfigPath) {
    const normalizedVocabConfig = vocabConfig;
    for (let i = 0; i < vocabConfig.inputResources.length; i += 1) {
      if (!normalizedVocabConfig.inputResources[i].startsWith("http")) {
        // The vocab path is normalized by appending the normalized path of the YAML file to
        // the vocab path.
        normalizedVocabConfig.inputResources[i] = path.join(
          path.dirname(normalizedConfigPath),
          // Vocabularies are all made relative to the YAML file
          GeneratorConfiguration.normalizeAbsolutePath(
            vocabConfig.inputResources[i],
            path.dirname(normalizedConfigPath)
          )
        );
      }
    }

    return normalizedVocabConfig;
  }

  /**
   * Normalizes a path relative to the config file. If the path is absolute,
   * it is returned as is, and if it was relative to the config file, an equivalent
   * absolute path is returned, resolved to the running environment.
   * @param {*} relativePath The pat to normalize
   * @param {*} configSource The path to the configuration file
   */
  static normalizeRelativePath(relativePath, configSource) {
    return path.join(
      path.dirname(configSource),
      // Templates are all made relative to the YAML file
      GeneratorConfiguration.normalizeAbsolutePath(
        relativePath,
        path.dirname(configSource)
      )
    );
  }

  /**
   * Normalizise the specified template path, which can be provided as either an
   * internal path (which means it will be resolved relative to our internal
   * 'templates' directory), or a custom path (which means it will be resolved
   * relative to the source of our configuration (which only really makes sense
   * for configuration files (and not, for example, a command-line source).
   *
   * @param templatePathInternal undefined or a reference to an internal template
   * @param templatePathCustom undefined or a reference relative to our config source
   * @param configSource the source of our configuration (e.g. a local YAML file, or the command-line)
   * @returns {*}
   */
  static normalizeTemplatePath(
    templatePathInternal,
    templatePathCustom,
    configSource
  ) {
    let normalizedTemplate;
    if (templatePathInternal) {
      // If the template is internal, it must be resolved relative to our
      // internal templates directory.
      normalizedTemplate = GeneratorConfiguration.normalizeAbsolutePath(
        path.join(__dirname, RELATIVE_TEMPLATE_DIRECTORY, templatePathInternal),
        process.cwd()
      );
    } else if (templatePathCustom) {
      normalizedTemplate = GeneratorConfiguration.normalizeRelativePath(
        templatePathCustom,
        configSource
      );
    } else {
      throw new Error(
        `We require either an internal or a custom template file, but neither was provided (working with a normalized configuration file path of [${configSource}]).`
      );
    }
    return normalizedTemplate;
  }

  static normalizeConfigPaths(config, configSource) {
    const normalizedConfig = config;

    // Normalize our overall config versioning section.
    if (
      normalizedConfig.versioning &&
      normalizedConfig.versioning.versioningTemplates
    ) {
      normalizedConfig.versioning.versioningTemplates = normalizedConfig.versioning.versioningTemplates.map(
        (versioningFile) => {
          const normalizedVersioningFile = versioningFile;
          normalizedVersioningFile.template = GeneratorConfiguration.normalizeTemplatePath(
            versioningFile.templateInternal,
            versioningFile.templateCustom,
            configSource
          );

          return normalizedVersioningFile;
        }
      );
    }

    // Normalize each artifact to generate.
    normalizedConfig.artifactToGenerate = config.artifactToGenerate.map(
      (artifactConfig) => {
        return this.normalizePerArtifactTemplates(artifactConfig, configSource);
      }
    );

    if (configSource !== CONFIG_SOURCE_COMMAND_LINE) {
      // Normalize all the vocab files listed in the configuration.
      for (let i = 0; i < normalizedConfig.vocabList.length; i += 1) {
        normalizedConfig.vocabList[i] = GeneratorConfiguration.normalizePath(
          normalizedConfig.vocabList[i],
          configSource
        );
      }
    }

    return normalizedConfig;
  }

  /**
   * Normalizes all paths in per artifact configuration (e.g. source file
   * templates, packaging templates).
   *
   * @param {*} artifactConfig
   * @param {string} configSource
   */
  static normalizePerArtifactTemplates(artifactConfig, configSource) {
    const normalizedArtifactConfig = artifactConfig;
    normalizedArtifactConfig.sourceCodeTemplate = GeneratorConfiguration.normalizeTemplatePath(
      artifactConfig.templateInternal,
      artifactConfig.templateCustom,
      configSource
    );

    if (normalizedArtifactConfig.packaging) {
      normalizedArtifactConfig.packaging = normalizedArtifactConfig.packaging.map(
        (packagingConfig) => {
          const normalizedPackagingConfig = { ...packagingConfig };
          normalizedPackagingConfig.packagingTemplates = packagingConfig.packagingTemplates.map(
            (packagingTemplate) => {
              // Make sure we clone the original structure (rather than just
              // refer to it directly), as otherwise running tests in parallel
              // will result in corrupted data (e.g. filenames like
              // 'templates/templates/templates/templates/<FILENAME>')
              const normalizedPackagingTemplate = { ...packagingTemplate };

              normalizedPackagingTemplate.template = GeneratorConfiguration.normalizeTemplatePath(
                packagingTemplate.templateInternal,
                packagingTemplate.templateCustom,
                configSource
              );

              return normalizedPackagingTemplate;
            }
          );

          return normalizedPackagingConfig;
        }
      );
    }

    return normalizedArtifactConfig;
  }

  /**
   *  This function makes the local vocabulary path relative to the root of the project,
   *  rather that to the configuration file. It makes it consistent with vocabularies passed
   *  on the command line.
   * @param {*} config the path of the vocabulary, relative to the configuration file
   * @param {*} configSource the path to the configuration file, relative to the project root
   */
  static normalizePath(config, configSource) {
    let normalizedConfig = config;
    const normalizedConfigSource = GeneratorConfiguration.normalizeAbsolutePath(
      configSource,
      process.cwd()
    );

    normalizedConfig = GeneratorConfiguration.normalizeInputResources(
      normalizedConfig,
      normalizedConfigSource
    );

    if (config.termSelectionResource) {
      normalizedConfig.termSelectionResource = path.join(
        path.dirname(normalizedConfigSource),
        GeneratorConfiguration.normalizeAbsolutePath(
          config.termSelectionResource,
          path.dirname(normalizedConfigSource)
        )
      );
    }

    return normalizedConfig;
  }

  /**
   * This function takes an absolute path, and makes it relative to the provided base. If the provided path is
   * already relative, it is returned without modification.
   * @param {*} absolute the absolute path to the vocabulary
   * @param {*} base the path we want the vocabulary to be relative to (typically the project root)
   */
  static normalizeAbsolutePath(absolute, base) {
    if (absolute.startsWith("/")) {
      return path.relative(base, absolute);
    }

    return absolute;
  }

  /**
   * This function validiates artifacts found in the artifactToGenerate list.
   * @param {*} artifact the configuration object for an individual artifact
   */
  static validateArtifact(artifact) {
    if (!artifact.artifactDirectoryName) {
      throw new Error(
        `The target directory name for the [${artifact.programmingLanguage}] artifact is missing. Please set a value for 'artifactDirectoryName'.`
      );
    }

    if (artifact.packaging) {
      artifact.packaging.forEach((packagingConfig) => {
        if (!packagingConfig.packagingTemplates) {
          throw new Error(
            `No templates associated to packaging tool [${packagingConfig.packagingTool}]`
          );
        }
      });
    }
  }

  /**
   * Validates if all the required values are present in the configuration, and
   * throws an error otherwise.
   * @param {Object} configuration object loaded from some named source
   * @param {string} configSource the source of our configuration (e.g. a file)
   */
  static validateConfiguration(config, configSource) {
    // Check version mismatch.
    if (!config.artifactGeneratorVersion) {
      throw new Error(
        `Missing 'artifactGeneratorVersion' field in [${configSource}].`
      );
    }
    if (config.artifactGeneratorVersion !== packageDotJson.version) {
      debug(
        `You are running the version [${packageDotJson.version}] of the generator, and reading a configuration file validated for version [${config.artifactGeneratorVersion}]. Please check https://github.com/inrupt/lit-artifact-generator/releases to verify compatibility.`
      );
    }

    // There must be at least one artifact defined.
    if (!config.artifactToGenerate) {
      throw new Error(
        "No artifacts found: nothing to generate. " +
          `Please edit the YAML configuration file [${configSource}] to provide artifacts to be generated.`
      );
    }

    for (let i = 0; i < config.artifactToGenerate.length; i += 1) {
      GeneratorConfiguration.validateArtifact(config.artifactToGenerate[i]);
    }

    // There must be at least one vocabulary defined.
    if (!config.vocabList) {
      throw new Error(
        "No vocabularies found: nothing to generate. " +
          `Please edit the YAML configuration file [${configSource}] to provide vocabularies to generate from.`
      );
    }
  }

  static validateCommandline(args) {
    let mode = COMMAND_GENERATE;
    if (args._) {
      // Only one command is passed to yargs, so this array always contains one
      // element.
      [mode] = args._;
    }

    // If the options are provided by command line, at least one input resource
    // must be specified (except for initialization).
    if (mode !== COMMAND_INITIALIZE && !args.inputResources) {
      throw new Error(
        "Missing input resource. Please provide either a YAML configuration file, or at least one input resource."
      );
    }
  }

  /**
   * Parses the provided configuration file, and returns the parsed
   * configuration if it is valid.
   *
   * @param {string} configFile path to the config file
   */
  static fromConfigFile(configFile) {
    let configuration = {};
    try {
      debug(`\nProcessing configuration file [${configFile}]...`);
      configuration = yaml.safeLoad(fs.readFileSync(configFile, "utf8"));
      if (!configuration) {
        throw new Error(`Empty configuration file: [${configFile}]`);
      }

      if (configuration.license) {
        configuration.license.path = this.normalizeRelativePath(
          configuration.license.path,
          configFile
        );

        if (configuration.license.header) {
          // The configuration file contains the license path, and what we need
          // in the templates is the license text.
          configuration.license.header = fs.readFileSync(
            this.normalizeRelativePath(
              configuration.license.header,
              configFile
            ),
            "utf8"
          );
        }
      }

      GeneratorConfiguration.validateConfiguration(configuration, configFile);
    } catch (error) {
      throw new Error(
        `Failed to read configuration file [${configFile}]: ${error}`
      );
    }

    return configuration;
  }

  /**
   * Collects vocabulary-related information from the command line
   * @param {*} args
   */
  static collectVocabFromCLI(args) {
    const vocab = {};
    vocab.inputResources = args.inputResources;
    for (let i = 0; i < vocab.inputResources.length; i += 1) {
      // If the vocab passed on the CLI is absolute, it is normalized
      vocab.inputResources[i] = GeneratorConfiguration.normalizeAbsolutePath(
        vocab.inputResources[i],
        process.cwd()
      );
    }

    if (args.termSelectionResource) {
      vocab.termSelectionResource = args.termSelectionResource;
    }

    return vocab;
  }

  static fromCommandLine(args) {
    const cliConfig = {};
    GeneratorConfiguration.validateCommandline(args);

    // It is assumed that by default, all vocabularies are resources for the same artifact.
    // The most common case for using the command line is providing a single vocab anyways.
    cliConfig.vocabList = [GeneratorConfiguration.collectVocabFromCLI(args)];

    cliConfig.outputDirectoryForArtifact = `${
      args.outputDirectory
    }${getArtifactDirectorySourceCode(args)}/JavaScript`;

    // We weren't provided with a configuration file, so manually provide defaults.
    const packagingInfo = NPM_DEFAULT;
    // If the registry is set in the command line, override default
    if (args.npmRegistry) {
      packagingInfo.publish = [
        {
          key: DEFAULT_PUBLISH_KEY,
          command: `npm publish --registry ${args.npmRegistry}`,
        },
      ];
    }

    // TODO: Here, the DEFAULT_CLI_ARTIFACT constant should be used, but since
    //  objects are copied by reference, and the tests are run in parallel, it
    //  creates thread-safety issues that should be addressed by creating a
    //  deep copy.
    cliConfig.artifactToGenerate = [
      {
        programmingLanguage: "JavaScript",
        artifactDirectoryName: "JavaScript",
        templateInternal: path.join(
          "litVocabTermDependent",
          "javascript",
          "vocab.hbs"
        ),
        sourceFileExtension: "js",
        packaging: [packagingInfo],
      },
    ];

    if (args.supportBundling) {
      cliConfig.artifactToGenerate[0].packaging.push(WEBPACK_DEFAULT);
    }

    if (args.artifactVersion) {
      cliConfig.artifactToGenerate[0].artifactVersion = args.artifactVersion;
    }

    if (args.litVocabTermVersion) {
      cliConfig.artifactToGenerate[0].litVocabTermVersion =
        args.litVocabTermVersion;
    }

    return cliConfig;
  }

  /**
   * This function is asked when generating a single vocab, if processing the vocab did not provide the expected
   * additional information. These information may be completed when generating the vocabularies, and will not
   * necessarily be asked to the user.
   */
  askAdditionalQuestions() {
    this.configuration = CommandLine.findPublishedVersionOfModule(
      this.configuration
    );
  }

  /**
   * If receiving the config from the command line, some information may be missing that we know the vocabulary generation
   * will not provide. These must be asked to the user.
   *
   */
  async completeInitialConfiguration() {
    if (!this.configuration.artifactToGenerate[0].litVocabTermVersion) {
      if (!this.configuration.noprompt) {
        const input = await CommandLine.askForLitVocabTermVersion();
        this.configuration.artifactToGenerate[0].litVocabTermVersion =
          input.litVocabTermVersion;
      } else {
        throw new Error(
          "Missing LIT VocabTerm version: The LIT VocabTerm version was not provided as a CLI option, and user prompt is deactivated."
        );
      }
    }

    return this;
  }

  /**
   * This function returns all the resources (local files and online
   * repositories) that are listed in the configuration object.
   */
  getInputResources() {
    const resources = [];
    for (let i = 0; i < this.configuration.vocabList.length; i += 1) {
      for (
        let j = 0;
        j < this.configuration.vocabList[i].inputResources.length;
        j += 1
      ) {
        resources.push(this.configuration.vocabList[i].inputResources[j]);
      }
    }

    return resources;
  }
}

module.exports = GeneratorConfiguration;
module.exports.DEFAULT_CLI_ARTIFACT = DEFAULT_CLI_ARTIFACT;
module.exports.DEFAULT_PUBLISH_KEY = DEFAULT_PUBLISH_KEY;
module.exports.CONFIG_SOURCE_COMMAND_LINE = CONFIG_SOURCE_COMMAND_LINE;
