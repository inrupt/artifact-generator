require('mock-local-storage');
const { PET_ROCK } = require('@lit/generated-vocab-pet-rock');

console.log(`What is Pet Rock 'shinyness'?\n`);

console.log(`Our vocabulary describes it as:`);
console.log(`"${PET_ROCK.shinyness.comment}"\n`);

console.log(`Or in Spanish (our Pet Rock vocab has Spanish translations!):`);
console.log(`"${PET_ROCK.shinyness.commentInLang('es')}"`);
