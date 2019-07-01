const fs = require('fs');
const Handlebars = require('handlebars');

const rdf = require('rdf-ext')
const { LitUtils } = require('lit-vocab-term')


//const { RDF, RDFS, SCHEMA, OWL } = require('vocab-lit')

const OWL = {};
OWL.Ontology = 'http://www.w3.org/2002/07/owl#Ontology';


const PNU = 'http://purl.org/vocab/vann/preferredNamespacePrefix';
const ENU = 'http://inrupt.com/extendingNamespaceUri';
const ENP = 'http://inrupt.com/extendingNamespacePrefix';

const version = process.argv[2] || '1.0.0';


function generate() {
	readResources(function(ds, dsExt) {
		const parsed = parseDatasets(ds, dsExt);
		createArtifacts(parsed);
	})
}

function createArtifacts(templateData) {

	createArtifact('templates/template.hbs', 'generated/index.ts', templateData);
	createArtifact('templates/package.hbs', 'generated/package.json', templateData);
}

function createArtifact(template, outputFile, templateData) {
	fs.readFile(template, function read(err, data) {
		if (err) {
			throw err;
		}

		var template = Handlebars.compile(data.toString());
		var contents = template(templateData);

		fs.writeFile(outputFile, contents, err => {
			if (err) {
				return console.error(`Failed to create artifact (${outputFile}): Error: ${err.message}.`);
			} else {
				console.log(`Created artifiact: ${outputFile}`);
			}
		});
	});
}

function parseDatasets(ds, dsExt) {
	return buildTemplateInput(load([ds, dsExt]), load([dsExt]));
}

function readResources(processDatasets) {
	LitUtils.loadTurtleFile('./vocabs/schema.ttl', (dataset) => {
		LitUtils.loadTurtleFile('./vocabs/schema-ext.ttl', (extensionDataset) => {
			processDatasets(dataset, extensionDataset);
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
				comment: comments[0] ? comments[0].value : '',
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

function buildTemplateInput(fullData, dataSetExtentions) {

	//const fullData = dataSet.merge(dataSetExtentions);

	const classes = [];
	const properties = [];

	const result = {};
	result.classes = classes;
	result.properties = properties;

	const ontologyNamespace = dataSetExtentions.match(null, rdf.namedNode(ENU), null).toArray();
	result.namespace = ontologyNamespace[0].object.value;

	const ontologyName = dataSetExtentions.match(null, rdf.namedNode(ENP), null).toArray();
	result.ontologyNameUppercase = ontologyName[0].object.value.toUpperCase();

	const ontologyPrefix = dataSetExtentions.match(null, rdf.namedNode(PNU), null).toArray();
	result.ontologyPrefix = ontologyPrefix[0].object.value;

	result.version = version;



	const ontologyStatements = dataSetExtentions.match(null, rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
		rdf.namedNode('http://www.w3.org/2002/07/owl#Ontology')).toArray();
	// if (ontologyStatements.length != 1) {
	// 	throw new Error(`Must contain only 1 ontology, but found [${ontologyStatements.length}], i.e. ${ontologyStatements.toString()}]`)
	// }

	//const ontologySubject = ontologyStatements[0].subject.value
	//console.log(`ontologySubject: [${ontologySubject}]`);


	const terms = dataSetExtentions.filter((quad) => {
		return quad.subject.value !== OWL.Ontology;
	})

	//console.log(`term: [${terms.toString()}]`);

	const termSubjects = [];
	terms.filter((quad) => {
		//console.log(quad.subject.value);
		termSubjects.push(quad.subject.value);
	});

	const subjectSet = [...new Set(termSubjects)];

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


function load(dataSets) {

	var fullData = rdf.dataset();
	dataSets.forEach(function(ds) {
		fullData = fullData.merge(ds);
	})

	return fullData;
}

module.exports.generate = generate;
module.exports.buildTemplateInput = buildTemplateInput;
module.exports.load = load;

generate();