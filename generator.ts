const fs = require('fs');
const Handlebars = require('handlebars');

const rdf = require('rdf-ext')
const { LitUtils } = require('lit-vocab-term')

const rdfFormats = require('rdf-formats-common')()
const stringToStream = require('string-to-stream')

//const { RDF, RDFS, SCHEMA, OWL } = require('vocab-lit')

const OWL = {};
OWL.Ontology = 'http://www.w3.org/2002/07/owl#Ontology';


const PNP = 'http://purl.org/vocab/vann/preferredNamespacePrefix';
const PNU = 'http://purl.org/vocab/vann/preferredNamespaceUri';

var version


/**
 *
 */
function generate(inputFiles, ver, extensionFile) {
	version = ver;
	return new Promise(function(resolve, reject) {
		readResources(inputFiles, extensionFile, function(ds, dsExt) {
			const parsed = parseDatasets(ds, dsExt);
			createArtifacts(parsed);
			resolve('Done!');
		})
	});
}

/**
 *
 * @param templateData
 */
function createArtifacts(templateData) {

	createArtifact('templates/template.hbs', 'generated/index.ts', templateData);
	createArtifact('templates/package.hbs', 'generated/package.json', templateData);
}


function createArtifact(template, outputFile, templateData) {

	let data = fs.readFileSync(template);

	var template = Handlebars.compile(data.toString());
	var contents = template(templateData);

	fs.writeFileSync(outputFile, contents);
	console.log(`Created artifiact: ${outputFile}`);
}

function parseDatasets(ds, dsExt) {
	return buildTemplateInput(load(ds), load([dsExt]));
}

function load(dataSets) {

	if(dataSets) {
		var fullData = rdf.dataset();
		dataSets.forEach(function(ds) {
			if(ds) {
				fullData = fullData.merge(ds);
			}
		})

		return fullData;
	} else {
		return undefined;
	}
}

async function readResources(inputFiles, extensionFile, processDatasets) {

	var datasets = [];

	for (let inputFile of inputFiles) {
		var ds = await loadTurtleFile(inputFile, undefined);
		datasets.push(ds);
	}

	if(extensionFile) {
		LitUtils.loadTurtleFile(extensionFile, (extensionDataset) => {
			processDatasets(datasets, extensionDataset);
		});
	} else {
		processDatasets(datasets, undefined);
	}

}

function loadTurtleFile (filename, dataset) {
	const mimeType = 'text/turtle'
	const data = fs.readFileSync(filename, 'utf8')

	const parser = rdfFormats.parsers[ mimeType ]
	const quadStream = parser.import(stringToStream(data))
	return (dataset ? dataset : rdf.dataset()).import(quadStream)
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

	result.namespace = findNamespace(fullData)

	result.ontologyPrefix = findPrefix(fullData);

	result.version = version;


	let subjectSet = subjectsOnly(dataSetExtentions);
	if(subjectSet.length === 0) {
		subjectSet = subjectsOnly(fullData);
	}


	subjectSet.forEach(function(entry) {

		fullData.match(entry, null, rdf.namedNode('http://www.w3.org/2000/01/rdf-schema#Class')).filter((quad) => {
			classes.push(handleTerms(fullData, quad));
		});

		fullData.match(entry, null, rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property')).filter((quad) => {
			properties.push(handleTerms(fullData, quad));
		});
	});

	return result;
}

function findNamespace(fullData) {
	const ontologyNamespaces = fullData.match(null, rdf.namedNode(PNU), null).toArray();
	let namespace = firstDsValue(ontologyNamespaces);

	if(!namespace) {
		let first = subjectsOnly(fullData)[0];
		namespace = first.substring(0, first.lastIndexOf('/') + 1);
	}
	return namespace;
}

function findPrefix(fullData) {
	const ontologyPrefix = fullData.match(null, rdf.namedNode(PNP), null).toArray();
	let prefix = firstDsValue(ontologyPrefix);

	if(!prefix) {
		let first = subjectsOnly(fullData)[0];
		prefix = first.substring(first.lastIndexOf('//') + 2, first.lastIndexOf('.'));
	}
	return prefix;
}

function subjectsOnly(fullData) {
	const terms = fullData.filter((quad) => {
		return quad.subject.value !== OWL.Ontology;
	})


	const termSubjects = [];
	terms.filter((quad) => {
		termSubjects.push(quad.subject.value);
	});

	return [...new Set(termSubjects)];
}

function firstDsValue(dataset, defaultRes) {
	const first = dataset[0];
	if(first) {
		return first.object.value;
	} else {
		return defaultRes;
	}
}

module.exports.generate = generate;
module.exports.buildTemplateInput = buildTemplateInput;
module.exports.load = load;
