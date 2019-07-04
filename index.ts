const gen = require('./src/generator.js');


const argv = require('yargs')
    .array('input')
    .alias('input', 'in')
    .describe('input', 'One or more ontology files that will be used to build Vocab Terms from.')
    .string('vocabTermsFrom')
    .alias('vocabTermsFrom', 'vtf')
    .describe('vocabTermsFrom', 'Generates Vocab Terms from only the specified ontology file.')
    .string('mversion')
    .alias('mversion', 'mver')
    .describe('mversion', 'The version of the Node module that will be built')
    .strict()
    .argv


gen.generate(argv.input || [], argv.mversion || '1.0.0', argv.generateVocabTermsFrom);



