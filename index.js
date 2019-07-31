#!/usr/bin/env node

// Normally we'd only want to mock out local storage for testing, but in this
// case we want to use our LIT-generated vocabularies that depend on
// localStorage for runtime context (e.g. the currently selected language).
// So since we want to use those vocabularies in our Node application here,
// they need a mocked local storage to work with.
require('mock-local-storage')
const yargs = require('yargs')

const ArtifactGenerator = require('./src/generator/ArtifactGenerator');

const CommandLine = require('./src/CommandLine');

const argv = yargs
  .array('input')
  .alias('input', 'i')
  .describe('input', 'One or more ontology files that will be used to build Vocab Terms from.')
  // Not mandatory, since we want the option of a vocab list file too...
  // .demandOption(
  //   'input',
  //   'At least one input vocabulary (i.e. RDF file) is required (since we have nothing to generate from otherwise!).'
  // )

  .alias('vocabListFile', 'l')
  .describe('vocabListFile', 'Name of a file providing a list of individual vocabs (one per line) to bundle together into one artifact.')

  .alias('litVocabTermVersion', 'lv')
  .describe('litVocabTermVersion', 'The version of the LIT Vocab Term to depend on.')
  .default('litVocabTermVersion', '^0.1.0')

  .alias('outputDirectory', 'o')
  .describe('outputDirectory', 'The output directory for the generated artifact.')
  .default('outputDirectory', './generated')

  .boolean('runNpmInstall')
  .alias('runNpmInstall', 'in')
  .describe(
    'runNpmInstall',
    'If set, will attempt to NPM install the generated artifact from within the output directory.'
  )
  .default('runNpmInstall', false)

  .boolean('runNpmPublish')
  .alias('runNpmPublish', 'p')
  .describe('runNpmPublish', 'If set, will attempt to publish to the configured NPM registry.')
  .default('runNpmPublish', false)

  .alias('bumpVersion', 'b')
  .describe(
    'bumpVersion',
    'Bump up the semantic version of the artifact from the currently published version.'
  )
  .choices('bumpVersion', ['patch', 'minor', 'major'])

  .boolean('noprompt')
  .alias('noprompt', 'np')
  .describe(
    'noprompt',
    'If set, will not ask any interactive questions and will attempt to perform artifact generation automatically.'
  )
  .default('noprompt', false)

  .alias('vocabTermsFrom', 'vtf')
  .describe('vocabTermsFrom', 'Generates Vocab Terms from only the specified ontology file.')

  .alias('artifactVersion', 'av')
  .describe('artifactVersion', 'The version of the Node module that will be generated.')
  .default('artifactVersion', '1.0.1')

  .alias('artifactType', 'at')
  .describe('artifactType', 'The artifact type that will be generated.')
  .choices('artifactType', ['nodejs']) // Add to this when other languages are supported.
  .default('artifactType', 'nodejs')

  .alias('moduleNamePrefix', 'mnp')
  .describe('moduleNamePrefix', 'A prefix for the name of the output module')
  .default('moduleNamePrefix', '@lit/generated-vocab-')

  .alias('npmRegistry', 'nr')
  .describe('npmRegistry', 'The NPM Registry where artifacts will be published')
  .default('npmRegistry', 'https://verdaccio.inrupt.com')

  .boolean('runWidoco')
  .alias('runWidoco', 'w')
  .describe(
    'runWidoco',
    'If set, will run Widoco to generate documentation for this vocabulary.'
  )

  // Can't provide an explicit version, and then also request a version bump!
  .conflicts('artifactVersion', 'bumpVersion')

  // Must provide either an input vocab file, or a file containing a list of vocab files (but how can we demand at
  // least one of these two...?)
  .conflicts('input', 'vocabListFile')
  .strict().argv;

function handleError(error) {
  console.log(`Generation process failed: [${error}]`);
  console.error(error);
}

if (!argv.input && !argv.vocabListFile) {
  yargs.showHelp();
  console.log("\nYou must provide input, either a single vocabulary using '-input' (e.g. a local RDF file, or a URL that resolves to an RDF vocabulary), or a YAML file using '-inputVocabFile' listing multiple vocabularies.")
} else {
  const artifactGenerator = new ArtifactGenerator(argv, CommandLine.askForArtifactInfo);
  artifactGenerator
    .generate()
    .then(CommandLine.askForArtifactToBeNpmVersionBumped)
    // .then(await CommandLine.askForArtifactToBeYalced)
    .then(CommandLine.askForArtifactToBeNpmInstalled)
    .then(CommandLine.askForArtifactToBeNpmPublished)
    .then(CommandLine.askForArtifactToBeDocumented)
    .catch(handleError);
}
