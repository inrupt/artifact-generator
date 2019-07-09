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

  .strict().argv;

const generator = new Generator(argv);
generator
  .generate(data => {



    // Craft questions to present to users
    const questions = [
      {
        type: 'input',
        name: 'name',
        message: 'Artifact name ...',
        default: data.artifactName,
      },
      // {
      //   type: 'expand',
      //   name: 'version',
      //   message: `Do you want to increment the artifact version? Current version is: (${data.artifactVersion})`,
      //   choices: ['patch (1.0.1)', 'minor (1.1.0)', 'major (2.0.0)'],
      //   default: data.artifactVersion,
      // },
      {
        type: 'input',
        name: 'author',
        message: 'Artifact author ...',
        default: data.author,
      },
    ];

    return inquirer.prompt(questions).then(answers1 => {

      let currentVersion = execSync(`npm view ${data.artifactName} version`).toString().trim();
      //console.log("Current version is: " + currentVersion);

      answers1.version = currentVersion;

      return inquirer.prompt([
        {
          type: 'list',
          name: 'bump',
          message: `Current artifact version in registry is ${currentVersion}. Do you want to bump the version?`,
          choices: ['patch', 'minor', 'major', 'no']

        }]).then(answers2 => {
        return new Promise((resolve, reject) => {
          resolve({ ...data, ...answers1, ...answers2 });
        });
      });
    });
  })
    .then(data => {
      if(data.bump !== 'no') {
        execSync(`cd generated && npm version ${data.bump}`);
        execSync(`cd generated && npm publish --registry http://localhost:4873`);
        //console.log(output)
      }
    })
  .catch(error => console.log(`Generation process failed: [${error}]`));
