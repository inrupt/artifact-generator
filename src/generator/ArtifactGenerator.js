const del = require('del');
const logger = require('debug')('lit-artifact-generator:ArtifactGenerator');

const FileGenerator = require('./FileGenerator');
const VocabGenerator = require('./VocabGenerator');

const ARTIFACT_DIRECTORY_ROOT = '/Generated';
const ARTIFACT_DIRECTORY_SOURCE_CODE = `${ARTIFACT_DIRECTORY_ROOT}/SourceCodeArtifacts`;

class ArtifactGenerator {
  /**
   *
   * @param { GeneratorConfiguration } argv
   */
  constructor(argv) {
    this.configuration = argv;
    this.artifactData = this.configuration.configuration;

    // This collection will be populated with an entry per generated vocab (when processing a vocab list file, we may
    // be generating an artifact that bundles many generated vocabs).
    this.artifactData.generatedVocabs = [];

    // This collection will be populated with the authors per generated vocab.
    if (!this.artifactData.authorSet) {
      this.artifactData.authorSet = new Set();
    }

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

  async generate() {
    // For each programming language artifact we generate, first clear out the destination directories.
    const directoryDeletionPromises = this.artifactData.artifactToGenerate.map(artifactDetails => {
      return ArtifactGenerator.deleteDirectory(
        `${this.artifactData.outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/${artifactDetails.artifactFolderName}`
      );
    });
    await Promise.all(directoryDeletionPromises);
    return this.generateVocabs()
      .then(vocabDatasets => {
        this.collectGeneratedVocabDetails(vocabDatasets);
        return vocabDatasets;
      })
      .then(async vocabDatasets => {
        // If the generator takes its input from the command line, the artifact name may not have been set
        if (
          !this.artifactData.artifactName ||
          !this.artifactData.litVocabTermVersion ||
          !this.artifactData.authorSet ||
          this.artifactData.authorSet.size === 0
        ) {
          const vocabData = vocabDatasets[0];
          this.artifactData.artifactName = vocabData.artifactName;
          // If the generation was not sufficient to collect all the required information, the user is asked for it
          await this.configuration.askAdditionalQuestions();
        }
      })
      .then(() => this.generatePackaging())
      .then(() => this.artifactData)
      .catch(error => {
        throw error;
      });
    // const vocabDatasets = await this.generateVocabs();
    // await this.collectGeneratedVocabDetails(vocabDatasets);
    // // If the generator takes its input from the command line, the artifact name may not have been set
    // if (
    //   !this.artifactData.artifactName ||
    //   !this.artifactData.litVocabTermVersion ||
    //   !this.artifactData.authorSet ||
    //   this.artifactData.authorSet.size === 0
    // ) {
    //   const vocabData = vocabDatasets[0];
    //   this.artifactData.artifactName = vocabData.artifactName;
    //   // If the generation was not sufficient to collect all the required information, the user is asked for it
    //   await this.configuration.askAdditionalQuestions();
    // }
    // await this.generatePackaging();
    // return this.artifactData;
  }

  async generateVocabs() {
    // TODO: This code evolved from where we originally only had a list of
    //  vocabs to generate from. But now we can create artifacts for multiple
    //  programming languages. But this code was extended to provide the
    //  language-specific details within this original vocab-iterating loop.
    return Promise.all(
      this.artifactData.vocabList.map(async vocabDetails => {
        // const vocabGenerationPromises = generationDetails.vocabList.map(vocabDetails => {

        // Override our vocab inputs using this vocab list entry.
        this.artifactData.inputResources = vocabDetails.inputResources;
        this.artifactData.vocabTermsFrom = vocabDetails.termSelectionFile;
        this.artifactData.nameAndPrefixOverride = vocabDetails.nameAndPrefixOverride;

        // Generate this vocab for each artifact we are generating for.
        const artifactPromises = this.artifactData.artifactToGenerate.map(artifactDetails => {
          this.artifactData.artifactVersion = artifactDetails.artifactVersion;

          this.artifactData.outputDirectoryForArtifact = `${this.artifactData.outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/${artifactDetails.artifactFolderName}`;

          // TODO: Currently we need to very explicitly add this Java-specific
          //  data to our data being passed into the vocab generator, from where
          //  it needs to be copied again into the template data, so that our
          //  Java-only Handlebars templates can access it!
          this.artifactData.javaPackageName = artifactDetails.javaPackageName;
          this.artifactData.npmModuleScope = artifactDetails.npmModuleScope;
          this.artifactData.litVocabTermVersion = artifactDetails.litVocabTermVersion;

          return new VocabGenerator(this.artifactData, artifactDetails).generate();
        });

        // Wait for all our artifacts to be generated.
        await Promise.all(artifactPromises);

        // Only return the first one, as we don't want duplicate info.
        return artifactPromises[0];
      })
    );
  }

  async collectGeneratedVocabDetails(vocabDatasets) {
    const authorsAcrossAllVocabs = new Set();
    this.artifactData.description = `Bundle of vocabularies that includes the following:`;
    await Promise.all(
      vocabDatasets.map(async vocabData => {
        this.artifactData.description += `\n\n  ${vocabData.vocabName}: ${vocabData.description}`;
        this.artifactData.generatedVocabs.push({
          vocabName: vocabData.vocabName,
          vocabNameUpperCase: vocabData.vocabNameUpperCase,
        });
        vocabData.authorSet.forEach(author => authorsAcrossAllVocabs.add(author));
      })
    );
    this.artifactData.authors = `Vocabularies authored by: ${Array.from(
      authorsAcrossAllVocabs
    ).join(', ')}.`;
  }

  async generatePackaging() {
    this.artifactData.artifactToGenerate.forEach(artifactDetails => {
      this.artifactData.artifactVersion = artifactDetails.artifactVersion;

      this.artifactData.outputDirectoryForArtifact = `${this.artifactData.outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/${artifactDetails.artifactFolderName}`;
      this.artifactData.javaPackageName = artifactDetails.javaPackageName;
      this.artifactData.npmModuleScope = artifactDetails.npmModuleScope;
      this.artifactData.litVocabTermVersion = artifactDetails.litVocabTermVersion;
      this.artifactData.gitRepository = artifactDetails.gitRepository;
      this.artifactData.repository = artifactDetails.repository;

      FileGenerator.createPackagingFiles(this.artifactData, artifactDetails.programmingLanguage);
    });
  }
}

module.exports = ArtifactGenerator;
module.exports.ARTIFACT_DIRECTORY_ROOT = ARTIFACT_DIRECTORY_ROOT;
module.exports.ARTIFACT_DIRECTORY_SOURCE_CODE = ARTIFACT_DIRECTORY_SOURCE_CODE;
