const inquirer = require('inquirer');
const ArtifactConfigurator = require('../ArtifactConfigurator');

const DEFAULT_TEMPLATE = 'java-rdf4j.hbs';
const DEFAULT_EXTENSION = 'java';
const LANGUAGE = 'Java';
const DEFAULT_LIT_VOCAB_TERM_VERSION = '0.1.0-SNAPSHOT';

class JavaArtifactConfigurator extends ArtifactConfigurator {
  constructor() {
    super();
    this.language = LANGUAGE;
    this.litVocabTermVersion = DEFAULT_LIT_VOCAB_TERM_VERSION;
    this.packagingConfig = [];
    this.questions.push(
      {
        type: 'input',
        name: 'javaPackageName',
        message: 'Enter Java package name',
        default: 'com.example.java.packagename',
      },
      {
        type: 'checkbox',
        message: 'Select packaging tools',
        name: 'packagingToInit',
        choices: [{ name: 'maven' }],
      }
    );

    this.config.handlebarsTemplate = DEFAULT_TEMPLATE;
    this.config.sourceFileExtension = DEFAULT_EXTENSION;
    this.config.artifactFolderName = LANGUAGE;
    this.config.programmingLanguage = LANGUAGE;
  }

  async promptPackaging(packagingTools) {
    for (let i = 0; i < packagingTools.length; i += 1) {
      if (packagingTools[i] === 'maven') {
        // The following line requires an await in loop to enable user input
        this.packagingConfig.push(await JavaArtifactConfigurator.promptMaven()); // eslint-disable-line no-await-in-loop
      } else {
        // The values used in this function are selected through an inquirer process,
        // so this case should not happen in a normal usage.
        throw new Error(`Unsupported packaging system: [${packagingTools[i]}]`);
      }
    }
    return this.packagingConfig;
  }

  static async promptMaven() {
    const mavenConfig = {};
    // This makes the finished config file easier to read
    mavenConfig.packagingTool = 'maven';
    mavenConfig.groupId = (await inquirer.prompt({
      type: 'input',
      name: 'groupId',
      message: 'Enter Maven groupId',
      default: 'com.example.groupId',
    })).groupId;
    mavenConfig.publishCommand = (await inquirer.prompt({
      type: 'input',
      name: 'publishCommand',
      message: 'Enter the command used to publish your artifacts',
      default: 'mvn install',
    })).publishCommand;
    const packagingTemplate = {};
    packagingTemplate.template = (await inquirer.prompt({
      type: 'input',
      name: 'template',
      message: 'What POM file template do you want to use ?',
      default: 'pom.hbs',
    })).template;
    packagingTemplate.fileName = 'pom.xml';
    mavenConfig.packagingTemplates = [packagingTemplate];
    return mavenConfig;
  }
}

module.exports.JavaArtifactConfigurator = JavaArtifactConfigurator;
module.exports.LANGUAGE = LANGUAGE;
