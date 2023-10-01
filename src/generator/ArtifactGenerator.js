const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

const moment = require("moment");
const debug = require("debug")("artifact-generator:ArtifactGenerator");
const ChildProcess = require("child_process");

const FileGenerator = require("./FileGenerator");
const VocabGenerator = require("./VocabGenerator");
const Resource = require("../Resource");
const CommandLine = require("../CommandLine");
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
  "template",
  "artifacts-info.hbs",
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

    // Make sure we have something for the output directory.
    this.artifactData.outputDirectory =
      this.artifactData.outputDirectory || ".";
  }

  async generate() {
    return this.generateVocabs()
      .then((vocabDatasets) => {
        if (this.areWeConfiguredToGenerateResources()) {
          return this.collectGeneratedVocabDetails(vocabDatasets);
        }
        return vocabDatasets;
      })
      .then(async (vocabDatasets) => {
        if (this.areWeConfiguredToGenerateResources()) {
          if (!this.artifactData.artifactName) {
            this.artifactData.artifactName = vocabDatasets[0].artifactName;
          }
          // If the generation was not sufficient to collect all the required
          // information, the user is asked for it.
          await this.configuration.askAdditionalQuestions();
          // TODO: move this formatting directly into the templates.
          const authors = Array.from(this.artifactData.authorSet);
          this.artifactData.contributors = authors;
          this.artifactData.authorSetFormatted = authors.join(", ");
        }
      })
      .then(() => this.generatePackaging())
      .then(() => {
        if (this.areWeConfiguredToGenerateResources()) {
          FileGenerator.createVersioningFiles(this.artifactData);
        }
      })
      .then(() => this.generateLicense())
      .then(() => {
        // This file is generated after all the artifacts (if we didn't skip the
        // generation). This way, if a vocabulary resource has been modified
        // more recently than this file, we know that the artifacts are
        // outdated.
        // Note: We only check the overall 'generated' flag here, since we need
        // this file created/updated regardless of whether we're generating or
        // watching.
        if (this.artifactData.generated) {
          FileGenerator.createFileFromTemplate(
            ARTIFACTS_INFO_TEMPLATE,
            this.artifactData,
            path.join(
              this.artifactData.outputDirectory,
              getArtifactDirectoryRoot(this.artifactData),
              ARTIFACTS_INFO_FILENAME,
            ),
          );
        }

        this.artifactData = CommandLine.runWidocoForAllVocabs(
          this.artifactData,
        );
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
      ARTIFACTS_INFO_FILENAME,
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
      modifiedResourceList =
        await this.configuration.getInputResourcesChangedSince(
          lastGenerationTime,
        );

      if (modifiedResourceList.length === 0) {
        debug(
          `Skipping generation: artifacts already exist in the target directory [${path.join(
            this.artifactData.outputDirectory,
            getArtifactDirectoryRoot(this.artifactData),
          )}], and there have been no modifications to the vocabularies or configuration files since their generation on [${moment(
            lastGenerationTime,
          ).format(
            "LLLL",
          )}]. Use the '--force' command-line option to re-generate the artifacts regardless.`,
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

  /**
   * If configured, delete the root output directory for all artifacts (as
   * opposed to deleting each artifact's output directory individually).
   */
  deleteRootArtifactOutputDirectory() {
    const rootDir = path.join(
      this.artifactData.outputDirectory,
      getArtifactDirectoryRoot(this.artifactData),
    );

    rimraf.sync(rootDir);
  }

  async generateNecessaryVocabs() {
    this.artifactData.generated = true;

    // Determine just the changed vocabs (if 'force' is set, then consider
    // all vocabs as 'changed'), else only consider vocabs that appear to
    // have been modified.
    const changedVocabList = this.artifactData.force
      ? this.artifactData.vocabList
      : this.artifactData.vocabList.filter((vocabDetails) => {
          return vocabDetails.inputResources.some((r) =>
            this.configuration.modifiedResourceList.includes(r),
          );
        });

    const result = [];

    for (let i = 0; i < changedVocabList.length; i++) {
      const vocabDetails = changedVocabList[i];

      // Override our vocab inputs using this vocab list entry.
      this.artifactData.inputResources = vocabDetails.inputResources;
      this.artifactData.termSelectionResource =
        vocabDetails.termSelectionResource;

      this.artifactData.vocabAcceptHeaderOverride =
        vocabDetails.vocabAcceptHeaderOverride;

      this.artifactData.vocabContentTypeHeaderOverride =
        vocabDetails.vocabContentTypeHeaderOverride;

      this.artifactData.vocabContentTypeHeaderFallback =
        vocabDetails.vocabContentTypeHeaderFallback;

      this.artifactData.nameAndPrefixOverride =
        vocabDetails.nameAndPrefixOverride;
      this.artifactData.namespaceIriOverride =
        vocabDetails.namespaceIriOverride;

      this.artifactData.vocabularyIriOverride =
        vocabDetails.vocabularyIriOverride;

      this.artifactData.ignoreNonVocabTerms = vocabDetails.ignoreNonVocabTerms;

      // Just in case the vocabulary itself does not provide a description
      // of itself, we pass down the description from our configuration as
      // a fallback (and prefix that description with some text to denote
      // that it's not coming from the original vocabulary itself).
      if (vocabDetails.descriptionFallback) {
        this.artifactData.descriptionFallback = `[Generator provided] - ${vocabDetails.descriptionFallback}`;
      }

      const generatedArtifacts = [];
      // Generate this vocab for each artifact we are generating for.
      for (let i = 0; i < this.artifactData.artifactToGenerate.length; i++) {
        const artifactDetails = this.artifactData.artifactToGenerate[i];

        try {
          generatedArtifacts.push(
            await new VocabGenerator(
              this.artifactData,
              artifactDetails,
            ).generateVocab(),
          );
        } catch (error) {
          const message = `Failed generation: [${error.message}]`;
          debug(message);
          throw new Error(message);
        }
      }

      // Only return the first one, as we don't want duplicate info.
      result.push(generatedArtifacts[0]);
    }

    return result;
  }

  async generateVocabs() {
    if (this.artifactData.clearOutputDirectory) {
      this.deleteRootArtifactOutputDirectory();
    }

    // Setting the output directory for each artifact is useful for
    // publication, and should be set even if generation is not necessary.
    this.artifactData.artifactToGenerate.forEach(
      (artifactDetails) =>
        (artifactDetails.outputDirectoryForArtifact = path.join(
          this.artifactData.outputDirectory,
          getArtifactDirectorySourceCode(this.artifactData),
          artifactDetails.artifactDirectoryName,
        )),
    );

    if (await this.isGenerationNecessary()) {
      return await this.generateNecessaryVocabs();
    }

    // If the generation is not necessary, we just return the initial
    // configuration object.
    this.artifactData.generated = false;
    return this.artifactData;
  }

  async collectGeneratedVocabDetails(vocabDatasets) {
    this.artifactData.description = `Bundle of [${vocabDatasets.length}] vocabularies that includes the following:`;
    await Promise.all(
      [...vocabDatasets]
        .sort((vocabDataA, vocabDataB) =>
          vocabDataA.vocabName.localeCompare(vocabDataB.vocabName),
        )
        .map(async (vocabData) => {
          this.artifactData.description += `\n\n - ${vocabData.vocabName}: ${vocabData.description}`;
          this.artifactData.generatedVocabs.push({
            vocabName: vocabData.vocabName,
            vocabNameUpperCase: vocabData.vocabNameUpperCase,
          });
          vocabData.authorSet.forEach((author) =>
            this.artifactData.authorSet.add(author),
          );
        }),
    );
    return vocabDatasets;
  }

  /**
   * Checks if we are configured to generate resources (as opposed to watching
   * resources, or initializing, etc.).
   * @returns {*}
   */
  areWeConfiguredToGenerateResources() {
    return (
      this.artifactData.generated &&
      // Our command-line processor (YARGS) places commands (e.g. 'generate',
      // 'watch', 'validate', etc.) under the key '_' !
      this.artifactData["_"] &&
      this.artifactData["_"].includes("generate")
    );
  }

  static concatIfDefined(input, value) {
    return `${input}${value === undefined ? "" : value}`;
  }

  async generatePackaging() {
    // If the artifacts have not been generated, it's not necessary to
    // re-package them, but also only generate if we are configured to generate.
    if (this.areWeConfiguredToGenerateResources()) {
      // Collect info on all generated artifacts (using their full suggested
      // names).
      const generatedFullArtifactList = [];

      this.artifactData.artifactToGenerate.forEach((artifactInfo, index) => {
        if (!artifactInfo.packaging) {
          throw new Error(
            `No packaging information for artifact number [${index}] from ${describeInput(
              this.artifactData,
            )}.`,
          );
        }

        // TODO: manage repositories properly
        this.artifactData.gitRepository = artifactInfo.gitRepository;
        this.artifactData.repository = artifactInfo.repository;
        artifactInfo.packaging.forEach((packagingInfo) => {
          debug(
            `Generating [${artifactInfo.programmingLanguage}] packaging for [${packagingInfo.packagingTool}]`,
          );

          // As a mere convenience, we generate what we think should be the full
          // artifact name too - but templates are completely free to create their
          // own interpretations as they see fit.
          const suggestedFullArtifactName = ArtifactGenerator.concatIfDefined(
            ArtifactGenerator.concatIfDefined(
              ArtifactGenerator.concatIfDefined(
                ArtifactGenerator.concatIfDefined(
                  ArtifactGenerator.concatIfDefined(
                    "",
                    // If we have a Java GroupID, then suffix it with a colon
                    // (as that's the Java convention).
                    packagingInfo.groupId === undefined
                      ? ""
                      : `${packagingInfo.groupId}:`,
                  ),
                  packagingInfo.npmModuleScope,
                ),
                artifactInfo.artifactNamePrefix,
              ),
              this.artifactData.artifactName,
            ),
            artifactInfo.artifactNameSuffix,
          );

          artifactInfo.suggestedFullArtifactName = suggestedFullArtifactName;
          generatedFullArtifactList.push({
            programmingLanguage: artifactInfo.programmingLanguage,
            suggestedFullArtifactName,
          });

          FileGenerator.createPackagingFiles(
            this.artifactData,
            artifactInfo,
            packagingInfo,
          );
        });
      });

      // Generate README in the root. First convert our bundle description into
      // Markdown (the format for README files).
      const dataWithMarkdownDescription = {
        ...FileGenerator.convertDescriptionToMarkdown(this.artifactData),
        generatedFullArtifactList,
      };

      FileGenerator.createFileFromTemplate(
        `${__dirname}/../../template/README-artifactBundle.hbs`,
        dataWithMarkdownDescription,
        path.join(
          this.artifactData.outputDirectory,
          getArtifactDirectoryRoot(this.artifactData),
          "README.md",
        ),
      );
    }
  }

  generateLicense() {
    if (
      this.areWeConfiguredToGenerateResources() &&
      this.artifactData.license &&
      this.artifactData.license.path
    ) {
      this.artifactData.artifactToGenerate.forEach((artifactDetails) => {
        const licenseText = fs.readFileSync(this.artifactData.license.path);
        fs.writeFileSync(
          path.join(
            artifactDetails.outputDirectoryForArtifact,
            this.artifactData.license.fileName,
          ),
          licenseText,
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
      // necessarily encompass publication options.
      const publishConfigs = artifact.packaging[i].publish;
      if (publishConfigs) {
        for (let j = 0; j < publishConfigs.length; j += 1) {
          // A special case: when the user uses the --publish option via a
          // CLI configuration, no key is (currently) provided by the user for
          // a publication config, so a default publish key can be set.
          if (
            publishConfigs[j].key === key ||
            publishConfigs[j].key === DEFAULT_PUBLISH_KEY
          ) {
            const runFrom = path.join(
              homeDir,
              artifact.outputDirectoryForArtifact,
            );
            debug(`Changing to directory [${runFrom}].`);
            process.chdir(runFrom);

            debug(
              `Running command [${publishConfigs[j].command}] to publish artifact with version [${artifact.artifactVersion}] according to [${publishConfigs[j].key}] configuration in directory [${artifact.outputDirectoryForArtifact}].`,
            );

            try {
              publishConfigs[j].command
                .split("&&")
                .map((str) => str.trim())
                .map((command) => {
                  debug(`Running sub-command [${command}]...`);
                  let response;
                  try {
                    response = ChildProcess.execSync(command).toString();
                  } catch (error) {
                    // This handling was added due to intermittent, but
                    // regular, failures when trying to unpublish packages
                    // from a local Verdaccio instance when running tests to
                    // generate all vocabs found within a directory - i.e.,
                    // simply 'trying again immediately' seems to just work!
                    if (command.startsWith("npm unpublish")) {
                      // Even re-running the 'unpublish' now fails too, so now
                      // we ignore failures on this retry, but only for
                      // 'npm unpublish' commands!
                      const commandIgnoringFailure = `(${command} || true)`;
                      debug(
                        `Re-running sub-command ignoring failure this time [${commandIgnoringFailure}]...`,
                      );
                      response = ChildProcess.execSync(
                        commandIgnoringFailure,
                      ).toString();
                    } else {
                      const message = `Error executing sub-command [${command}], details (stdout): [${error.stdout.toString()}], stderr: [${error.stderr.toString()}]`;
                      debug(message);
                      throw new Error(message);
                    }
                  }

                  debug(`Response from running [${command}] was [${response}]`);
                });
            } finally {
              // Make sure we restore our starting directory, regardless of any
              // process execution problems...
              process.chdir(homeDir);
            }
          }
        }
      }
    }
  }

  /**
   * Executes the publication commands associated with all declared artifacts.
   * @param {string} publicationConfigKey this key identifies the desired
   * publication configuration
   */
  runPublish(publicationConfigKey) {
    const generationData = this.configuration.configuration;

    if (generationData.generated) {
      // This should be parallelized, but the need to change the current working
      // directory for each artifact makes it harder to maintain thread-safety.
      // Ideally, new processes should be spawned, each running a packaging
      // command, but the fork command does not work in Node as it does in Unix
      // (i.e. it does not clone the current process) so it is more work than
      // expected. Running it sequentially is fine for now.
      for (let i = 0; i < generationData.artifactToGenerate.length; i += 1) {
        ArtifactGenerator.publishArtifact(
          generationData.artifactToGenerate[i],
          publicationConfigKey,
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
