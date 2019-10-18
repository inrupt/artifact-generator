const logger = require('debug')('lit-artifact-generator:ArtifactConfig');
const inquirer = require('inquirer');

const DEFAULT_ARTIFACT_VERSION = '0.1.0';
const DEFAULT_KEYWORDS_TO_UNDERSCORE = ['class', 'abstract'];

/**
 * ArtifactConfig is an abstract class: it should be extended for each supported language.
 * ArtifactConfig defines the prompted questions and the values for options shared by all
 * the artifacts.
 * See the './artifacts' for extensions examples.
 */
class ArtifactConfig {
  constructor() {
    this.config = {};
    this.questions = [];
    // This member variable will be overriden by extending classes
    this.language = undefined;

    // The following questions are asked for each artifact, regardless of the target language
    this.questions.push({
      type: 'input',
      name: 'artifactVersion',
      message: 'Version of the artifact:',
      default: DEFAULT_ARTIFACT_VERSION,
    });

    this.questions.push({
      type: 'input',
      name: 'litVocabTermVersion',
      message: 'Version string for LIT Vocab Term dependency:',
    });
    this.config.languageKeywordsToUnderscore = DEFAULT_KEYWORDS_TO_UNDERSCORE;
  }

  async prompt() {
    if (this.language === undefined) {
      // This method should only be called from an extending class
      throw new Error(
        'Unspecified artifact generator. This should be called from a class extending ArtifactConfig'
      );
    } else {
      // The language-specific options have been set when constructing the extending class
      logger(`[${this.language}] artifact generator`);
      this.config = { ...this.config, ...(await inquirer.prompt(this.questions)) };
      return this.config;
    }
  }
}

module.exports = ArtifactConfig;
