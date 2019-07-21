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
  .string('litVocabTermVersion')
  .alias('litVocabTermVersion', 'lv')
  .describe('litVocabTermVersion', 'The version of the LIT Vocab Term to depend on.')
  .default('litVocabTermVersion', '^1.0.10')

  .string('o')
  .alias('o', 'outputDirectory')
  .describe('o', 'The output directory for the generated artifact.')
  .default('o', './generated')

  .string('vtf')
  .alias('vtf', 'vocabTermsFrom')
  .describe('vtf', 'Generates Vocab Terms from only the specified ontology file.')

  .string('artifactVersion')
  .alias('artifactVersion', 'av')
  .describe('artifactVersion', 'The version of the Node module that will be generated.')
  .default('artifactVersion', '1.0.1')

  .alias('artifactType', 'at')
  .describe('artifactType', 'The artifact type that will be generated.')
  .choices('artifactType', ['nodejs']) // Add to this when other languages are supported.
  .default('artifactType', 'nodejs')

  .alias('mnp', 'moduleNamePrefix')
  .describe('mnp', 'A prefix for the name of the output module')
  .default('mnp', '@lit/generated-vocab-')

  .alias('nr', 'npmRegistry')
  .describe('nr', 'The NPM Registry where artifacts will be published')
  .default('nr', 'https://verdaccio.inrupt.com')

  .strict().argv;

const generator = new Generator(argv);

function handleError(error) {
  console.log(`Generation process failed: [${error}]`);
  console.error(error);
}

generator
  .generate(CommandLine.askForArtifactInfo)
  .then(CommandLine.askForArtifactVersionBumpType)
  .then(CommandLine.askForArtifactToBePublished)
  .catch(handleError);
