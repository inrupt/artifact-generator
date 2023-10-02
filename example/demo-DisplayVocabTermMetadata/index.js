// Pull in our 'Pet Rock' vocabulary from our generated bundle.
const { PET_ROCK } = require("my-generated-vocab-bundle");

// Pull in the W3C Time vocabulary from our generated bundle.
const { TIME } = require("my-generated-vocab-bundle");
// Pull in our cherry-picked terms from Schema.org that have translations into
// multiple languages.
const { SCHEMA_INRUPT } = require("my-generated-vocab-bundle");

const logQ = msg => console.log(`Question: ${msg}`);
const logA = msg => console.log(`Answer: ${msg}`);
const logSpacer = () => console.log();

/**************************************************
 * So now let's ask some questions of our vocab...
 **************************************************/
logQ(`What is a Pet Rock?`);

logA(`(Our 'Pet Rock' vocabulary describes it as):`);
logA(`  ${PET_ROCK.PetRock.comment}`);
logA(
  `(This vocab identifies what it means by a 'Pet Rock' using the IRI: ${PET_ROCK.PetRock})`
);

logSpacer();
logQ(
  `What is meant by a Pet Rock's 'shininess' (in Spanish, if you can, please)?`
);
logA(
  `(Well, our vocab tells us that a Pet Rock's 'shininess', in Spanish, is):`
);
logA(`  ${PET_ROCK.shininess.asLanguage("es").comment}`);
logA(`(In English, that would be):`);
logA(`  ${PET_ROCK.shininess.comment}`);
logA(
  `(Our vocab gives the property 'shiniess' the globally unique, de-reference-able identifier: ${PET_ROCK.shininess})`
);

logSpacer();
logA(
  `(By the way, our vocab also thinks we might also wish to 'see also' these related links):`
);
const valueSet = PET_ROCK.shininess.seeAlso.values();
for (const val of valueSet) {
  logA(` - ${val.value}`);
}

logSpacer();
logQ(`What does the W3C Time vocab mean by a "TimeZone"?`);
logA(`(Well, the W3C Time vocab tells us it's):`);
logA(`  ${TIME.TimeZone.comment}`);

logSpacer();
logQ(`And in Spanish...?`);
logA(`(Well, the Time vocab tells us it's):`);
logA(`  ${TIME.TimeZone.asLanguage("es").comment}`);

logSpacer();
logQ(`What does Schema.org mean by a 'Person' (but in Italian please)?`);
logA(
  `(Well, Schema.org only provides English descriptions, but our Inrupt extension conveniently tells us):`
);
logA(`  ${SCHEMA_INRUPT.Person.asLanguage("it").comment}`);
logA(`(In English, that would be):`);
logA(`  ${SCHEMA_INRUPT.Person.comment}`);

logSpacer();
logQ(`Do you know what Schema.org means by a 'Person' in Slovak...?`);
logA(
  `(Well no, Inrupt doesn't yet provide Slovak translations, but we'll seamlessly fallback to English):`
);
logA(`  ${SCHEMA_INRUPT.Person.asLanguage("sk").comment}`);

logSpacer();
logQ(`Is the term 'Person' in Schema.org a Class or Property...?`);
logA(`  Is it a Class: [${SCHEMA_INRUPT.Person.isRdfClass}]`);
logA(`  Is it a Property: [${SCHEMA_INRUPT.Person.isRdfProperty}]`);
SCHEMA_INRUPT.Person.type.forEach((elem) => logA(`  Types: [${elem.value}]`));


logSpacer();
logQ(`Is the term 'shininess' in PetRock a Class or Property...?`);
logA(`  Is it a Class: [${PET_ROCK.shininess.isRdfClass}]`);
logA(`  Is it a Property: [${PET_ROCK.shininess.isRdfProperty}]`);
PET_ROCK.shininess.type.forEach((elem) => logA(`  Types: [${elem.value}]`));
