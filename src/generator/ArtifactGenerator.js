const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");
const moment = require("moment");
const debug = require("debug")("lit-artifact-generator:ArtifactGenerator");
const ChildProcess = require("child_process");

const FileGenerator = require("./FileGenerator");
const VocabGenerator = require("./VocabGenerator");
const Resource = require("../Resource");
const { describeInput } = require("../Util");
const { DEFAULT_PUBLISH_KEY } = require("../config/GeneratorConfiguration");

// We allow no output directory (in which case generation might be relative to
// configuration file location).
const DEFAULT_OUTPUT_DIRECTORY = ".";

const {
  getArtifactDirectoryRoot,
  getArtifactDirectorySourceCode,
} = require("../Util");

const ARTIFACTS_INFO_TEMPLATE = path.join(
  __dirname,
  "..",
  "..",
  "templates",
  "artifacts-info.hbs"
);
const ARTIFACTS_INFO_FILENAME = ".artifacts-info.txt";

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
    this.artifactData.webpackVersion = "^4.39.1";
    this.artifactData.webpackCliVersion = "^3.3.6";
    this.artifactData.babelCoreVersion = "^7.5.5";
    this.artifactData.babelLoaderVersion = "^8.0.6";

    // Make sure we have something for the output directory.
    this.artifactData.outputDirectory =
      this.artifactData.outputDirectory || ".";
  }

  async generate() {
    return this.generateVocabs()
      .then((vocabDatasets) => {
        if (this.resourceGeneration()) {
          return this.collectGeneratedVocabDetails(vocabDatasets);
        }
        return vocabDatasets;
      })
      .then(async (vocabDatasets) => {
        if (this.resourceGeneration()) {
          if (!this.artifactData.artifactName) {
            this.artifactData.artifactName = vocabDatasets[0].artifactName;
          }
          // If the generation was not sufficient to collect all the required information, the user is asked for it
          await this.configuration.askAdditionalQuestions();
          // TODO: move this formatting directly into the templates.
          const authors = Array.from(this.artifactData.authorSet);
          this.artifactData.contributors = authors;
          this.artifactData.authorSetFormatted = authors.join(", ");
        }
      })
      .then(() => this.generatePackaging())
      .then(() => {
        if (this.resourceGeneration()) {
          FileGenerator.createVersioningFiles(this.artifactData);
        }
      })
      .then(() => this.generateLicense())
      .then(() => {
        // This file is generated after all the artifacts (if we didn't skip the
        // generation). This way, if a vocabulary resource has been modified
        // more recently than this file, we know that the artifacts are
        // outdated.
        // NOTE: We only check the overall 'generated' flag here, since we need
        // this file created/updated regardless of whether we're generating or
        // watching.
        if (this.artifactData.generated) {
          FileGenerator.createFileFromTemplate(
            ARTIFACTS_INFO_TEMPLATE,
            this.artifactData,
            path.join(
              this.artifactData.outputDirectory,
              getArtifactDirectoryRoot(this.artifactData),
              ARTIFACTS_INFO_FILENAME
            )
          );
        }
      })
      .then(() => this.artifactData)
      .catch((error) => {
        throw error;
      });
  }

  async isGenerationNecessary() {
    // The --force option overrides the logic of this function.
    return this.artifactData.force || (await this.checkIfGenerationNecessary());
  }

  async checkIfGenerationNecessary() {
    let artifactsOutdated = false;
    const artifactInfoPath = path.join(
      this.artifactData.outputDirectory,
      getArtifactDirectoryRoot(this.artifactData),
      ARTIFACTS_INFO_FILENAME
    );

    let modifiedResourceList = [];

    const lastGenerationTime = fs.existsSync(artifactInfoPath)
      ? fs.statSync(artifactInfoPath).mtimeMs
      : undefined;
    const configFileModificationTime = this.configuration.configuration
      .vocabListFile
      ? fs.statSync(this.configuration.configuration.vocabListFile).mtimeMs
      : 0;

    // If we had a generation before, and if we have a configuration file that
    // hasn't changed since then, then check if any of the vocabs themselves
    // have changed since that previous generation.
    // If we didn't have a generation, or our configuration file has changed
    // since a previous generation, then re-generate everything.
    if (lastGenerationTime && configFileModificationTime < lastGenerationTime) {
      // A generated directory exists, so we are going to check the contained
      // artifacts are up-to-date.
      const lastGenerationTime = fs.statSync(artifactInfoPath).mtimeMs;
      modifiedResourceList = await this.configuration.getInputResourcesChangedSince(
        lastGenerationTime
      );

      if (modifiedResourceList.length === 0) {
        debug(
          `Skipping generation: artifacts already exist in the target directory [${path.join(
            this.artifactData.outputDirectory,
            getArtifactDirectoryRoot(this.artifactData)
          )}], and there have been no modifications to the vocabularies or configuration files since their generation on [${moment(
            lastGenerationTime
          ).format(
            "LLLL"
          )}]. Use the '--force' command-line option to re-generate the artifacts regardless.`
        );
      }
    } else {
      // There are no artifacts in the target directory, so consider everything
      // as modified.
      modifiedResourceList = this.configuration.getInputResources();
    }

    this.configuration.modifiedResourceList = modifiedResourceList;

    return modifiedResourceList.length > 0;
  }

  async generateVocabs() {
    // The outputDirectoryForArtifact attribute is useful for publication,
    // and should be set even if generation is not necessary.
    this.artifactData.artifactToGenerate = this.artifactData.artifactToGenerate.map(
      (artifactDetails) => {
        const result = artifactDetails;

        if (this.artifactData.clearOutputDirectory) {
          const rootDir = path.join(
            this.artifactData.outputDirectory,
            getArtifactDirectoryRoot(this.artifactData)
          );

          rimraf.sync(rootDir);
        }

        result.outputDirectoryForArtifact = path.join(
          this.artifactData.outputDirectory,
          getArtifactDirectorySourceCode(this.artifactData),
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

      // Determine just the changed vocabs (if 'force' is set, then consider
      // all vocabs as 'changed'), else only consider vocabs that appear to have
      // been modified.
      const changedVocabList = this.artifactData.force
        ? this.artifactData.vocabList
        : this.artifactData.vocabList.filter((vocabDetails) => {
            return vocabDetails.inputResources.some((r) =>
              this.configuration.modifiedResourceList.includes(r)
            );
          });

      return Promise.all(
        changedVocabList.map(async (vocabDetails) => {
          // Override our vocab inputs using this vocab list entry.
          this.artifactData.inputResources = vocabDetails.inputResources;
          this.artifactData.termSelectionResource =
            vocabDetails.termSelectionResource;
          this.artifactData.nameAndPrefixOverride =
            vocabDetails.nameAndPrefixOverride;
          this.artifactData.namespaceOverride = vocabDetails.namespaceOverride;

          // Generate this vocab for each artifact we are generating for.
          const artifactPromises = this.artifactData.artifactToGenerate.map(
            (artifactDetails) => {
              return new VocabGenerator(
                this.artifactData,
                artifactDetails
              ).generate();
            }
          );

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
      vocabDatasets.map(async (vocabData) => {
        this.artifactData.description += `\n\n - ${vocabData.vocabName}: ${vocabData.description}`;
        this.artifactData.generatedVocabs.push({
          vocabName: vocabData.vocabName,
          vocabNameUpperCase: vocabData.vocabNameUpperCase,
        });
        vocabData.authorSet.forEach((author) =>
          this.artifactData.authorSet.add(author)
        );
      })
    );
    return vocabDatasets;
  }

  /**
   * Checks if we are configured to generate resources (as opposed to watching
   * resourcs, or initializing, etc.).
   * @returns {*}
   */
  resourceGeneration() {
    return (
      this.artifactData.generated &&
      this.artifactData["_"] &&
      this.artifactData["_"].includes("generate")
    );
  }

  async generatePackaging() {
    // If the artifacts have not been generated, it's not necessary to
    // re-package them, but also only generate if we are configured to generate.
    if (this.resourceGeneration()) {
      this.artifactData.artifactToGenerate.forEach((artifactDetails, index) => {
        if (!artifactDetails.packaging) {
          throw new Error(
            `No packaging information for artifact number [${index}] from ${describeInput(
              this.artifactData
            )}.`
          );
        }

        debug(`Generating [${artifactDetails.programmingLanguage}] packaging`);

        // TODO: manage repositories properly
        this.artifactData.gitRepository = artifactDetails.gitRepository;
        this.artifactData.repository = artifactDetails.repository;
        artifactDetails.packaging.forEach((packagingDetails) => {
          FileGenerator.createPackagingFiles(
            this.artifactData,
            artifactDetails,
            packagingDetails
          );
        });
      });

      // Generate README in the root. First convert our bundle description into
      // Markdown (the format for README files).
      const dataWithMarkdownDescription = FileGenerator.convertDescriptionToMarkdown(
        this.artifactData
      );

      FileGenerator.createFileFromTemplate(
        `${__dirname}/../../templates/README.hbs`,
        dataWithMarkdownDescription,
        path.join(
          this.artifactData.outputDirectory,
          getArtifactDirectoryRoot(this.artifactData),
          "README.md"
        )
      );
    }
  }

  generateLicense() {
    if (
      this.resourceGeneration() &&
      this.artifactData.license &&
      this.artifactData.license.path
    ) {
      this.artifactData.artifactToGenerate.forEach((artifactDetails) => {
        const licenseText = fs.readFileSync(this.artifactData.license.path);
        fs.writeFileSync(
          path.join(
            artifactDetails.outputDirectoryForArtifact,
            this.artifactData.license.fileName
          ),
          licenseText
        );
      });
    }
  }

  /**
   * Executes the publication commands associated to a specific artifact.
   * @param {*} artifact
   * @param {string} key identifier for the publication configuration
   */
  static publishArtifact(artifact, key) {
    const homeDir = process.cwd();
    for (let i = 0; i < artifact.packaging.length; i += 1) {
      // The artifact contains packaging configuration, each of which does not
      // necessarily encompass publication options
      const publishConfigs = artifact.packaging[i].publish;
      if (publishConfigs) {
        for (let j = 0; j < publishConfigs.length; j += 1) {
          if (
            publishConfigs[j].key === key ||
            publishConfigs[j].key === DEFAULT_PUBLISH_KEY
          ) {
            // A special case: when the user uses the --publish option via a
            // CLI configuration, no key is associated to the publication
            // config by the user, so the DEFAULT_PUBLISH_KEY is set.
            const runFrom = path.join(
              homeDir,
              artifact.outputDirectoryForArtifact
            );
            debug(`Changing to directory [${runFrom}].`);
            process.chdir(runFrom);

            debug(
              `Running command [${publishConfigs[j].command}] to publish artifact with version [${artifact.artifactVersion}] according to [${publishConfigs[j].key}] configuration in directory [${artifact.outputDirectoryForArtifact}].`
            );

            try {
              publishConfigs[j].command
                .split("&&")
                .map((str) => str.trim())
                .map((command) => {
                  debug(`Running sub-command [${command}]...`);
                  try {
                    ChildProcess.execSync(command);
                  } catch (err) {
                    // This handling was added due to intermittent, but regular,
                    // failures when trying to unpublish packages from a local
                    // Verdaccio instance when running tests to generate all
                    // vocabs found within a directory - i.e. simply 'trying
                    // again immediately' seems to just work!
                    if (command.startsWith("npm unpublish")) {
                      debug(`Re-running sub-command [${command}]...`);
                      ChildProcess.execSync(command);
                    }
                  }
                });
            } finally {
              // Make sure we retore our starting directory, regardless of any
              // process execution problems...
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

    if (generationData.generated) {
      // This should be parallelized, but the need to change the CWD makes it harder on thread-safety.
      // Ideally, new processes should be spawned, each running a packaging command, but the fork
      // command does not work in Node as it does in Unix (i.e. it does not clone the current process)
      // so it is more work than expected. Running it sequentially is fine for now.
      for (let i = 0; i < generationData.artifactToGenerate.length; i += 1) {
        ArtifactGenerator.publishArtifact(
          generationData.artifactToGenerate[i],
          key
        );
      }

      generationData.ranPublish = true;
    }

    return generationData;
  }
}

module.exports = ArtifactGenerator;
module.exports.DEFAULT_OUTPUT_DIRECTORY = DEFAULT_OUTPUT_DIRECTORY;
module.exports.ARTIFACTS_INFO_FILENAME = ARTIFACTS_INFO_FILENAME;
