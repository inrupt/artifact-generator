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

module.exports = class Resources {
  constructor(datasetFiles, vocabTermsFromFile) {
    this.datasetFiles = datasetFiles;
    this.subjectsOnlyFile = vocabTermsFromFile;
  }

  async readResources(processDatasetsCallback) {
    const datasets = [];

    for (const datasetFile of this.datasetFiles) {
      const dataset = await this.readResource(datasetFile);
      datasets.push(dataset);
    }

    if (this.subjectsOnlyFile) {
      const subjectsOnlyDataset = await this.readResource(
        this.subjectsOnlyFile
      );
      datasets.push(subjectsOnlyDataset); // Adds the extension to the full data set.
      processDatasetsCallback(datasets, subjectsOnlyDataset);
    } else {
      processDatasetsCallback(datasets);
    }
  }

  readResource(datasetFile) {
    if (datasetFile.startsWith('http')) {
      return rdfFetch(datasetFile, { formats: formats }).then(resource => {
        return resource.dataset();
      });
    }

    return LitUtils.loadTurtleFileIntoDatasetPromise(datasetFile);
  }
};
