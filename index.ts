const Generator = require('./src/generator');

var inquirer = require("inquirer");

const argv = require('yargs')
    .array('i')
    .alias('i', 'input')
    .describe('i', 'One or more ontology files that will be used to build Vocab Terms from.')
    .default('i', [])

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

    .strict()
    .argv


const generator = new Generator(argv);

// Craft questions to present to users
const questions = [
    {
        type : 'input',
        name : 'name',
        message : 'Enter name of the output module ...',
        default : 'lit-generated-vocab-'
    },
    {
        type : 'input',
        name : 'version',
        message : 'Enter artifact version ...',
        default : argv.artifactVersion
    },
    // {
    //     type : 'input',
    //     name : 'phone',
    //     message : 'Enter phone number ...'
    // },
    // {
    //     type : 'input',
    //     name : 'email',
    //     message : 'Enter email address ...'
    // }
];
inquirer.prompt(questions).then(answers => {

    // Use user feedback for... whatever!!
    console.log(answers);

    argv.artifactVersion = answers.version;
    generator.generate().catch(error => console.log(`Generation process failed: [${error}]`));

});

