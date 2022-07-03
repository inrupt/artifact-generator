// Get colored output messages.
process.env.DEBUG = "*";
const debugQ = require('debug')('Question:');
const debugA = require('debug')('Answer:');

// Pull in our 'Pet Rock' vocabulary from our generated bundle.
const { PET_ROCK } = require('my-generated-vocab-bundle');

debugQ(`What is a Pet Rock?`);

debugA(`Our locally defined Pet Rock vocabulary describes it as: [${PET_ROCK.PetRock.comment}]`);
debugA(`(This vocab identifies what it means by a 'Pet Rock' using the IRI identifier: [${PET_ROCK.PetRock.value}])`);


console.log();
debugQ(`What is meant by a Pet Rock's 'shininess' (in Spanish, if you can)?`);

debugA(`Well, our vocab tells us that a Pet Rock's 'shininess', in Spanish, is: [${PET_ROCK.shininess.asLanguage('es').comment}]`);
debugA(`(In English, that would be: [${PET_ROCK.shininess.comment}])`);
debugA(`(Our vocab also thinks we might also wish to see this related link: [${[...PET_ROCK.shininess.seeAlso.values()][0].value}])`);


// Pull in the W3C Time vocabulary from our generated bundle.
const { TIME } = require('my-generated-vocab-bundle');

console.log();
debugQ(`What does the W3C Time vocab mean by a "TimeZone"?`);
debugA(`Well, the W3C Time vocab tells us it's: [${TIME.TimeZone.comment}]`);

console.log();
debugQ(`And in Spanish...?`);
debugA(`Well, the Time vocab tells us it's: [${TIME.TimeZone.asLanguage('es').comment}]`);


// Pull in our cherry-picked terms from Schema.org that have translations into
// multiple languages.
const { SCHEMA_INRUPT } = require('my-generated-vocab-bundle');

console.log();
debugQ(`What does Schema.org mean by a 'Person' (but in Italian please)?`);
debugA(`Well, our Inrupt extension conveniently tells us that it's: [${SCHEMA_INRUPT.Person.asLanguage('it').comment}]`);
debugA(`(In English, that would be: [${SCHEMA_INRUPT.Person.comment}])`);

console.log();
debugQ(`Do you know what Schema.org means by a 'Person' in Slovak...?`);
debugA(`Well no, Inrupt doesn't yet provide Slovak translation, so we should fallback to English: [${SCHEMA_INRUPT.Person.asLanguage('sk').comment}]`);
