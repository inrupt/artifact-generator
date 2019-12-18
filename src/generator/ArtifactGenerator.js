const path = require('path');
const fs = require('fs');
const debug = require('debug')('lit-artifact-generator:ArtifactGenerator');
const ChildProcess = require('child_process');

const FileGenerator = require('./FileGenerator');
const VocabGenerator = require('./VocabGenerator');
const Resource = require('../Resource');
const { DEFAULT_PUBLISH_KEY } = require('../config/GeneratorConfiguration');

const ARTIFACT_DIRECTORY_ROOT = '/Generated';
const ARTIFACT_DIRECTORY_SOURCE_CODE = path.join(ARTIFACT_DIRECTORY_ROOT, 'SourceCodeArtifacts');
const ARTIFACTS_INFO_TEMPLATE = path.join(__dirname, '..', '..', 'templates', 'artifacts-info.hbs');
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
    this.artifactData.authorSet = new Set();

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
        if (this.artifactData.generated) {
          if (!this.artifactData.artifactName) {
            this.artifactData.artifactName = vocabDatasets[0].artifactName;
          }
          // If the generation was not sufficient to collect all the required information, the user is asked for it
          await this.configuration.askAdditionalQuestions();
          // TODO: move this formatting directly into the templates
          this.artifactData.contributors = Array.from(this.artifactData.authorSet);
        }
      })
      .then(() => this.generatePackaging())
      .then(() => FileGenerator.createVersioningFiles(this.artifactData))
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
    // The --force option overrides the logic of this function
    if (this.artifactData.force) {
      return true;
    }
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
      const vocabsLastModificationTime = [];
      const resources = this.configuration.getInputResources();
      for (let i = 0; i < resources.length; i += 1) {
        vocabsLastModificationTime.push(Resource.getResourceLastModificationTime(resources[i]));
      }
      await Promise.all(vocabsLastModificationTime).then(values => {
        // The artifact is outdated if one vocabulary is more recent than the artifact
        artifactsOutdated = values.reduce((accumulator, lastModif) => {
          return lastGenerationTime < lastModif || accumulator;
        }, artifactsOutdated);
      });
      if (!artifactsOutdated) {
        debug(
          `Skipping generation: artifacts already exist in the target directory [${path.join(
            this.artifactData.outputDirectory,
            ARTIFACT_DIRECTORY_ROOT
          )}], and there have been no modifications to the vocabularies since their generation on [${
            fs.statSync(artifactInfoPath).mtime
          }]. Use the '--force' command-line option to re-generate the artifacts regardless.`
        );
      }
    } else {
      // There are no artifacts in the target directory.
      artifactsOutdated = true;
    }

    return artifactsOutdated;
  }

  async generateVocabs() {
    // The outputDirectoryForArtifact attribute is useful for publication,
    // and should be set even if generation is not necessary.
    this.artifactData.artifactToGenerate = this.artifactData.artifactToGenerate.map(
      artifactDetails => {
        const result = artifactDetails;
        result.outputDirectoryForArtifact = path.join(
          this.artifactData.outputDirectory,
          ARTIFACT_DIRECTORY_SOURCE_CODE,
          artifactDetails.artifactDirectoryName
        );
        return result;
      }
    );
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
          this.artifactData.termSelectionResource = vocabDetails.termSelectionResource;
          this.artifactData.nameAndPrefixOverride = vocabDetails.nameAndPrefixOverride;
          this.artifactData.namespaceOverride = vocabDetails.namespaceOverride;

          // Generate this vocab for each artifact we are generating for.
          const artifactPromises = this.artifactData.artifactToGenerate.map(artifactDetails => {
            return new VocabGenerator(this.artifactData, artifactDetails).generate();
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
    this.artifactData.description = `Bundle of vocabularies that includes the following:`;
    await Promise.all(
      vocabDatasets.map(async vocabData => {
        this.artifactData.description += `\n\n  ${vocabData.vocabName}: ${vocabData.description}`;
        this.artifactData.generatedVocabs.push({
          vocabName: vocabData.vocabName,
          vocabNameUpperCase: vocabData.vocabNameUpperCase,
        });
        vocabData.authorSet.forEach(author => this.artifactData.authorSet.add(author));
      })
    );
    return vocabDatasets;
  }

  async generatePackaging() {
    // If the artifacts have not been generated, it's not necessary to re-package them
    if (this.artifactData.generated) {
      this.artifactData.artifactToGenerate.forEach(artifactDetails => {
        if (artifactDetails.packaging) {
          debug(`Generating [${artifactDetails.programmingLanguage}] packaging`);
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
        publish: [{ key: 'local', command: 'mvn install' }],
        packagingTemplates: [
          {
            template: path.join(__dirname, '..', '..', 'templates', 'pom.hbs'),
            fileName: 'pom.xml',
          },
        ],
      });
    } else if (artifactDetails.programmingLanguage === 'Javascript') {
      FileGenerator.createPackagingFiles(this.artifactData, artifactDetails, {
        packagingTool: 'npm',
        npmModuleScope: '@lit/',
        publish: [{ key: 'local', command: 'npm publish --registry http://localhost:4873/' }],
        packagingTemplates: [
          {
            template: path.join(__dirname, '..', '..', 'templates', 'package.hbs'),
            fileName: 'package.json',
          },
          {
            template: path.join(__dirname, '..', '..', 'templates', 'index.hbs'),
            fileName: 'index.js',
          },
        ],
      });
    } else {
      debug(
        `Cannot generate default packaging for unsupported language [${artifactDetails.programmingLanguage}]`
      );
    }
  }

  /**
   * Executes the publication commands associated to a specific artifact.
   * @param {*} artifact
   * @param {string} key identifier for the publication configuration
   */
  static publishArtifact(artifact, key) {
    const homeDir = process.cwd();
    if (artifact.packaging) {
      for (let i = 0; i < artifact.packaging.length; i += 1) {
        // The artifact contains packaging configuration, each of which does not necessarily encompass publication options
        const publishConfigs = artifact.packaging[i].publish;
        if (publishConfigs) {
          for (let j = 0; j < publishConfigs.length; j += 1) {
            if (publishConfigs[j].key === key || publishConfigs[j].key === DEFAULT_PUBLISH_KEY) {
              // A special case: when the user uses the --publish option via a CLI configuration, no key
              // is associated to the publication config by the user, so the DEFAULT_PUBLISH_KEY is set.
              process.chdir(path.join(homeDir, artifact.outputDirectoryForArtifact));
              debug(
                `Running command [${publishConfigs[j].command}] to publish artifact according to [${publishConfigs[j].key}] configuration `
              );
              ChildProcess.execSync(publishConfigs[j].command);
              process.chdir(homeDir);
            }
          }
        }
      }
    }
  }

  /**
   * Executes the publication commands associated to all the declared artifacts.
   * @param {string} key this key identifies the desired publication configuration
   */
  runPublish(key) {
    const generationData = this.configuration.configuration;
    // This should be parallelized, but the need to change the CWD makes it harder on thread-safety.
    // Ideally, new processes should be spawned, each running a packaging command, but the fork
    // command does not work in Node as it does in Unix (i.e. it does not clone the current process)
    // so it is more work than expected. Running it sequentially is fine for now.
    for (let i = 0; i < generationData.artifactToGenerate.length; i += 1) {
      ArtifactGenerator.publishArtifact(generationData.artifactToGenerate[i], key);
    }
    return generationData;
  }
}

module.exports = ArtifactGenerator;
module.exports.ARTIFACT_DIRECTORY_ROOT = ARTIFACT_DIRECTORY_ROOT;
module.exports.ARTIFACT_DIRECTORY_SOURCE_CODE = ARTIFACT_DIRECTORY_SOURCE_CODE;
module.exports.ARTIFACTS_INFO_FILENAME = ARTIFACTS_INFO_FILENAME;
