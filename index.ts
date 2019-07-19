const Generator = require('./src/generator');

const CommandLine = require('./src/command-line');

const argv = require('yargs')
  .array('i')
  .alias('i', 'input')
  .describe('i', 'One or more ontology files that will be used to build Vocab Terms from.')
  .demandOption(
    'input',
    'At least one input vocabulary (i.e. RDF file) is required (since we have nothing to generate from otherwise!).'
  )
  .string('lv')
  .alias('lv', 'litVersion')
  .describe('litVersion', 'The version of the LIT Vocab Term to depend on.')
  .demandOption(
    'litVersion',
    "You MUST provide a version string for the LIT Vocab Term dependency (you can provide a direct 'file:' link too if you wish to depend on a local copy)."
  )

  .string('o')
  .alias('o', 'outputDirectory')
  .describe('o', 'The output directory for the generated artifact.')
  .default('o', './generated')

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

  .string('bumpVersion')
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

  .string('vtf')
  .alias('vtf', 'vocabTermsFrom')
  .describe('vtf', 'Generates Vocab Terms from only the specified ontology file.')

  .string('av')
  .alias('av', 'artifactVersion')
  .describe('artifactVersion', 'The version of the Node module that will be generated.')
  .default('artifactVersion', '1.0.1')

  .alias('at', 'artifactType')
  .describe('artifactType', 'The artifact type that will be generated.')
  .choices('artifactType', ['nodejs']) // Add to this when other languages are supported.
  .default('artifactType', 'nodejs')

  .alias('mnp', 'moduleNamePrefix')
  .describe('mnp', 'A prefix for the name of the output module')
  .default('mnp', '@lit/generated-vocab-')

  .alias('nr', 'npmRegistry')
  .describe('nr', 'The NPM Registry where artifacts will be published')
  // .default('nr', 'https://verdaccio.inrupt.com')

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
  .catch(handleError);
