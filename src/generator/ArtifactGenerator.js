const fs = require('fs');
const del = require('del');
const yaml = require('js-yaml');
const moment = require('moment');
const logger = require('debug')('lit-artifact-generator:VocabGenerator');

const FileGenerator = require('./FileGenerator');
const VocabGenerator = require('./VocabGenerator');
const DatasetHandler = require('../DatasetHandler');
const packageDotJson = require('../../package.json');

const ARTIFACT_DIRECTORY_ROOT = '/GeneratedSourceCodeArtifacts';
const ARTIFACT_DIRECTORY_JAVASCRIPT = `${ARTIFACT_DIRECTORY_ROOT}/Javascript`;

class ArtifactGenerator {
  constructor(argv, inquirerProcess) {
    this.artifactData = argv;
    this.inquirerProcess = inquirerProcess;

    // This collection will be populated with an entry per generated vocab (when processing a vocab list file, we may
    // be generating an artifact that bundles many generated vocabs).
    this.artifactData.generatedVocabs = [];

    // This collection will be populated with the authors per generated vocab.
    this.artifactData.authorSet = new Set();

    this.artifactData.generatedTimestamp = moment().format('LLLL');
    this.artifactData.generatorName = packageDotJson.name;
    this.artifactData.generatorVersion = packageDotJson.version;

    // TODO: Just hard-coding for the moment (still investigating Webpack...)
    this.artifactData.versionWebpack = '^4.39.1';
    this.artifactData.versionWebpackCli = '^3.3.6';
    this.artifactData.versionBabelCore = '^7.5.5';
    this.artifactData.versionBabelLoader = '^8.0.6';
  }

  static async deleteDirectory(directory) {
    const deletedPaths = await del([`${directory}/*`], { force: true });
    logger(`Deleting all files and folders from [${directory}]:`);
    logger(deletedPaths.join('\n'));
  }

  /**
   * If we are useBundling vocabs from a list, then we run our inquirer first, then run our generation. But if we are
   * only generating a single vocab, then process our inputs first and then run our inquirer, as our input vocab may
   * have provided suggested default values for our inquirer (e.g. the suggested name of the vocab may come from the
   * vocab itself).
   *
   * @param inquirerProcess
   * @returns {Promise<void>}
   */
  async generate() {
    // This value will be overridden for each artifact we generate (e.g. for
    // each of the programming-language artifacts we're configured to
    // generate).
    this.artifactData.outputDirectoryForArtifact = `${this.artifactData.outputDirectory}${ARTIFACT_DIRECTORY_JAVASCRIPT}`;

    await ArtifactGenerator.deleteDirectory(this.artifactData.outputDirectoryForArtifact);

    if (this.inquirerProcess) {
      this.artifactData = await this.inquirerProcess(this.artifactData);
    }

    if (this.artifactData.vocabListFile) {
      await this.generateFromVocabListFile();
    } else {
      await this.generateSingleVocab();
    }

    return FileGenerator.createPackagingFiles(this.artifactData);
  }

  async generateSingleVocab() {
    logger(`Generating artifact from vocabulary files: [${this.artifactData.input.toString()}]`);

    const vocabData = await new VocabGenerator(this.artifactData, this.inquirerProcess).generate();

    this.artifactData.artifactName = vocabData.artifactName;
    this.artifactData.description = vocabData.description;
    this.artifactData.authors = Array.from(vocabData.authorSet).join(', ');
    this.artifactData.generatedVocabs.push({
      vocabName: vocabData.vocabName,
      vocabNameUpperCase: vocabData.vocabNameUpperCase,
    });
  }

  async generateFromVocabListFile() {
    logger(`Generating artifact from vocabulary list file: [${this.artifactData.vocabListFile}]`);

    let generationDetails;
    try {
      logger(`Processing YAML file...`);
      generationDetails = yaml.safeLoad(fs.readFileSync(this.artifactData.vocabListFile, 'utf8'));
    } catch (error) {
      throw new Error(
        `Failed to read vocabulary list file [${this.artifactData.vocabListFile}]: ${error}`
      );
    }

    // Set our overall artifact name directly from the YAML value.
    this.artifactData.artifactName = generationDetails.artifactName;

    const vocabGenerationPromises = generationDetails.vocabList.map(vocabDetails => {
      // Override our vocab inputs using this vocab list entry.
      this.artifactData.input = vocabDetails.inputFiles;
      this.artifactData.vocabTermsFrom = vocabDetails.termSelectionFile;
      this.artifactData.nameAndPrefixOverride = vocabDetails.nameAndPrefixOverride;

      return new VocabGenerator(this.artifactData).generate();
    });

    // Wait for all our vocabs to be generated.
    const datasets = await Promise.all(vocabGenerationPromises);

    // Collect details from each generated vocab (to bundle them all together into our packaging artifact).
    const authorsAcrossAllVocabs = new Set();
    let description = `Bundle of vocabularies that includes the following:`;
    datasets.forEach(vocabData => {
      description += `\n  ${vocabData.vocabName}: ${vocabData.description}`;
      vocabData.authorSet.forEach(author => authorsAcrossAllVocabs.add(author));

      this.artifactData.generatedVocabs.push({
        vocabName: vocabData.vocabName,
        vocabNameUpperCase: vocabData.vocabNameUpperCase,
      });
    });

    this.artifactData.authors = `Vocabularies authored by: ${Array.from(
      authorsAcrossAllVocabs
    ).join(', ')}.`;
    this.artifactData.description = DatasetHandler.escapeStringForJson(description);
  }
}

module.exports = ArtifactGenerator;
module.exports.ARTIFACT_DIRECTORY_JAVASCRIPT = ARTIFACT_DIRECTORY_JAVASCRIPT;
