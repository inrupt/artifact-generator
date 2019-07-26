const rdf = require('rdf-ext');
const rdfFetch = require('rdf-fetch-lite');
const N3Parser = require('rdf-parser-n3');

const { LitUtils } = require('@lit/vocab-term');

const formats = {
  parsers: new rdf.Parsers({
    'text/turtle': N3Parser,
    'application/x-turtle': N3Parser, // This is needed as schema.org will returns this as the content type.
  }),
};

module.exports = class Resources {
  /**
   *
   * @param datasetFiles
   * @param vocabTermsFromFile
   * @param fileResourcesRelativeTo If we load resources locally from the file system, make them relative to this path
   * (e.g. for reading resources from a vocab list file that can be anywhere, all local resources referenced in it
   * should be relative to wherever that list file itself is!).
   */
  constructor(datasetFiles, vocabTermsFromFile, fileResourcesRelativeTo) {
    this.datasetFiles = datasetFiles;
    this.subjectsOnlyFile = vocabTermsFromFile;
    this.fileResourcesRelativeTo = fileResourcesRelativeTo;
  }

  async processInputs(processInputsCallback) {
    const datasetsPromises = this.datasetFiles.map(e => this.readResource(e));

    const datasets = await Promise.all(datasetsPromises);

    let subjectsOnlyDataset;
    if (this.subjectsOnlyFile) {
      subjectsOnlyDataset = await this.readResource(this.subjectsOnlyFile);
      datasets.push(subjectsOnlyDataset); // Adds the extension to the full data set.
    }

    processInputsCallback(datasets, subjectsOnlyDataset);
  }

  readResource(datasetFile) {
    console.log(`Loading resource: [${datasetFile}]...`);
    if (datasetFile.startsWith('http')) {
      return rdfFetch(datasetFile, { formats }).then(resource => {
        return resource.dataset();
      });
    }

    return LitUtils.loadTurtleFileIntoDatasetPromise(
      `${this.fileResourcesRelativeTo}/${datasetFile}`
    );
  }
};
