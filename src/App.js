const path = require('path');
const debug = require('debug')('lit-artifact-generator:App');

const GeneratorConfiguration = require('./config/GeneratorConfiguration');
const ArtifactGenerator = require('./generator/ArtifactGenerator');
const { ConfigFileGenerator } = require('./generator/ConfigFileGenerator');
const VocabWatcher = require('./VocabWatcher');
const CommandLine = require('./CommandLine');
const FileGenerator = require('./generator/FileGenerator');
const Resource = require('./Resource');

const DEFAULT_CONFIG_NAME = 'lit-vocab.yml';

const COMMAND_GENERATE = 'generate';
const COMMAND_INITIALIZE = 'init';
const COMMAND_WATCH = 'watch';
const COMMAND_VALIDATE = 'validate';

module.exports = class App {
  constructor(argv) {
    if (!argv) {
      throw new Error('Application must be initialised with a configuration - none was provided.');
    }

    this.argv = argv;
    this.watcher = undefined;
  }

  async configure() {
    const configuration = new GeneratorConfiguration(this.argv);
    return configuration.completeInitialConfiguration();
  }

  async run() {
    const artifactGenerator = new ArtifactGenerator(await this.configure());
    return artifactGenerator
      .generate()
      .then(CommandLine.askForArtifactToBeNpmVersionBumped)
      .then(CommandLine.askForArtifactToBeNpmInstalled)
      .then(generationData => {
        const publicationData = generationData;
        if (generationData.publishLocal) {
          artifactGenerator.runPublish(true);
        }
        if (generationData.publishRemote) {
          artifactGenerator.runPublish(false);
        }
        return publicationData;
      })
      .then(CommandLine.askForArtifactToBeDocumented);
  }

  async init() {
    const targetPath = path.join(this.argv.outputDirectory, DEFAULT_CONFIG_NAME);
    FileGenerator.createDirectory(this.argv.outputDirectory);

    const configGen = new ConfigFileGenerator(this.argv);
    if (this.argv.noprompt) {
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
    debug('The configuration options are valid. Validating the vocabularies...');
    const vocabsToValidate = [];
    const { vocabList } = configuration.configuration;
    for (let i = 0; i < vocabList.length; i += 1) {
      for (let j = 0; j < vocabList[i].inputResources.length; j += 1) {
        vocabsToValidate.push(Resource.readResource(vocabList[i].inputResources[j]));
      }
    }
    return Promise.all(vocabsToValidate).catch(error => {
      throw new Error(`Invalid vocabulary: [${error}]`);
    });
  }

  async watch() {
    this.watcher = new VocabWatcher(new ArtifactGenerator(await this.configure()));
    this.watcher.watch();
  }

  unwatch() {
    this.watcher.unwatch();
  }
};

module.exports.COMMAND_GENERATE = COMMAND_GENERATE;
module.exports.COMMAND_INITIALIZE = COMMAND_INITIALIZE;
module.exports.COMMAND_WATCH = COMMAND_WATCH;
module.exports.COMMAND_VALIDATE = COMMAND_VALIDATE;
