// Get colored output messages.
process.env.DEBUG = "*";
const debug = require("debug");

const debugQ = debug("Question:");
const debugA = debug("Answer:");
const debugSpacer = () => debug("")("");

// Pull in our 'Pet Rock' vocabulary from our generated bundle.
const { PET_ROCK } = require("my-generated-vocab-bundle");

debugQ(`What is a Pet Rock?`);

debugA(
  `Our locally defined Pet Rock vocabulary describes it as: [${PET_ROCK.PetRock.comment}]`
);
debugA(
  `(This vocab identifies what it means by a 'Pet Rock' using the IRI identifier: [${PET_ROCK.PetRock}])`
);

debugSpacer();
debugQ(
  `What is meant by a Pet Rock's 'shininess' (in Spanish, if you can, please)?`
);

debugA(
  `Well, our vocab tells us that a Pet Rock's 'shininess', in Spanish, is: [${
    PET_ROCK.shininess.asLanguage("es").comment
  }]`
);
debugA(`(In English, that would be: [${PET_ROCK.shininess.comment}])`);
debugA(
  `(With our vocab giving the property 'shiniess' the globally unique, de-reference-able identifier: [${PET_ROCK.shininess}])`
);

debugSpacer();
debugA(
  `By the way, our vocab also thinks we might also wish to 'see also' these related links:`
);
const valueSet = PET_ROCK.shininess.seeAlso.values();
for (const val of valueSet) {
  debugA(` - ${val.value}`);
}
//[${[...][0].value}])`);

// Pull in the W3C Time vocabulary from our generated bundle.
const { TIME } = require("my-generated-vocab-bundle");

debugSpacer();
debugQ(`What does the W3C Time vocab mean by a "TimeZone"?`);
debugA(`Well, the W3C Time vocab tells us it's: [${TIME.TimeZone.comment}]`);

debugSpacer();
debugQ(`And in Spanish...?`);
debugA(
  `Well, the Time vocab tells us it's: [${
    TIME.TimeZone.asLanguage("es").comment
  }]`
);

// Pull in our cherry-picked terms from Schema.org that have translations into
// multiple languages.
const { SCHEMA_INRUPT } = require("my-generated-vocab-bundle");

debugSpacer();
debugQ(`What does Schema.org mean by a 'Person' (but in Italian please)?`);
debugA(
  `Well, Schema.org only provides English descriptions, but our Inrupt extension conveniently tells us: [${
    SCHEMA_INRUPT.Person.asLanguage("it").comment
  }]`
);
debugA(`(In English, that would be: [${SCHEMA_INRUPT.Person.comment}])`);

debugSpacer();
debugQ(`Do you know what Schema.org means by a 'Person' in Slovak...?`);
debugA(
  `Well no, Inrupt doesn't yet provide Slovak translations, but we'll seamlessly fallback to English: [${
    SCHEMA_INRUPT.Person.asLanguage("sk").comment
  }]`
);
