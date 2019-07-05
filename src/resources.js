const fs = require('fs');

const rdf = require('rdf-ext');
const rdfFetch = require('rdf-fetch-lite');
const N3Parser = require('rdf-parser-n3');

const { LitUtils } = require('lit-vocab-term');

const formats = {
  parsers: new rdf.Parsers({
    'text/turtle': N3Parser,
    'application/x-turtle': N3Parser, // This is needed as schema.org will returns this as the content type
  }),
};

async function readResources(
  datasetFiles,
  subjectsOnlyFile,
  processDatasetsCallback
) {
  var datasets = [];

  for (let datasetFile of datasetFiles) {
    var ds = await readResource(datasetFile);
    datasets.push(ds);
  }

  if (subjectsOnlyFile) {
    var subjectsOnlyDataset = await readResource(subjectsOnlyFile);
    datasets.push(subjectsOnlyDataset); // Adds the extention to the full data set
    processDatasetsCallback(datasets, subjectsOnlyDataset);
  } else {
    processDatasetsCallback(datasets);
  }
}

function readResource(datasetFile) {
  if (datasetFile.startsWith('http')) {
    return rdfFetch(datasetFile, { formats: formats }).then(res => {
      return res.dataset();
    });
  }

  return LitUtils.loadTurtleFileIntoDatasetPromise(datasetFile);
}

module.exports.readResources = readResources;
