#!/usr/bin/env node

// Normally we'd only want to mock out local storage for testing, but in this
// case we want to use our LIT-generated vocabularies that depend on
// localStorage for runtime context (e.g. the currently selected language).
// So since we want to use those vocabularies in our Node application here,
// they need a mocked local storage to work with.
require('mock-local-storage');

const logger = require('debug')('lit-artifact-generator:index');
const yargs = require('yargs');
const App = require('./src/App');

console.log(`Command: [${process.argv.join(' ')}]`);
const yargsConfig = yargs
  .alias('i', 'inputResources')
  .array('inputResources')
  .describe(
    'inputResources',
    "One or more ontology resources (i.e. local RDF files, or HTTP URI's) used to generate source-code artifacts representing the contained vocabulary terms."
  )

  .alias('l', 'vocabListFile')
  .describe(
    'vocabListFile',
    'Name of a file providing a list of individual vocabs (one per line) to bundle together into one artifact.'
  )

  .alias('lv', 'litVocabTermVersion')
  .describe('litVocabTermVersion', 'The version of the LIT Vocab Term to depend on.')
  .default('litVocabTermVersion', '^0.1.0')

  .alias('o', 'outputDirectory')
  .describe('outputDirectory', 'The output directory for the generated artifacts.')
  .default('outputDirectory', './generated')

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

  .alias('np', 'noprompt')
  .boolean('noprompt')
  .describe(
    'noprompt',
    'If set will not ask any interactive questions and will attempt to perform artifact generation automatically.'
  )
  .default('noprompt', false)

  .alias('q', 'quiet')
  .boolean('quiet')
  .describe(
    'quiet',
    `If set will not display logging output to console (but you can still use DEBUG environment variable, set to 'lit-artifact-generator:*').`
  )
  .default('quiet', false)

  .alias('vtf', 'vocabTermsFrom')
  .describe('vocabTermsFrom', 'Generates Vocab Terms from only the specified ontology file.')

  .alias('av', 'artifactVersion')
  .describe('artifactVersion', 'The version of the Node module that will be generated.')
  .default('artifactVersion', '0.0.1')

  .alias('at', 'artifactType')
  .describe('artifactType', 'The artifact type that will be generated.')
  .choices('artifactType', ['nodejs']) // Add to this when other languages are supported.
  .default('artifactType', 'nodejs')

  .alias('mnp', 'moduleNamePrefix')
  .describe('moduleNamePrefix', 'A prefix for the name of the output module')
  .default('moduleNamePrefix', '@lit/generated-vocab-')

  .alias('nr', 'npmRegistry')
  .describe('npmRegistry', 'The NPM Registry where artifacts will be published')
  .default('npmRegistry', 'https://verdaccio.inrupt.com')

  .alias('w', 'runWidoco')
  .boolean('runWidoco')
  .describe('runWidoco', 'If set will run Widoco to generate documentation for this vocabulary.')

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
  .strict();

new App(yargsConfig)
  .run()
  .then(data => {
    logger(`\nGeneration process successful to directory [${data.outputDirectory}]!`);
    process.exit(0);
  })
  .catch(error => {
    logger(`Generation process failed: [${error}]`);
    process.exit(-1);
  });
