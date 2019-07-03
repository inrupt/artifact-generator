const gen = require('./src/generator.js');


const argv = require('yargs')
    .array('input')
    .argv


gen.generate(argv.input || [], argv.mversion || '1.0.0', argv.subjects);



