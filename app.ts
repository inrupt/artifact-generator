const fs = require('fs');
const Handlebars = require('handlebars');


fs.readFile('templates/template.hbs', function read(err, data) {
    if (err) {
        throw err;
    }

	var template = Handlebars.compile(data.toString());
	
	var input = {ontologyComment: 'The LIT Core Ontology. The LIT is intended to be a collection of utility libraries to ease the adoption of RDF for developers.',
		ontologyNameUppercase: 'SCHEMA-EXT',
		namespace: 'http://schema.org/',
		class: [{name: 'Person', constant: 'A person (alive, dead, undead, or fictional).',
					labels:[{literal: "Person", language: 'en'},
							{literal: "Persono", language: 'fr'}],
					comments:[{literal: "A Person.", language: 'en'},
							{literal: "A Persono.", language: 'fr'}]
							},
				{name: 'Entity', constant: 'A entity could be a person or an orgainization.',
					labels:[{literal: "Entity", language: 'en'},
							{literal: "Entitieie", language: 'fr'}],
					comments:[{literal: "A Entity.", language: 'en'},
							{literal: "A Entitieie.", language: 'fr'}]
							}
		],

		property: [{name: 'givenName', constant: 'A persons given name.',
						labels:[{literal: "Given Name", language: 'en'},
								{literal: "Giveno Namo", language: 'fr'}],
						comments:[{literal: "A Persons given name.", language: 'en'},
								{literal: "A Persono given nameo.", language: 'fr'}]
					},
					{name: 'familyName', constant: 'A entity could be a person or an orgainization.',
						labels:[{literal: "Entity", language: 'en'},
								{literal: "Entitieie", language: 'fr'}],
						comments:[{literal: "A Entity.", language: 'en'},
								{literal: "A Entitieie.", language: 'fr'}]
					}
		]
	};

	var contents = template(input);

	fs.writeFile('generated/schema-ext.ts', contents, err => {
	    if (err) {
	        return console.error('Failed to store template: ${err.message}.');
	    }
	    console.log('Saved template!');
	});

});

