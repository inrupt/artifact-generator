const fs = require('fs');
const Handlebars = require('handlebars');

const rdf = require('rdf-ext')
const { LitUtils } = require('lit-vocab-term')


fs.readFile('templates/template.hbs', function read(err, data) {
    if (err) {
        throw err;
    }

	var template = Handlebars.compile(data.toString());
	

	const classes = [];
	const properties = [];

	const result = {};
	result.classes = classes;
	result.properties = properties;
	result.namespace = 'http://schema.org/'; //TODO read this from the data


	LitUtils.loadTurtleFile('C:/Users/holleranj/development/LIT/vocab/rdf/OntologyDirMarker/schema-ext.ttl', function (data) {
	    
	    data.match(null, null, rdf.namedNode('http://www.w3.org/2000/01/rdf-schema#Class')).filter((quad) => {
	    	classes.push(handleTerms(data, quad));
	    });

	    data.match(null, null, rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property')).filter((quad) => {
			
			properties.push(handleTerms(data, quad));
	    });



		//console.log('Result : ' + JSON.stringify(result, null, ' '));


		var contents = template(result);

		fs.writeFile('generated/schema-ext.ts', contents, err => {
		    if (err) {
		        return console.error('Failed to store template: ${err.message}.');
		    }
		    console.log('Saved template!');
		});

	});

});

function handleTerms(data, quad) {
	const labels = [];
	data.match(quad.subject, rdf.namedNode('http://www.w3.org/2000/01/rdf-schema#label'), null).filter((subQuad) => {
		add(labels, subQuad);
	});

	
	const alternateName = [];
	data.match(quad.subject, rdf.namedNode('http://schema.org/alternateName'), null).filter((subQuad) => {
		add(alternateName, subQuad);
	});

	const comments = [];
	data.match(quad.subject, rdf.namedNode('http://www.w3.org/2000/01/rdf-schema#comment'), null).filter((subQuad) => {
		add(comments, subQuad);
	});

	return {name: labels[0].value,
				comment: comments[0].value,
				labels: labels,
				alternateName: alternateName,
				comments: comments};
}

function add(array, quad) {
	array.push({
		value: quad.object.value,
		language: quad.object.language
	});
}