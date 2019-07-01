const gen = require('./generator.ts');


//gen.generate(['./vocabs/schema.ttl', './vocabs/schema-ext.ttl'], '1.0.0', './vocabs/schema-ext.ttl');


gen.generate(['./vocabs/owl.ttl'], '1.0.0');


//gen.generate(['http://www.w3.org/2002/07/owl'], '1.0.0');


