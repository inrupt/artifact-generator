const rdf = require('rdf-ext');

const Resources = require('./resources');
const DatasetHandler = require('./dataset-handler');
const artifacts = require('./artifacts');

module.exports = class Generator {
  constructor(argv) {
    this.argv = argv;

    this.resources = new Resources(argv.input, argv.vocabTermsFrom);
  }

  /**
   *
   */
  generate() {
    return new Promise((resolve, reject) => {
      this.resources
        .readResources((fullDatasetsArray, vocabTermsOnlyDataset) => {
          const parsed = this.parseDatasets(fullDatasetsArray, vocabTermsOnlyDataset);
          artifacts.createArtifacts(this.argv, parsed);
          resolve('Done!');
        })
        .catch(error => {
          const result = `Failed to generate: ${error.toString()}`;
          console.log(result);
          console.error(error);
          reject(new Error(result));
        });
    });
  }

  parseDatasets(fullDatasetsArray, vocabTermsOnlyDataset) {
    return this.buildTemplateInput(
      Generator.merge(fullDatasetsArray),
      Generator.merge([vocabTermsOnlyDataset])
    );
  }

  buildTemplateInput(fullData, subjectsOnlyDataset) {
    const datasetHandler = new DatasetHandler(
      fullData,
      subjectsOnlyDataset,
      this.argv.artifactVersion
    );
    return datasetHandler.buildTemplateInput();
  }

  static merge(dataSets) {
    let fullData = rdf.dataset();
    dataSets.forEach(ds => {
      if (ds) {
        fullData = fullData.merge(ds);
      }
    });

    return fullData;
  }
};
