const inquirer = require("inquirer");
const path = require("path");
const moment = require("moment");
const FileGenerator = require("./FileGenerator");
const packageDotJson = require("../../package.json");

// Configuration generators.
const {
  JavaArtifactConfigurator,
  LANGUAGE: JAVA,
} = require("../config/artifact/JavaArtifactConfigurator");

const {
  NodeArtifactConfigurator,
  LANGUAGE: JAVASCRIPT,
} = require("../config/artifact/NodeArtifactConfigurator");

const { VocabularyConfigurator } = require("../config/VocabularyConfigurator");

const GIT = "git";
const SVN = "svn";

const SUPPORTED_LANGUAGES = {};
SUPPORTED_LANGUAGES[JAVA] = JavaArtifactConfigurator;
SUPPORTED_LANGUAGES[JAVASCRIPT] = NodeArtifactConfigurator;

// Templates
const CONFIG_TEMPLATE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "template",
  "empty-config.hbs",
);
const DEFAULT_CONFIG_TEMPLATE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "template",
  "initial-config.hbs",
);

// Default values.
const DEFAULT_ADD_VOCAB = false;

const GENERAL_QUESTIONS = [
  {
    type: "input",
    name: "artifactName",
    message: "Name of the artifacts:",
  },
];

function validateLanguageCheckboxes(answer) {
  if (answer.length < 1) {
    // This mismatch in return types is expected by inquirer.
    return "You must choose at least one target language.";
  }

  return true;
}

const LANGUAGES_CHECKBOXES = {
  type: "checkbox",
  message: "Select target languages",
  name: "languages",
  choices: [{ name: JAVA }, { name: JAVASCRIPT }],
  validate: validateLanguageCheckboxes,
};

function validateRepositoryCheckboxes(answer) {
  if (answer.length > 1) {
    // This mismatch in return types is expected by inquirer
    return "You must choose at most one repository type.";
  }

  return true;
}

const REPOSITORY_CHECKBOX = {
  type: "checkbox",
  message:
    "Is the YAML file (and potentially some vocabularies) going to be versioned? If not, validate to continue.",
  name: "repositoryType",
  choices: [{ name: GIT }, { name: SVN }],
  validate: validateRepositoryCheckboxes,
};

const REPOSITORY_URL = {
  type: "input",
  message: "What is the URL of the repository ?",
  name: "repositoryUrl",
};

const GITIGNORE_TEMPLATE = {
  type: "input",
  message: "Please provide a '.gitignore' template",
  name: "gitignoreTemplate",
  default: ".gitignore.hbs",
};

const ADD_VOCABULARY_CONFIRMATION = {
  type: "confirm",
  name: "addVocab",
  message: "Do you want to add a vocabulary to the list ?",
  default: DEFAULT_ADD_VOCAB,
};

class ConfigFileGenerator {
  constructor(initialConfig) {
    this.config = {
      generatedTimestamp: moment().format("LLLL"),
      ...initialConfig,
      generatorName: packageDotJson.name,
      artifactGeneratorVersion: packageDotJson.version,
    };
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
      // for language-specific config generator.
      return new SUPPORTED_LANGUAGES[language]();
    }

    throw new Error(
      `Unsported language: no config generator is registered for [${language}]`,
    );
  }

  static async promptRepository() {
    const repositoryConfig = {};
    const repositoryType = await inquirer.prompt(REPOSITORY_CHECKBOX);
    if (repositoryType.repositoryType.length > 0) {
      // If the value is not null, only one can be retrieved.
      [repositoryConfig.type] = repositoryType.repositoryType;

      repositoryConfig.url = (
        await inquirer.prompt(REPOSITORY_URL)
      ).repositoryUrl;
      // Each repository type may be associated with specific files (e.g. a
      // .gitignore).
      if (repositoryConfig.type === GIT) {
        const template = (await inquirer.prompt(GITIGNORE_TEMPLATE))
          .gitignoreTemplate;
        repositoryConfig.versioningTemplates = [
          {
            templateInternal: template,
            fileName: ".gitignore",
            template: path.join("template", template),
          },
        ];
      }
    }

    // If the type is not set, return null to avoid adding an empty element to
    // the target configuration object.
    return repositoryConfig.type ? repositoryConfig : null;
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
      // and therefore implement the 'prompt()' method.
      artifacts.push(await generator.prompt()); // eslint-disable-line no-await-in-loop
    }

    return artifacts;
  }

  /**
   * Interactively collects the information used to generate the vocabulary section
   * of the config file.
   */
  static async promptVocabularies() {
    const vocabularies = [];
    let addVocab = await inquirer.prompt(ADD_VOCABULARY_CONFIRMATION);
    while (addVocab.addVocab) {
      // Here we require 'await' inside a loop, because iterations
      // must be sequential, as they require user input. For each vocabulary,
      // the user is asked a series of questions (e.g. input resources or prefix),
      // and then he/she is asked whether more vocabularies should be added to the
      // config file or not.
      vocabularies.push(await VocabularyConfigurator.prompt()); // eslint-disable-line no-await-in-loop
      addVocab = await inquirer.prompt(ADD_VOCABULARY_CONFIRMATION); // eslint-disable-line no-await-in-loop
    }

    return vocabularies;
  }

  /**
   * Collects all the information required to generate the config file.
   */
  async collectConfigInfo() {
    // Get the info shared across all artifacts.
    this.config = {
      ...this.config,
      ...(await inquirer.prompt(GENERAL_QUESTIONS)),
    };
    const repository = await ConfigFileGenerator.promptRepository();
    if (repository) {
      this.config.versioning = repository;
    }
    // Get artifact information.
    // Collect the different artifacts to generate in a map containing only one key-value pair.
    const languages = await inquirer.prompt(LANGUAGES_CHECKBOXES);
    this.config.artifactToGenerate = await ConfigFileGenerator.promptArtifacts(
      languages.languages,
    );

    // Get vocabulary information.
    this.config.vocabList = await ConfigFileGenerator.promptVocabularies();
  }

  /**
   * Validates the specified configuration.
   */
  static validateConfig(config) {
    // Currently, we only check that some properties have been set
    if (Object.entries(config).length === 0) {
      throw new Error(
        `Invalid configuration: [${config}] cannot be used to generate the configuration YAML file.`,
      );
    }
  }

  /**
   * Generates a config file using the data in the config attribute of the current object.
   * This attribute should previously have been set, either through user prompt or directly
   * by the application.
   
   * @param {string} targetPath the path to the generated file
   */
  generateConfigFile(targetPath) {
    ConfigFileGenerator.validateConfig(this.config);
    FileGenerator.createFileFromTemplate(
      CONFIG_TEMPLATE_PATH,
      this.config,
      targetPath,
    );
  }

  /**
   * Generates a default config file, relying on no input from the user.
   
   * @param {string} targetPath the path to the generated file
   */
  generateDefaultConfigFile(targetPath) {
    // 'this.config' is required here because it contains contextual information
    // provided by the global app context, such as time of generation or app version.
    FileGenerator.createFileFromTemplate(
      DEFAULT_CONFIG_TEMPLATE_PATH,
      this.config,
      targetPath,
    );
  }
}

module.exports.ConfigFileGenerator = ConfigFileGenerator;
module.exports.validateLanguageCheckboxes = validateLanguageCheckboxes;
module.exports.validateRepositoryCheckboxes = validateRepositoryCheckboxes;
module.exports.DEFAULT_CONFIG_TEMPLATE_PATH = DEFAULT_CONFIG_TEMPLATE_PATH;
