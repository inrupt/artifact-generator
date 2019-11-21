const path = require('path');
const fs = require('fs');
const logger = require('debug')('lit-artifact-generator:ArtifactGenerator');
const ChildProcess = require('child_process');

const FileGenerator = require('./FileGenerator');
const VocabGenerator = require('./VocabGenerator');
const Resources = require('../Resources');

const ARTIFACT_DIRECTORY_ROOT = '/Generated';
const ARTIFACT_DIRECTORY_SOURCE_CODE = path.join(ARTIFACT_DIRECTORY_ROOT, 'SourceCodeArtifacts');
const ARTIFACTS_INFO_TEMPLATE = '../../templates/artifacts-info.hbs';
const ARTIFACTS_INFO_FILENAME = '.artifacts-info.txt';

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

  async generate() {
    return this.generateVocabs()
      .then(vocabDatasets => {
        if (this.artifactData.generated) {
          return this.collectGeneratedVocabDetails(vocabDatasets);
        }
        return vocabDatasets;
      })
      .then(async vocabDatasets => {
        if (this.artifactData.generated && !this.artifactData.artifactName) {
          this.artifactData.artifactName = vocabDatasets[0].artifactName;
        }

        // If the generation was not sufficient to collect all the required information, the user is asked for it
        await this.configuration.askAdditionalQuestions();
      })
      .then(() => this.generatePackaging())
      .then(() => {
        // This file is generated after all the artifacts. This way, if a vocabulary resource
        // has been modified more recently than this file, we know that the artifacts are outdated
        FileGenerator.createFileFromTemplate(
          ARTIFACTS_INFO_TEMPLATE,
          this.artifactData,
          path.join(
            this.artifactData.outputDirectory,
            ARTIFACT_DIRECTORY_ROOT,
            ARTIFACTS_INFO_FILENAME
          )
        );
      })
      .then(() => this.artifactData)
      .catch(error => {
        throw error;
      });
  }

  async isGenerationNecessary() {
    let artifactsOutdated = false;
    const artifactInfoPath = path.join(
      this.artifactData.outputDirectory,
      ARTIFACT_DIRECTORY_ROOT,
      ARTIFACTS_INFO_FILENAME
    );
    if (fs.existsSync(artifactInfoPath)) {
      // A generated directory exists, so we are going to check the contained
      // artifacts are up-to-date.
      const lastGenerationTime = fs.statSync(artifactInfoPath).mtimeMs;
      const vocabsLastModif = [];
      const resources = this.configuration.getInputResources();
      for (let i = 0; i < resources.length; i += 1) {
        vocabsLastModif.push(Resources.getResourceLastModificationTime(resources[i]));
      }
      await Promise.all(vocabsLastModif).then(values => {
        // The artifact is outdated if one vocabulary is more recent than the artifact
        artifactsOutdated = values.reduce((accumulator, lastModif) => {
          return lastGenerationTime < lastModif || accumulator;
        }, artifactsOutdated);
      });
    } else {
      // There are no artifacts in the target directory.
      artifactsOutdated = true;
    }

    return artifactsOutdated;
  }

  async generateVocabs() {
    // TODO: This code evolved from where we originally only had a list of
    //  vocabs to generate from. But now we can create artifacts for multiple
    //  programming languages. But this code was extended to provide the
    //  language-specific details within this original vocab-iterating loop.
    if (await this.isGenerationNecessary()) {
      this.artifactData.generated = true;
      return Promise.all(
        this.artifactData.vocabList.map(async vocabDetails => {
          // Override our vocab inputs using this vocab list entry.
          this.artifactData.inputResources = vocabDetails.inputResources;
          this.artifactData.vocabTermsFrom = vocabDetails.termSelectionFile;
          this.artifactData.nameAndPrefixOverride = vocabDetails.nameAndPrefixOverride;
          this.artifactData.namespaceOverride = vocabDetails.namespaceOverride;

          // Generate this vocab for each artifact we are generating for.
          const artifactPromises = this.artifactData.artifactToGenerate.map(artifactDetails => {
            const artifactConfig = artifactDetails;
            artifactConfig.outputDirectoryForArtifact = path.join(
              this.artifactData.outputDirectory,
              ARTIFACT_DIRECTORY_SOURCE_CODE,
              artifactDetails.artifactFolderName
            );
            return new VocabGenerator(this.artifactData, artifactConfig).generate();
          });
          // Wait for all our artifacts to be generated.
          await Promise.all(artifactPromises);
          // Only return the first one, as we don't want duplicate info.
          return artifactPromises[0];
        })
      );
    }
    // In this case, the generation is not necessary
    this.artifactData.generated = false;
    // If the generation is not necessary, we just return the initial configuration object
    return this.artifactData;
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
    return vocabDatasets;
  }

  async generatePackaging() {
    // If the artifacts have not been generated, it's not necessary to re-package them
    if (this.artifactData.generated) {
      this.artifactData.artifactToGenerate.forEach(artifactDetails => {
        if (artifactDetails.packaging) {
          logger(`Generating [${artifactDetails.programmingLanguage}] packaging`);
          // TODO: manage repositories properly
          this.artifactData.gitRepository = artifactDetails.gitRepository;
          this.artifactData.repository = artifactDetails.repository;
          artifactDetails.packaging.forEach(packagingDetails => {
            FileGenerator.createPackagingFiles(
              this.artifactData,
              artifactDetails,
              packagingDetails
            );
          });
        } else {
          // TODO: this is a temporary fix that should be cleaned up after having updated
          // older YAML files
          this.generateDefaultPackaging(artifactDetails);
        }
      });
    }
  }

  /**
   * Generates Maven packaging for Java artifacts, and NPM packaging for JS artifacts. This method is used
   * to maintain backwards compatibility, and is only called when the relevant options are not set.
   * @param {*} artifactDetails
   */
  generateDefaultPackaging(artifactDetails) {
    // TODO: manage repositories properly
    this.artifactData.gitRepository = artifactDetails.gitRepository;
    this.artifactData.repository = artifactDetails.repository;
    if (artifactDetails.programmingLanguage === 'Java') {
      FileGenerator.createPackagingFiles(this.artifactData, artifactDetails, {
        packagingTool: 'maven',
        groupId: artifactDetails.javaPackageName,
        publishCommand: 'mvn install',
        packagingTemplates: [{ template: 'pom.hbs', fileName: 'pom.xml' }],
      });
    } else if (artifactDetails.programmingLanguage === 'Javascript') {
      FileGenerator.createPackagingFiles(this.artifactData, artifactDetails, {
        packagingTool: 'npm',
        npmModuleScope: '@lit/',
        publishCommand: 'npm publish --registry http://localhost:4873/',
        packagingTemplates: [
          { template: 'package.hbs', fileName: 'package.json' },
          { template: 'index.hbs', fileName: 'index.js' },
        ],
      });
    } else {
      logger(
        `Cannot generate default packaging for unsupported language [${artifactDetails.programmingLanguage}]`
      );
    }
  }

  static publishArtifact(artifact) {
    const homeDir = process.cwd();
    if (artifact.packaging) {
      for (let j = 0; j < artifact.packaging.length; j += 1) {
        if (artifact.packaging[j].publishCommand) {
          process.chdir(path.join(homeDir, artifact.outputDirectoryForArtifact));
          logger(`Running command [${artifact.packaging[j].publishCommand}]...`);
          ChildProcess.execSync(artifact.packaging[j].publishCommand);
          process.chdir(homeDir);
        }
      }
    }
  }

  publish() {
    const generationData = this.configuration.configuration;
    // This should be parallelized, but the need to change the CWD makes it harder on thread-safety.
    // Ideally, new processes should be spawned, each running a packaging command, but the fork
    // command does not work in Node as it does in Unix (i.e. it does not clone the current process)
    // so it is more work than expected. Running it sequentially is fine for now.
    for (let i = 0; i < generationData.artifactToGenerate.length; i += 1) {
      ArtifactGenerator.publishArtifact(generationData.artifactToGenerate[i]);
    }
    return generationData;
  }
}

module.exports = ArtifactGenerator;
module.exports.ARTIFACT_DIRECTORY_ROOT = ARTIFACT_DIRECTORY_ROOT;
module.exports.ARTIFACT_DIRECTORY_SOURCE_CODE = ARTIFACT_DIRECTORY_SOURCE_CODE;
module.exports.ARTIFACTS_INFO_FILENAME = ARTIFACTS_INFO_FILENAME;
