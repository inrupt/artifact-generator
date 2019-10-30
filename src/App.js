const path = require('path');

const GeneratorConfiguration = require('./config/GeneratorConfiguration');
const ArtifactGenerator = require('./generator/ArtifactGenerator');
const { ConfigFileGenerator } = require('./generator/ConfigFileGenerator');
const CommandLine = require('./CommandLine');
const FileGenerator = require('./generator/FileGenerator');

const DEFAULT_CONFIG_NAME = 'lit-vocab.yml';

const GENERATE_COMMAND = 'generate';
const INITIALIZE_COMMAND = 'init';

module.exports = class App {
  constructor(argv) {
    if (!argv) {
      throw new Error('Application must be initialised with a configuration - none was provided.');
    }

    this.argv = argv;
    this.configuration = new GeneratorConfiguration(argv, CommandLine.askForArtifactInfo);
  }

  async run() {
    const artifactGenerator = new ArtifactGenerator(this.configuration);

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
};

module.exports.GENERATE_COMMAND = GENERATE_COMMAND;
module.exports.INITIALIZE_COMMAND = INITIALIZE_COMMAND;
