const fs = require('fs');

const Handlebars = require('handlebars');

const rdf = require('rdf-ext')
const rdfFetch = require('rdf-fetch-lite')
const N3Parser = require('rdf-parser-n3')

const { LitUtils } = require('lit-vocab-term')

const formats = {
	parsers: new rdf.Parsers({
		'text/turtle': N3Parser,
		'application/x-turtle': N3Parser
	})
}


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


async function readResources(datasetFiles, subjectsOnlyFile, processDatasetsCallback) {

	var datasets = [];

	for (let datasetFile of datasetFiles) {
		var ds = await readResource(datasetFile);
		datasets.push(ds);
	}

	if(subjectsOnlyFile) {
		var subjectsOnlyDataset = await readResource(subjectsOnlyFile);
		datasets.push(subjectsOnlyDataset);
		processDatasetsCallback(datasets, subjectsOnlyDataset);

	} else {
		processDatasetsCallback(datasets);
	}

}

function readResource(datasetFile) {
	if(datasetFile.startsWith('http')) {
		return rdfFetch(datasetFile, {formats: formats}).then((res) => {
			return res.dataset()
		});
	} else {
		return LitUtils.loadTurtleFileIntoDatasetPromise(datasetFile);
	}
}

module.exports.readResources = readResources;
module.exports.createArtifacts = createArtifacts;
