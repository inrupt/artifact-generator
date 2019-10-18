const path = require('path');
const moment = require('moment');

const ArtifactGenerator = require('./generator/ArtifactGenerator');
const { ConfigFileGenerator } = require('./generator/ConfigFileGenerator');
const CommandLine = require('./CommandLine');
const FileGenerator = require('./generator/FileGenerator');
const packageDotJson = require('../package.json');

const DEFAULT_CONFIG_NAME = 'lit-vocab.yml';

module.exports = class App {
  constructor(argv) {
    if (!argv) {
      throw new Error('Application must be initialised with a configuration - none was provided.');
    }

    this.argv = argv;

    // Extend the received arguments with contextual data
    this.argv.generatedTimestamp = moment().format('LLLL');
    this.argv.generatorName = packageDotJson.name;
    this.argv.generatorVersion = packageDotJson.version;
  }

  async run() {
    const artifactGenerator = new ArtifactGenerator(this.argv, CommandLine.askForArtifactInfo);

    return artifactGenerator
      .generate()
      .then(CommandLine.askForArtifactToBeNpmVersionBumped)
      .then(CommandLine.askForArtifactToBeNpmInstalled)
      .then(CommandLine.askForArtifactToBeNpmPublished)
      .then(CommandLine.askForArtifactToBeDocumented);
  }

  async init() {
    return new Promise(async resolve => {
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
      resolve(targetPath);
    });
  }
};
