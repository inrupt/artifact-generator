const path = require('path');
const rdf = require('rdf-ext');
const logger = require('debug')('lit-artifact-generator:VocabGenerator');

const FileGenerator = require('./FileGenerator');
const Resources = require('../Resources');
const DatasetHandler = require('../DatasetHandler');

module.exports = class VocabGenerator {
  constructor(artifactData, inquirerProcess) {
    // Make sure we clone our input data (to keep it specific to our instance!).
    this.vocabData = { ...artifactData };

    this.inquirerProcess = inquirerProcess;
  }

  generate() {
    this.resources = new Resources(
      this.vocabData.inputFiles,
      this.vocabData.vocabTermsFrom,
      this.vocabData.vocabListFile ? path.dirname(this.vocabData.vocabListFile) : '.'
    );

    return this.generateData()
      .then(data => {
        return this.inquirerProcess ? this.inquirerProcess(data) : data;
      })
      .then(vocabGenerationData => {
        logger(
          `Generating vocabulary source code file [${vocabGenerationData.vocabName}]${
            this.vocabData.nameAndPrefixOverride ? ' (from override)' : ''
          }...`
        );
        logger(`Input vocabulary file(s) [${this.vocabData.inputFiles.toString()}]...`);

        return new Promise(resolve => {
          FileGenerator.createSourceCodeFile(this.vocabData, vocabGenerationData);
          resolve(vocabGenerationData);
        });
      });
  }

  generateData() {
    return new Promise(async (resolve, reject) => {
      await this.resources
        .processInputs((fullDatasetsArray, vocabTermsOnlyDataset) => {
          const parsed = this.parseDatasets(fullDatasetsArray, vocabTermsOnlyDataset);
          resolve(parsed);
        })
        .catch(error => {
          const result = `Failed to generate: ${error.toString()}`;
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
