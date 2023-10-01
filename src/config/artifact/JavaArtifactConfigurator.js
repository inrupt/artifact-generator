const inquirer = require("inquirer");
const path = require("path");
const ArtifactConfigurator = require("../ArtifactConfigurator");
const { ADD_REPOSITORY_CONFIRMATION } = require("../ArtifactConfigurator");

const DEFAULT_TEMPLATE = path.join(
  "solidCommonVocabDependent",
  "java",
  "rdf4j",
  "vocab.hbs",
);
const DEFAULT_EXTENSION = "java";
const LANGUAGE = "Java";
const DEFAULT_VOCAB_TERM_DEPENDENCY_VERSION = "0.1.0-SNAPSHOT";

const MAVEN_ARTIFACT_PROMPT = [
  {
    type: "input",
    name: "groupId",
    message: "Enter Maven groupId",
    default: "com.example.groupId",
  },
  {
    type: "input",
    name: "publishLocal",
    message:
      "Enter the command used to publish your artifacts locally (this can be used by the watcher on each modification of the vocabulary)",
    default: "mvn install",
  },
  {
    type: "input",
    name: "publishRemote",
    message:
      "Enter the command used to deploy your artifacts to remote repositories",
    default: "mvn deploy",
  },
];

const MAVEN_PACKAGING_TEMPLATES_PROMPT = [
  {
    type: "input",
    name: "template",
    message: "What POM file template do you want to use ?",
    default: path.join("java", "rdf4j", "pom.hbs"),
  },
];

const MAVEN_REPOSITORY_PROMPT = [
  {
    type: "input",
    name: "id",
    message: "What is the repository id?",
  },
  {
    type: "list",
    name: "type",
    message: "What type of repository is it?",
    choices: ["repository", "snapshotRepository"],
    default: "repository",
  },
  {
    type: "input",
    name: "url",
    message: "What is the repository url?",
  },
];

class JavaArtifactConfigurator extends ArtifactConfigurator {
  constructor() {
    super();
    this.language = LANGUAGE;
    this.solidCommonVocabVersion = DEFAULT_VOCAB_TERM_DEPENDENCY_VERSION;
    this.questions.push(
      {
        type: "input",
        name: "javaPackageName",
        message: "Enter Java package name",
        default: "com.example.java.packagename",
      },
      {
        type: "checkbox",
        message: "Select packaging tools",
        name: "packagingToInit",
        choices: [{ name: "maven" }],
      },
    );

    this.config.templateInternal = DEFAULT_TEMPLATE;
    this.config.sourceFileExtension = DEFAULT_EXTENSION;
    this.config.artifactDirectoryName = LANGUAGE;
    this.config.programmingLanguage = LANGUAGE;
  }

  async promptPackaging(packagingTools) {
    for (let i = 0; i < packagingTools.length; i += 1) {
      if (packagingTools[i] === "maven") {
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
    // Naming the packaging tool makes the finished config file easier to read
    const mavenConfig = {
      packagingTool: "maven",
    };
    const groupIdAndRepo = await inquirer.prompt(MAVEN_ARTIFACT_PROMPT);
    mavenConfig.groupId = groupIdAndRepo.groupId;
    mavenConfig.publish = [
      {
        key: "local",
        command: groupIdAndRepo.publishLocal,
      },
      { key: "remote", command: groupIdAndRepo.publishRemote },
    ];

    const packagingTemplate = {
      fileName: "pom.xml",
      ...(await inquirer.prompt(MAVEN_PACKAGING_TEMPLATES_PROMPT)),
    };
    mavenConfig.packagingTemplates = [packagingTemplate];
    // The following lines require an await in loop to enable user input
    // eslint-disable-next-line no-await-in-loop
    while ((await inquirer.prompt(ADD_REPOSITORY_CONFIRMATION)).addRepository) {
      // The repository attribute is added to the configuration object only if needed
      if (!mavenConfig.repository) {
        mavenConfig.repository = [];
      }
      mavenConfig.repository.push({
        // eslint-disable-next-line no-await-in-loop
        ...(await inquirer.prompt(MAVEN_REPOSITORY_PROMPT)),
      });
    }
    return mavenConfig;
  }
}

module.exports.JavaArtifactConfigurator = JavaArtifactConfigurator;
module.exports.LANGUAGE = LANGUAGE;
