const Generator = require('./src/generator');

const CommandLine = require('./src/command-line');

const argv = require('yargs')
  .array('input')
  .alias('input', 'i')
  .describe('input', 'One or more ontology files that will be used to build Vocab Terms from.')
  .demandOption(
    'input',
    'At least one input vocabulary (i.e. RDF file) is required (since we have nothing to generate from otherwise!).'
  )
  .alias('litVocabTermVersion', 'lv')
  .describe('litVocabTermVersion', 'The version of the LIT Vocab Term to depend on.')
  .default('litVocabTermVersion', '^1.0.10')

  .alias('outputDirectory', 'o')
  .describe('outputDirectory', 'The output directory for the generated artifact.')
  .default('outputDirectory', './generated')

  .boolean('install')
  .alias('install', 'in')
  .describe(
    'install',
    'If set, will attempt to NPM install the generated artifact from within the output directory.'
  )
  .default('install', false)

  .boolean('publish')
  .alias('publish', 'p')
  .describe('publish', 'If set, will attempt to publish to the configured NPM registry.')
  .default('publish', false)

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
  .default('runWidoco', false)

  // Can't provide an explicit version, and then also request a version bump!
  .conflicts('artifactVersion', 'bumpVersion')
  .strict().argv;

const generator = new Generator(argv);

function handleError(error) {
  console.log(`Generation process failed: [${error}]`);
  console.error(error);
}

generator
  .generate(CommandLine.askForArtifactInfo)
  .then(CommandLine.askForArtifactVersionBumpType)
  .then(CommandLine.askForArtifactToBeInstalled)
  .then(CommandLine.askForArtifactToBePublished)
  .then(CommandLine.askForArtifactToBeDocumented)
  .catch(handleError);
