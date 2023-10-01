const debug = require("debug")("artifact-generator:ArtifactConfigurator");
const inquirer = require("inquirer");

const DEFAULT_ARTIFACT_VERSION = "0.1.0";
const DEFAULT_KEYWORDS_TO_UNDERSCORE = ["class", "abstract", "default", "this"];

const ADD_REPOSITORY_CONFIRMATION = {
  type: "confirm",
  name: "addRepository",
  message: "Do you want to add a repository to the list ?",
  default: false,
};

/**
 * This is an abstract class that is intended to be extended for each supported programming language.
 * We define the user-prompt questions (and default answers for those questions) that we expect to be
 * shared across all programming languages.
 *
 * See the './artifacts' folder for examples of programming-language-specific extensions of this class.
 */
class ArtifactConfigurator {
  constructor() {
    this.config = {};
    this.questions = [];
    this.packagingQuestions = [];
    this.packagingConfig = [];
    // This member variable will be overriden by extending classes
    this.language = undefined;
    this.solidCommonVocabVersion = undefined;

    // The following questions are asked for each artifact, regardless of the target language
    this.questions.push({
      type: "input",
      name: "artifactVersion",
      message: "Version of the artifact:",
      default: DEFAULT_ARTIFACT_VERSION,
    });

    this.questions.push({
      type: "input",
      name: "solidCommonVocabVersion",
      message: "Version string for Vocab Term dependency:",
      // This may be overridden in extending classes.
      default: this.solidCommonVocabVersion,
    });
    this.config.languageKeywordsToUnderscore = DEFAULT_KEYWORDS_TO_UNDERSCORE;
  }

  async prompt() {
    if (this.language === undefined) {
      // This method should only be called from an extending class
      throw new Error(
        "Unspecified artifact generator. This should be called from a class extending ArtifactConfigurator",
      );
    }
    // The language-specific options have been set when constructing the extending class
    debug(`[${this.language}] artifact generator`);
    this.config = {
      ...this.config,
      ...(await inquirer.prompt(this.questions)),
    };
    if (this.config.packagingToInit) {
      this.config.packaging = await this.promptPackaging(
        this.config.packagingToInit,
      );
    }
    return this.config;
  }
}

module.exports = ArtifactConfigurator;
module.exports.ADD_REPOSITORY_CONFIRMATION = ADD_REPOSITORY_CONFIRMATION;
