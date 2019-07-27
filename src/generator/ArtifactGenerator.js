const fs = require('fs');
const yaml = require('js-yaml');

const FileGenerator = require('./FileGenerator');
const VocabGenerator = require('./VocabGenerator');

const DatasetHandler = require('../DatasetHandler');

module.exports = class ArtifactGenerator {
  constructor(argv, inquirerProcess) {
    this.argv = argv;
    this.inquirerProcess = inquirerProcess;
  }

  /**
   * If we are bundling vocabs from a list, then we run our inquirer first, then run our generation. But if we are
   * only generating a single vocab, then process our inputs first and then run our inquirer, as our input vocab may
   * have provided suggested default values for our inquirer (e.g. the suggested name of the vocab may come from the
   * vocab itself).
   *
   * @param inquirerProcess
   * @returns {Promise<void>}
   */
  async generate() {
    if (this.argv.vocabListFile) {
      if (this.inquirerProcess) {
        this.argv = await this.inquirerProcess(this.argv);
      }

      await this.generateFromVocabListFile();
    } else {
      this.argv = await new VocabGenerator(this.argv, this.inquirerProcess).generate();
      this.argv.generatedVocabs = [
        { vocabName: this.argv.vocabName, vocabNameUpperCase: this.argv.vocabNameUpperCase },
      ];
    }

    return FileGenerator.createPackagingFiles(this.argv);
  }

  async generateFromVocabListFile() {
    let generationDetails;
    try {
      generationDetails = yaml.safeLoad(fs.readFileSync(this.argv.vocabListFile, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to read vocabulary list file [${this.argv.vocabListFile}]: ${error}`);
    }

    // Set our overall artifact name directly from the YAML value.
    this.argv.artifactName = generationDetails.artifactName;

    const vocabGenerationPromises = generationDetails.vocabList.map(vocabDetails => {
      // Override our vocab inputs using this vocab list entry.
      this.argv.input = vocabDetails.inputFiles;
      this.argv.vocabTermsFrom = vocabDetails.termSelectionFile;

      return new VocabGenerator(this.argv, undefined).generate();
    });

    // Wait for all our vocabs to be generated.
    const datasets = await Promise.all(vocabGenerationPromises);

    // Collect details from each generated vocab (to bundle them all together into our packaging artifact).
    const authors = new Set();
    let description = `Bundle of vocabularies that includes the following:`;
    datasets.forEach(vocabData => {
      description += `\n  ${vocabData.vocabName}: ${vocabData.description}`;
      authors.add(`${vocabData.author}`);
    });

    this.argv.author = `Vocabularies authored by: ${[...authors].join(', ')}.`;
    this.argv.description = DatasetHandler.escapeStringForJson(description);
  }
};
