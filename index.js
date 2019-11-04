#!/usr/bin/env node

// Normally we'd only want to mock out local storage for testing, but in this
// case we want to use our LIT-generated vocabularies that depend on
// localStorage for runtime context (e.g. the currently selected language).
// So since we want to use those vocabularies in our Node application here,
// they need a mocked local storage to work with.
require('mock-local-storage');

const logger = require('debug')('lit-artifact-generator:index');
const debug = require('debug');
const yargs = require('yargs');
const App = require('./src/App');
const { GENERATE_COMMAND, INITIALIZE_COMMAND } = require('./src/App');

const SUPPORTED_COMMANDS = [GENERATE_COMMAND, INITIALIZE_COMMAND];

function validateCommandLine(argv, options) {
  // argv._ contains the commands passed to the program
  if (argv._.length !== 1) {
    // Only one command is expected
    throw new Error(`Exactly one command is expected, one of [${SUPPORTED_COMMANDS}].`);
  }
  if (SUPPORTED_COMMANDS.indexOf(argv._[0]) === -1) {
    throw new Error(
      `Unknown command: [${
        argv._[0]
      }] is not a recognized command. Expected one of ${SUPPORTED_COMMANDS}.`
    );
  }
  return true;
}

const yargsConfig = yargs
  .command(
    GENERATE_COMMAND,
    'generate code artifacts from RDF',
    yargs =>
      yargs
        .alias('i', 'inputResources')
        .array('inputResources')
        .describe(
          'inputResources',
          "One or more ontology resources (i.e. local RDF files, or HTTP URI's) used to generate source-code artifacts representing the contained vocabulary terms."
        )

        .alias('l', 'vocabListFile')
        .describe(
          'vocabListFile',
          'Name of a YAML file providing a list of individual vocabs to bundle together into a single artifact (or potentially multiple artifacts for multiple programming languages).'
        )

        .alias('lv', 'litVocabTermVersion')
        .describe('litVocabTermVersion', 'The version of the LIT Vocab Term to depend on.')
        .default('litVocabTermVersion', '^0.1.0')

        .alias('in', 'runNpmInstall')
        .boolean('runNpmInstall')
        .describe(
          'runNpmInstall',
          'If set will attempt to NPM install the generated artifact from within the output directory.'
        )
        .default('runNpmInstall', false)

        .alias('p', 'runNpmPublish')
        .boolean('runNpmPublish')
        .describe('runNpmPublish', 'If set will attempt to publish to the configured NPM registry.')
        .default('runNpmPublish', false)

        .alias('b', 'bumpVersion')
        .describe(
          'bumpVersion',
          'Bump up the semantic version of the artifact from the currently published version.'
        )
        .choices('bumpVersion', ['patch', 'minor', 'major'])

        .alias('vtf', 'vocabTermsFrom')
        .describe('vocabTermsFrom', 'Generates Vocab Terms from only the specified ontology file.')

        .alias('av', 'artifactVersion')
        .describe('artifactVersion', 'The version of the artifact(s) to be generated.')
        .default('artifactVersion', '0.0.1')

        .alias('mnp', 'moduleNamePrefix')
        .describe('moduleNamePrefix', 'A prefix for the name of the output module')
        .default('moduleNamePrefix', '@lit/generated-vocab-')

        .alias('nr', 'npmRegistry')
        .describe('npmRegistry', 'The NPM Registry where artifacts will be published')
        .default('npmRegistry', 'https://verdaccio.inrupt.com')

        .alias('w', 'runWidoco')
        .boolean('runWidoco')
        .describe(
          'runWidoco',
          'If set will run Widoco to generate documentation for this vocabulary.'
        )

        .alias('s', 'supportBundling')
        .boolean('supportBundling')
        .describe(
          'supportBundling',
          'If set will use bundling support within generated artifact (currently supports Webpack only).'
        )
        .default('supportBundling', true)
        // Can't provide an explicit version, and then also request a version bump!
        .conflicts('artifactVersion', 'bumpVersion')

        // Must provide either an input vocab file, or a file containing a list of vocab files (but how can we demand at
        // least one of these two...?)
        .conflicts('inputResources', 'vocabListFile')
        .strict(),
    argv => {
      if (!argv.inputResources && !argv.vocabListFile) {
        // this.yargsConfig.showHelp();
        logger(argv.help);
        debug.enable('lit-artifact-generator:*');
        throw new Error(
          "You must provide input, either a single vocabulary using '--inputResources' (e.g. a local RDF file, or a URL that resolves to an RDF vocabulary), or a YAML file using '--vocabListFile' listing multiple vocabularies."
        );
      }
      runGeneration(argv);
    }
  )
  .command(
    INITIALIZE_COMMAND,
    'initializes a config file used for generation',
    yargs => yargs,
    argv => {
      runInitialization(argv);
    }
  )
  // The following options are shared between the different commands
  .alias('q', 'quiet')
  .boolean('quiet')
  .describe(
    'quiet',
    `If set will not display logging output to console (but you can still use DEBUG environment variable, set to 'lit-artifact-generator:*').`
  )
  .default('quiet', false)

  .alias('np', 'noprompt')
  .boolean('noprompt')
  .describe(
    'noprompt',
    'If set will not ask any interactive questions and will attempt to perform artifact generation automatically.'
  )
  .default('noprompt', false)

  .alias('o', 'outputDirectory')
  .describe('outputDirectory', 'The output directory for the generated artifacts.')
  .default('outputDirectory', './generated')
  .check(validateCommandLine)
  .help().argv;

function configureLog(argv) {
  // Unless specifically told to be quiet (i.e. no logging output, although that
  // will still be overridden by the DEBUG environment variable!), then
  // determine if any generator-specific namespaces have been enabled. If they
  // haven't been, then turn them all on,
  if (!argv.quiet) {
    // Retrieve all currently enabled debug namespaces (and then restore them!).
    const namespaces = debug.disable();
    debug.enable(namespaces);

    // Unless our generator's debug logging has been explicitly configured, turn
    // all debugging on.
    if (namespaces.indexOf('lit-artifact-generator') === -1) {
      debug.enable('lit-artifact-generator:*');
    }
  }
}

function runGeneration(argv) {
  configureLog(argv);
  new App(argv)
    .run()
    .then(data => {
      logger(`\nGeneration process successful to directory [${data.outputDirectory}]!`);
      process.exit(0);
    })
    .catch(error => {
      logger(`Generation process failed: [${error}]`);
      process.exit(-1);
    });
}

function runInitialization(argv) {
  configureLog(argv);
  new App(argv)
    .init()
    .then(data => {
      logger(`\nSuccessfully initialized config file [${data}]`);
      process.exit(0);
    })
    .catch(error => {
      logger(`Generation process failed: [${error}]`);
      process.exit(-1);
    });
}
