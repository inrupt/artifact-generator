const path = require('path');

const GeneratorConfiguration = require('./config/GeneratorConfiguration');
const ArtifactGenerator = require('./generator/ArtifactGenerator');
const { ConfigFileGenerator } = require('./generator/ConfigFileGenerator');
const VocabWatcher = require('./VocabWatcher');
const CommandLine = require('./CommandLine');
const FileGenerator = require('./generator/FileGenerator');

const DEFAULT_CONFIG_NAME = 'lit-vocab.yml';

const GENERATE_COMMAND = 'generate';
const INITIALIZE_COMMAND = 'init';
const WATCH_COMMAND = 'watch';
const VALIDATE_COMMAND = 'validate';

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
      .then(CommandLine.askForArtifactToBeNpmPublished)
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
    try {
      const configuration = new GeneratorConfiguration(this.argv);
      GeneratorConfiguration.validateYamlConfig(
        configuration.configuration,
        this.argv.vocabListFile
      );
    } catch (error) {
      throw new Error(`Invalid config file: ${error}`);
    }
    return true;
  }

  async watch() {
    this.watcher = new VocabWatcher(new ArtifactGenerator(await this.configure()));
    this.watcher.watch();
  }

  unwatch() {
    this.watcher.unwatch();
  }
};

module.exports.GENERATE_COMMAND = GENERATE_COMMAND;
module.exports.INITIALIZE_COMMAND = INITIALIZE_COMMAND;
module.exports.WATCH_COMMAND = WATCH_COMMAND;
module.exports.VALIDATE_COMMAND = VALIDATE_COMMAND;
