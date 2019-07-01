const fs = require('fs');
const Handlebars = require('handlebars');

const rdf = require('rdf-ext')
const { LitUtils } = require('lit-vocab-term')

const rdfFormats = require('rdf-formats-common')()
const stringToStream = require('string-to-stream')

//const { RDF, RDFS, SCHEMA, OWL } = require('vocab-lit')

const OWL = {};
OWL.Ontology = 'http://www.w3.org/2002/07/owl#Ontology';


const PNU = 'http://purl.org/vocab/vann/preferredNamespacePrefix';
const ENU = 'http://inrupt.com/extendingNamespaceUri';
const ENP = 'http://inrupt.com/extendingNamespacePrefix';

var version


/**
 *
 */
function generate(inputFiles, ver) {
	version = ver;
	return new Promise(function(resolve, reject) {
		readResources(inputFiles, function(ds, dsExt) {
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
		// 	err => {
		// if (err) {
		// 	return console.error(`Failed to create artifact (${outputFile}): Error: ${err.message}.`);
		// } else {
		 	console.log(`Created artifiact: ${outputFile}`);
		// }
	//});
}

function parseDatasets(ds, dsExt) {
	return buildTemplateInput(load([ds, dsExt]), load([dsExt]));
}

async function readResources(inputFiles, processDatasets) {

	var datasets = [];

	for (let inputFile of inputFiles) {
		var ds = await loadTurtleFile(inputFile, undefined);
		datasets.push(ds);
	}

	LitUtils.loadTurtleFile('./test/vocabs/schema-ext.ttl', (extensionDataset) => {
		processDatasets(datasets[0], extensionDataset);
	});
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

	const ontologyNamespaces = dataSetExtentions.match(null, rdf.namedNode(ENU), null).toArray();
	result.namespace = firstDsValue(ontologyNamespaces, 'http://default.com/');


	const ontologyName = dataSetExtentions.match(null, rdf.namedNode(ENP), null).toArray();
	result.ontologyNameUppercase = firstDsValue(ontologyName, 'SCHEMA').toUpperCase();

	const ontologyPrefix = dataSetExtentions.match(null, rdf.namedNode(PNU), null).toArray();
	result.ontologyPrefix = firstDsValue(ontologyPrefix, 'default');

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

function firstDsValue(dataset, defaultRes) {
	const first = dataset[0];
	if(first) {
		return first.object.value;
	} else {
		return defaultRes;
	}
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

module.exports.generate = generate;
module.exports.buildTemplateInput = buildTemplateInput;
module.exports.load = load;


//generate('1.0.0');