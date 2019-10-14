const fs = require('fs');
const del = require('del');
const yaml = require('js-yaml');
const logger = require('debug')('lit-artifact-generator:VocabGenerator');

const FileGenerator = require('./FileGenerator');
const VocabGenerator = require('./VocabGenerator');

const ARTIFACT_DIRECTORY_ROOT = '/Generated';
const ARTIFACT_DIRECTORY_SOURCE_CODE = `${ARTIFACT_DIRECTORY_ROOT}/SourceCodeArtifacts`;

class ArtifactGenerator {
  constructor(argv, inquirerProcess) {
    this.artifactData = argv;
    this.inquirerProcess = inquirerProcess;

    // This collection will be populated with an entry per generated vocab (when processing a vocab list file, we may
    // be generating an artifact that bundles many generated vocabs).
    this.artifactData.generatedVocabs = [];

    // This collection will be populated with the authors per generated vocab.
    this.artifactData.authorSet = new Set();

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
   * If we are bundling vocabs from a list, then we run our inquirer first, then run our generation. But if we are
   * only generating a single vocab, then process our inputs first and then run our inquirer, as our input vocab may
   * have provided suggested default values for our inquirer (e.g. the suggested name of the vocab may come from the
   * vocab itself).
   *
   * @param inquirerProcess
   * @returns {Promise<void>}
   */
  async generate() {
    if (this.inquirerProcess) {
      this.artifactData = await this.inquirerProcess(this.artifactData);
    }

    return this.artifactData.vocabListFile
      ? this.generateFromVocabListFile()
      : this.generateSingleVocab();
  }

  async generateSingleVocab() {
    logger(
      `Generating artifact from vocabulary files: [${this.artifactData.inputResources.toString()}]`
    );

    this.artifactData.outputDirectoryForArtifact = `${this.artifactData.outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;

    await ArtifactGenerator.deleteDirectory(this.artifactData.outputDirectoryForArtifact);

    // We weren't provided with a configuration file, so manually provide
    // defaults.
    this.artifactData.generationDetails = {
      artifactToGenerate: [
        {
          programmingLanguage: 'Javascript',
          artifactFolderName: 'Javascript',
          handlebarsTemplate: 'javascript-rdf-ext.hbs',
          sourceFileExtension: 'js',
        },
      ],
    };

    const vocabData = await new VocabGenerator(
      this.artifactData,
      this.artifactData.generationDetails.artifactToGenerate[0],
      this.inquirerProcess
    ).generate();

    this.artifactData.artifactName = vocabData.artifactName;
    this.artifactData.description = vocabData.description;
    this.artifactData.authors = Array.from(vocabData.authorSet).join(', ');
    this.artifactData.generatedVocabs.push({
      vocabName: vocabData.vocabName,
      vocabNameUpperCase: vocabData.vocabNameUpperCase,
    });

    return FileGenerator.createPackagingFiles(this.artifactData, 'Javascript');
  }

  /**
   * This method can generate multiple artifacts for different programming languages (e.g. a Java JAR and an NPM
   * module), each of which can be comprised of a bundle of RDF vocabs.
   *
   * @returns {Promise<*>}
   */
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

    // Provide access to our entire YAML data.
    this.artifactData.generationDetails = generationDetails;

    // For each programming language artifact we generate, first clear out the destination directories.
    const directoryDeletionPromises = generationDetails.artifactToGenerate.map(artifactDetails => {
      return ArtifactGenerator.deleteDirectory(
        `${this.artifactData.outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/${artifactDetails.artifactFolderName}`
      );
    });
    await Promise.all(directoryDeletionPromises);

    // If the vocab list is non-existant of empty (e.g. after initialization), the generator
    // cannot run.
    if (generationDetails.vocabList === undefined || generationDetails.vocabList === null) {
      return this.artifactData;
    }

    // TODO: This code evolved from where we originally only had a list of
    //  vocabs to generate from. But now we can create artifacts for multiple
    //  programming languages. But this code was extended to provide the
    //  language-specific details within this original vocab-iterating loop.
    const vocabGenerationPromises = generationDetails.vocabList.map(async vocabDetails => {
      // const vocabGenerationPromises = generationDetails.vocabList.map(vocabDetails => {

      // Override our vocab inputs using this vocab list entry.
      this.artifactData.inputResources = vocabDetails.inputResources;
      this.artifactData.vocabTermsFrom = vocabDetails.termSelectionFile;
      this.artifactData.nameAndPrefixOverride = vocabDetails.nameAndPrefixOverride;

      // Generate this vocab for each artifact we are generating for.
      const artifactPromises = generationDetails.artifactToGenerate.map(artifactDetails => {
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
    });

    // Wait for all our vocabs to be generated.
    const vocabDatasets = await Promise.all(vocabGenerationPromises);

    // Collect details from each generated vocab (to bundle them all together into our packaging artifact).
    const authorsAcrossAllVocabs = new Set();
    let description = `Bundle of vocabularies that includes the following:`;
    vocabDatasets.forEach(vocabData => {
      description += `\n\n  ${vocabData.vocabName}: ${vocabData.description}`;
      vocabData.authorSet.forEach(author => authorsAcrossAllVocabs.add(author));

      this.artifactData.generatedVocabs.push({
        vocabName: vocabData.vocabName,
        vocabNameUpperCase: vocabData.vocabNameUpperCase,
      });
    });

    this.artifactData.authors = `Vocabularies authored by: ${Array.from(
      authorsAcrossAllVocabs
    ).join(', ')}.`;
    // this.artifactData.description = FileGenerator.escapeStringForJson(description);
    this.artifactData.description = description;

    // Generate packaging details for each generated artifact.
    generationDetails.artifactToGenerate.forEach(artifactDetails => {
      this.artifactData.artifactVersion = artifactDetails.artifactVersion;

      this.artifactData.outputDirectoryForArtifact = `${this.artifactData.outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/${artifactDetails.artifactFolderName}`;
      this.artifactData.javaPackageName = artifactDetails.javaPackageName;
      this.artifactData.npmModuleScope = artifactDetails.npmModuleScope;
      this.artifactData.litVocabTermVersion = artifactDetails.litVocabTermVersion;
      this.artifactData.gitRepository = artifactDetails.gitRepository;
      this.artifactData.repository = artifactDetails.repository;

      FileGenerator.createPackagingFiles(this.artifactData, artifactDetails.programmingLanguage);
    });

    return this.artifactData;
  }
}

module.exports = ArtifactGenerator;
module.exports.ARTIFACT_DIRECTORY_ROOT = ARTIFACT_DIRECTORY_ROOT;
module.exports.ARTIFACT_DIRECTORY_SOURCE_CODE = ARTIFACT_DIRECTORY_SOURCE_CODE;
