const gen = require('./src/generator.js');


//gen.generate(['./vocabs/schema.ttl', './vocabs/schema-inrupt-ext.ttl'], '1.0.0', './vocabs/schema-inrupt-ext.ttl');


gen.generate(['./vocabs/vcard.ttl', './vocabs/vcard-inrupt-ext.ttl'], '1.0.0', './vocabs/vcard-inrupt-ext.ttl');


//gen.generate(['http://www.w3.org/2002/07/owl'], '1.0.0');


