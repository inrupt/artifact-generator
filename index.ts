const Generator = require('./src/generator');

var inquirer = require('inquirer');

const { execSync } = require('child_process');

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

async function askForArtifactInfo(data) {
  // Craft questions to present to users
  const questions = [
    {
      type: 'input',
      name: 'artifactName',
      message: 'Artifact name ...',
      default: data.artifactName,
    },
    {
      type: 'input',
      name: 'author',
      message: 'Artifact author ...',
      default: data.author,
    },
  ];

  const artifactInfoAnswers = await inquirer.prompt(questions);

  data = { ...data, ...artifactInfoAnswers }; //Merge the answers in with the data

  findPublishedVersionOfModule(data);

  return data;
}

function findPublishedVersionOfModule(data) {
  try {
    let publishedVersion = execSync(`npm view ${data.artifactName} version`)
      .toString()
      .trim();

    data.publishedVersion = publishedVersion;
    data.version = publishedVersion;
    return publishedVersion;
  } catch (error) {
    // Its ok to ignore this. It just means that module has not been published before.
  }
}

async function askForArtifactVersionBumpType(data) {
  const bumpQuestion = [
    {
      type: 'list',
      name: 'bump',
      message: `Current artifact version in registry is ${data.publishedVersion}. Do you want to bump the version?`,
      choices: ['patch', 'minor', 'major', 'no'],
    },
  ];

  const answer = await inquirer.prompt(bumpQuestion);

  if (answer.bump && answer.bump !== 'no') {
    execSync(`cd generated && npm version ${answer.bump}`);
    console.log(`Artifact (${data.artifactName}) version has been updated (${answer.bump}).`)
  }

  return { ...data, ...answer }; //Merge the answers in with the data and return
}

async function askForArtifactToBePublished(data) {
  const publishQuestion = [
    {
      type: 'confirm',
      name: 'publish',
      message: `Do you want to publish ${data.artifactName} to the registry ${argv.npmRegistry}?`,
      default: false,
    },
  ];

  const answer = await inquirer.prompt(publishQuestion);

  if (answer.publish) {
    execSync(`cd generated && npm publish --registry ${argv.npmRegistry}`);
    console.log(`Artifact (${data.artifactName}) has been published to ${argv.npmRegistry}.`);
  }

  return { ...data, ...answer }; //Merge the answers in with the data and return
}

function handleError(error) {
  console.log(`Generation process failed: [${error}]`);
}

generator
  .generate(askForArtifactInfo)
  .then(askForArtifactVersionBumpType)
  .then(askForArtifactToBePublished)
  .catch(handleError);
