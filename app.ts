const fs = require('fs');
const Handlebars = require('handlebars');

const rdf = require('rdf-ext')
const { LitUtils } = require('lit-vocab-term')


const { RDF, RDFS, SCHEMA, OWL } = require('vocab-lit')

function processVocab() {

	fs.readFile('templates/template.hbs', function read(err, data) {
		if (err) {
			throw err;
		}

		var template = Handlebars.compile(data.toString());

		LitUtils.loadTurtleFile('./vocabs/schema.ttl', (dataset) => {
			LitUtils.loadTurtleFile('./vocabs/schema-ext.ttl', (extensionDataset) => {

				const result = buildTemplateInput(dataset, extensionDataset);

				var contents = template(result);

				fs.writeFile('generated/schema-ext.ts', contents, err => {
					if (err) {
						return console.error('Failed to store template: ${err.message}.');
					}
					console.log('Saved template!');
				});
				
			});
		});


	});
}

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
				alternateNames: alternateName,
				comments: comments};
}

function add(array, quad) {
	array.push({
		value: quad.object.value,
		language: quad.object.language
	});
}

function buildTemplateInput(vocabData, vocabExtentionData) {

	const fullData = vocabData.merge(vocabExtentionData);

	const classes = [];
	const properties = [];

	const result = {};
	result.classes = classes;
	result.properties = properties;
	result.namespace = 'http://schema.org/'; //TODO read this from the data
	result.ontologyNameUppercase = "SCHEMA_EXT"


	const ontologyStatements = vocabExtentionData.match(null, rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
		rdf.namedNode('http://www.w3.org/2002/07/owl#Ontology')).toArray();
	// if (ontologyStatements.length != 1) {
	// 	throw new Error(`Must contain only 1 ontology, but found [${ontologyStatements.length}], i.e. ${ontologyStatements.toString()}]`)
	// }

	//const ontologySubject = ontologyStatements[0].subject.value
	//console.log(`ontologySubject: [${ontologySubject}]`);


	const terms = vocabExtentionData.filter((quad) => {
		return quad.subject.value !== OWL.Ontology;
	})

	//console.log(`term: [${terms.toString()}]`);

	const termSubjects = [];
	terms.filter((quad) => {
		//console.log(quad.subject.value);
		termSubjects.push(quad.subject.value);
	});

	const subjectSet = [...new Set(termSubjects)]
	//console.log(termSubjects.length);

	//console.log(`term subjects: [${subjectSet}]`);

	subjectSet.forEach(function(entry) {
		//console.log(entry);

		fullData.match(entry, null, rdf.namedNode('http://www.w3.org/2000/01/rdf-schema#Class')).filter((quad) => {
			classes.push(handleTerms(fullData, quad));
		});

		fullData.match(entry, null, rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property')).filter((quad) => {
			properties.push(handleTerms(fullData, quad));
		});
	});

	return result;
}

module .exports.processVocab = processVocab;
module.exports.buildTemplateInput = buildTemplateInput;
