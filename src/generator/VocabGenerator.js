const rdf = require("rdf-ext");
const debug = require("debug")("lit-artifact-generator:VocabGenerator");

const FileGenerator = require("./FileGenerator");
const Resource = require("../Resource");
const DatasetHandler = require("../DatasetHandler");

module.exports = class VocabGenerator {
  constructor(artifactData, artifactDetails) {
    // Make sure we clone our input data (to keep it specific to our instance!).
    this.vocabData = { ...artifactData };
    this.artifactDetails = artifactDetails;
  }

  async generateFiles(vocabGenerationData) {
    debug(
      `Generating vocabulary source code file [${
        vocabGenerationData.vocabName
      }]${this.vocabData.nameAndPrefixOverride ? " (from override)" : ""}...`
    );
    debug(
      `Input vocabulary resource(s) [${this.vocabData.inputResources.toString()}]...`
    );

    if (
      vocabGenerationData.classes.length === 0 &&
      vocabGenerationData.properties.length === 0 &&
      vocabGenerationData.literals.length === 0 &&
      vocabGenerationData.constantIris.length === 0 &&
      vocabGenerationData.constantStrings.length === 0
    ) {
      // In this case, the resource was unreachable, and the source file cannot be generated
      return new Promise((resolve, reject) => {
        if (
          FileGenerator.previouslyGeneratedFileExists(
            this.artifactDetails,
            vocabGenerationData
          )
        ) {
          debug(
            `A source file is reused for unreachable (or empty of recognisable terms) resource [${this.vocabData.inputResources.toString()}]`
          );
          resolve(vocabGenerationData);
        }
        reject(
          new Error(
            `[${this.vocabData.inputResources.toString()}] is unreachable (or empty of recognisable terms), and no previously generated file is available.`
          )
        );
      });
    }

    return new Promise((resolve) => {
      FileGenerator.createSourceCodeFile(
        this.vocabData,
        this.artifactDetails,
        vocabGenerationData
      );
      resolve(vocabGenerationData);
    });
  }

  generate() {
    this.resources = new Resource(
      this.vocabData.inputResources,
      this.vocabData.termSelectionResource
    );

    return this.generateData()
      .then((vocabGenerationData) => {
        return this.generateFiles(vocabGenerationData);
      })
      .catch((error) => {
        throw new Error(`Data generation for vocabs failed: ${error}`);
      });
  }

  generateData() {
    // Need to pull this member variable into a local variable to access it from
    // the arrow function later...
    const inputResources = this.vocabData.inputResources;

    return new Promise(async (resolve, reject) => {
      this.resources
        .processInputs((fullDatasetsArray, vocabTermsOnlyDataset) => {
          const parsed = this.parseDatasets(
            fullDatasetsArray,
            vocabTermsOnlyDataset
          );
          resolve(parsed);
        })
        .catch((error) => {
          const result = `Failed to generate from input [${inputResources}]: [${error.toString()}].\n\nStack: ${error.stack.toString()}`;
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
    const datasetHandler = new DatasetHandler(
      fullData,
      subjectsOnlyDataset,
      this.vocabData
    );

    return datasetHandler.buildTemplateInput();
  }

  static merge(dataSets) {
    let fullData = rdf.dataset();
    dataSets.forEach((dataset) => {
      if (dataset) {
        fullData = fullData.merge(dataset);
      }
    });

    return fullData;
  }
};
