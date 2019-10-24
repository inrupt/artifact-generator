const inquirer = require('inquirer');
const FileGenerator = require('./FileGenerator');

// Config generators
const { JavaArtifactConfig, LANGUAGE: JAVA } = require('../config/artifacts/JavaArtifactConfig');
const {
  NodeArtifactConfig,
  LANGUAGE: JAVASCRIPT,
} = require('../config/artifacts/NodeArtifactConfig');
const { VocabularyConfig } = require('../config/VocabularyConfig');

const SUPPORTED_LANGUAGES = {};
SUPPORTED_LANGUAGES[JAVA] = JavaArtifactConfig;
SUPPORTED_LANGUAGES[JAVASCRIPT] = NodeArtifactConfig;

// Templates
const CONFIG_TEMPLATE_PATH = '../../templates/empty-config.hbs';
const DEFAULT_CONFIG_TEMPLATE_PATH = '../../templates/initial-config.hbs';

// Default values
const DEFAULT_AUTHOR = 'Cleopatra (https://cleopatra.solid.community/profile/card#me)';
const DEFAULT_ADD_VOCAB = false;

const GENERAL_QUESTIONS = [
  {
    type: 'input',
    name: 'artifactName',
    message: 'Name of the artifacts:',
  },
  {
    type: 'input',
    name: 'authorSet',
    message: 'Artifact authors:',
    default: DEFAULT_AUTHOR,
  },
];

function validateLanguageCheckboxes(answer) {
  if (answer.length < 1) {
    // This mismatch in return types is expected by inquirer
    return 'You must choose at least one target language.';
  }
  return true;
}

const LANGUAGES_CHECKBOXES = {
  type: 'checkbox',
  message: 'Select target languages',
  name: 'languages',
  choices: [{ name: JAVA }, { name: JAVASCRIPT }],
  validate: validateLanguageCheckboxes,
};

const ADD_VOCABULARY_CONFIRMATION = {
  type: 'confirm',
  name: 'addVocab',
  message: 'Do you want to add a vocabulary to the list ?',
  default: DEFAULT_ADD_VOCAB,
};

class ConfigFileGenerator {
  constructor(initialConfig) {
    this.config = initialConfig;
  }

  /**
   * This function directly initializes the config object, and can be used
   * to generate the config file without prompting values.
   * @param {*} config
   */
  setConfig(config) {
    ConfigFileGenerator.validateConfig(config);
    this.config = config;
  }

  static buildConfigGenerator(language) {
    if (language in SUPPORTED_LANGUAGES) {
      // SUPPORTED_LANGUAGES is used as a map referencing constructors
      // for language-specific config generator
      return new SUPPORTED_LANGUAGES[language]();
    }
    throw new Error(`Unsported language: no config generator is registered for [${language}]`);
  }

  /**
   * Interactively collects the information used to generate the artifacts section
   * of the config file.
   */
  static async promptArtifacts(languages) {
    const artifacts = [];
    // The previous inquirer returns
    for (let i = 0; i < languages.length; i += 1) {
      const generator = ConfigFileGenerator.buildConfigGenerator(languages[i]);
      // All generators should extend the ArtifactConfig class,
      // and therefore implement the prompt() method
      artifacts.push(generator.prompt());
    }
    return Promise.all(artifacts);
  }

  /**
   * Interactively collects the information used to generate the vocabulary section
   * of the config file.
   */
  static async promptVocabularies() {
    const vocabularies = [];
    let addVocab = await inquirer.prompt(ADD_VOCABULARY_CONFIRMATION);
    while (addVocab.addVocab) {
      vocabularies.push(VocabularyConfig.prompt());
      // The next line requires the usage of an await inside a loop,
      // because re-entering the loop depends on user input
      addVocab = await inquirer.prompt(ADD_VOCABULARY_CONFIRMATION); // eslint-disable-line no-await-in-loop
    }
    return Promise.all(vocabularies);
  }

  /**
   * Collects all the information required to generate the config file.
   */
  async collectConfigInfo() {
    // Get the info shared among artifacts
    this.config = { ...this.config, ...(await inquirer.prompt(GENERAL_QUESTIONS)) };
    // Get the artifact information
    // List the different artifacts to generate in a map containing only one key-value pair
    const languages = await inquirer.prompt(LANGUAGES_CHECKBOXES);
    this.config.artifactToGenerate = await ConfigFileGenerator.promptArtifacts(languages.languages);
    // Get the vocabulary information
    this.config.vocabList = await ConfigFileGenerator.promptVocabularies();
  }

  /**
   * Validates if the config is valid.
   */
  static validateConfig(config) {
    // Currently, we only check that some properties have been set
    if (Object.entries(config).length === 0) {
      throw new Error(
        `Invalid configuration: [${config}] cannot be used to generate the configuration YAML file.`
      );
    }
  }

  /**
   * Generates a config file using the data in the config attribute of the current object.
   * This attribute should previously have been set, either through user prompt, or directy
   * by the app.
   * @param {string} targetPath the path to the generated file
   */
  generateConfigFile(targetPath) {
    ConfigFileGenerator.validateConfig(this.config);
    FileGenerator.createFileFromTemplate(CONFIG_TEMPLATE_PATH, this.config, targetPath);
  }

  /**
   * Generates a default config file, relying on no input from the user.
   * @param {string} targetPath the path to the generated file
   */
  generateDefaultConfigFile(targetPath) {
    // this.config is required here, because it contains at least contextual information
    // provided by the global app context, such as time of generation or app version
    FileGenerator.createFileFromTemplate(DEFAULT_CONFIG_TEMPLATE_PATH, this.config, targetPath);
  }
}

module.exports.ConfigFileGenerator = ConfigFileGenerator;
module.exports.validateLanguageCheckboxes = validateLanguageCheckboxes;
