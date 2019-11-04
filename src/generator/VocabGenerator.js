// const path = require('path');
const rdf = require('rdf-ext');
const logger = require('debug')('lit-artifact-generator:VocabGenerator');

const FileGenerator = require('./FileGenerator');
const Resources = require('../Resources');
const DatasetHandler = require('../DatasetHandler');

module.exports = class VocabGenerator {
  constructor(artifactData, artifactDetails) {
    // Make sure we clone our input data (to keep it specific to our instance!).
    this.vocabData = { ...artifactData };
    this.artifactDetails = artifactDetails;
  }

  generate() {
    this.resources = new Resources(
      this.vocabData.inputResources,
      this.vocabData.vocabTermsFrom,
      // TODO: Cleanup the following parameter in the Resource class, since it is now handled in the configuration
      '.' // this.vocabData.vocabListFile ? path.dirname(this.vocabData.vocabListFile) : '.'
    );

    return this.generateData()
      .then(vocabGenerationData => {
        logger(
          `Generating vocabulary source code file [${vocabGenerationData.vocabName}]${
            this.vocabData.nameAndPrefixOverride ? ' (from override)' : ''
          }...`
        );
        logger(`Input vocabulary file(s) [${this.vocabData.inputResources.toString()}]...`);

        return new Promise(resolve => {
          FileGenerator.createSourceCodeFile(
            this.vocabData,
            this.artifactDetails,
            vocabGenerationData
          );
          resolve(vocabGenerationData);
        });
      })
      .catch(error => {
        throw error;
      });
  }

  generateData() {
    return new Promise(async (resolve, reject) => {
      this.resources
        .processInputs((fullDatasetsArray, vocabTermsOnlyDataset) => {
          const parsed = this.parseDatasets(fullDatasetsArray, vocabTermsOnlyDataset);
          resolve(parsed);
        })
        .catch(error => {
          const result = `Failed to generate: [${error.toString()}]. Stack: ${error.stack.toString()}`;
          reject(new Error(result));
        });
    });
  }

  parseDatasets(fullDatasetsArray, vocabTermsOnlyDataset) {
    return this.buildTemplateInput(
      VocabGenerator.merge(fullDatasetsArray),
      VocabGenerator.merge([vocabTermsOnlyDataset])
    );
  }

  buildTemplateInput(fullData, subjectsOnlyDataset) {
    const datasetHandler = new DatasetHandler(fullData, subjectsOnlyDataset, this.vocabData);
    return datasetHandler.buildTemplateInput();
  }

  static merge(dataSets) {
    let fullData = rdf.dataset();
    dataSets.forEach(dataset => {
      if (dataset) {
        fullData = fullData.merge(dataset);
      }
    });

    return fullData;
  }
};
