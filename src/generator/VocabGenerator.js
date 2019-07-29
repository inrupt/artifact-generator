const path = require('path');

const rdf = require('rdf-ext');

const GeneratorFile = require('./FileGenerator');

const Resources = require('../Resources');
const DatasetHandler = require('../DatasetHandler');

module.exports = class VocabGenerator {
  constructor(argv, inquirerProcess) {
    this.argv = argv;
    this.inquirerProcess = inquirerProcess;
  }

  generate() {
    const fileResourcesRelativeTo = this.argv.vocabListFile
      ? path.dirname(this.argv.vocabListFile)
      : '.';
    this.resources = new Resources(
      this.argv.input,
      this.argv.vocabTermsFrom,
      fileResourcesRelativeTo
    );

    return this.generateData()
      .then(data => {
        return this.inquirerProcess ? this.inquirerProcess(data) : data;
      })
      .then(mergedData => {
        return new Promise(resolve => {
          this.argv.generatedVocabs.push({
            vocabName: mergedData.vocabName,
            vocabNameUpperCase: mergedData.vocabNameUpperCase,
          });

          GeneratorFile.createSourceCodeFile(this.argv, mergedData);
          resolve(mergedData);
        });
      });
  }

  generateData() {
    return new Promise((resolve, reject) => {
      this.resources
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
    const datasetHandler = new DatasetHandler(fullData, subjectsOnlyDataset, this.argv);
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
