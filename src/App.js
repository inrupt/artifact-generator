const path = require('path');

const ArtifactGenerator = require('./generator/ArtifactGenerator');
const CommandLine = require('./CommandLine');
const FileGenerator = require('./generator/FileGenerator');

const DEFAULT_CONFIG_TEMPLATE_PATH = '../../templates/initial-config.hbs';
const DEFAULT_CONFIG_NAME = 'lit-vocab.yml';

module.exports = class App {
  constructor(argv) {
    if (!argv) {
      throw new Error('Application must be initialised with a configuration - none was provided.');
    }

    this.argv = argv;
  }

  async run() {
    // Process the YARGS config data...
    // this.argv = this.yargsConfig.argv;

    //   if (!this.argv.inputResources && !this.argv.vocabListFile) {
    //     // this.yargsConfig.showHelp();
    //    debug.enable('lit-artifact-generator:*');
    //    throw new Error(
    //      "You must provide input, either a single vocabulary using '--inputResources' (e.g. a local RDF file, or a URL that resolves to an RDF vocabulary), or a YAML file using '--vocabListFile' listing multiple vocabularies."
    //    );
    //  }

    const artifactGenerator = new ArtifactGenerator(this.argv, CommandLine.askForArtifactInfo);

    return artifactGenerator
      .generate()
      .then(CommandLine.askForArtifactToBeNpmVersionBumped)
      .then(CommandLine.askForArtifactToBeNpmInstalled)
      .then(CommandLine.askForArtifactToBeNpmPublished)
      .then(CommandLine.askForArtifactToBeDocumented);
  }

  async init() {
    return new Promise(resolve => {
      const targetPath = path.join(this.argv.outputDirectory, DEFAULT_CONFIG_NAME);

      FileGenerator.createDirectory(this.argv.outputDirectory);
      // This method is synchronous, so the wrapping promise just provices uniformity
      // with the other methods of the class
      FileGenerator.createFileFromTemplate(DEFAULT_CONFIG_TEMPLATE_PATH, null, targetPath);
      resolve(targetPath);
    });
  }
};
