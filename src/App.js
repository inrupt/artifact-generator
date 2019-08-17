const debug = require('debug');
const ArtifactGenerator = require('./generator/ArtifactGenerator');
const CommandLine = require('./CommandLine');

const logger = debug('lit-artifact-generator:App');

module.exports = class App {
  constructor(yargsConfig) {
    if (!yargsConfig) {
      throw new Error('Application must be initialised with a configuration - none was provided.');
    }

    this.yargsConfig = yargsConfig;
  }

  async run() {
    // Process the YARGS config data...
    this.argv = this.yargsConfig.argv;

    if (!this.argv.inputResources && !this.argv.vocabListFile) {
      this.yargsConfig.showHelp();
      debug.enable('lit-artifact-generator:*');
      logger(`\nInvalid inputs.`);
      throw new Error(
        "You must provide input, either a single vocabulary using '--inputResources' (e.g. a local RDF file, or a URL that resolves to an RDF vocabulary), or a YAML file using '--vocabListFile' listing multiple vocabularies."
      );
    }

    // Unless specifically told to be quiet (i.e. no logging output, although that
    // will still be overridden by the DEBUG environment variable!), then
    // determine if any generator-specific namespaces have been enabled. If they
    // haven't been, then turn them all on,
    if (!this.argv.quiet) {
      // Retrieve all currently enabled debug namespaces (and then restore them!).
      const namespaces = debug.disable();
      debug.enable(namespaces);

      // Unless our generator's debug logging has been explicitly configured, turn
      // all debugging on.
      if (namespaces.indexOf('lit-artifact-generator') === -1) {
        debug.enable('lit-artifact-generator:*');
      }
    }

    const artifactGenerator = new ArtifactGenerator(this.argv, CommandLine.askForArtifactInfo);

    return (
      artifactGenerator
        .generate()
        .then(CommandLine.askForArtifactToBeNpmVersionBumped)
        // .then(await CommandLine.askForArtifactToBeYalced)
        .then(CommandLine.askForArtifactToBeNpmInstalled)
        .then(CommandLine.askForArtifactToBeNpmPublished)
        .then(CommandLine.askForArtifactToBeDocumented)
    );
  }
};
