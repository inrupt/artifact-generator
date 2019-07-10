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

  .string('o')
  .alias('o', 'outputDirectory')
  .describe('o', 'The output directory for the generated artifact.')
  .default('o', './generated')

  .string('vtf')
  .alias('vtf', 'vocabTermsFrom')
  .describe('vtf', 'Generates Vocab Terms from only the specified ontology file.')

  .string('av')
  .alias('av', 'artifactVersion')
  .describe('av', 'The version of the Node module that will be built.')
  .default('av', '1.0.1')

  .alias('at', 'artifactType')
  .describe('at', 'The artifact type that will be generated.')
  .choices('at', ['nodejs']) // Add to this when other languages are supported.
  .default('at', 'nodejs')

  .alias('mnp', 'moduleNamePrefix')
  .describe('mnp', 'A prefix for the name of the output module')
  .default('mnp', 'lit-generated-vocab-')

  .alias('nr', 'npmRegistry')
  .describe('nr', 'The NPM Registry where artifacts will be published')
  .default('nr', 'http://localhost:4873')

  .strict().argv;

const generator = new Generator(argv);
const commandLine = new CommandLine(argv);

function handleError(error) {
  console.log(`Generation process failed: [${error}]`);
}

generator
  .generate(CommandLine.askForArtifactInfo)
  .then(CommandLine.askForArtifactVersionBumpType)
  .then(commandLine.askForArtifactToBePublished)
  .catch(handleError);
