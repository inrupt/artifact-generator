const inquirer = require('inquirer');

const ArtifactConfigurator = require('../ArtifactConfigurator');

const DEFAULT_TEMPLATE = 'javascript-rdf-ext.hbs';
const DEFAULT_EXTENSION = 'js';
const LANGUAGE = 'Javascript';

const NPM_MODULE_PROMPT = [
  {
    type: 'input',
    name: 'npmModuleScope',
    message: 'Enter NPM module scope',
    default: '@example/scope',
  },
  {
    type: 'input',
    name: 'publishLocal',
    message:
      'Enter the command used to publish your artifacts locally (this can be used by the watcher on each modification of the vocabulary)',
    default: 'npm publish --registry http://localhost:4873',
  },
  {
    type: 'input',
    name: 'publishRemote',
    message: 'Enter the command used to publish your artifacts to a remote registry',
    default: 'npm publish',
  },
];

const NPM_PACKAGING_TEMPLATES_PROMPT = [
  {
    type: 'input',
    name: 'packageTemplate',
    message: "What 'package.json' file template do you want to use ?",
    default: 'package.hbs',
  },
  {
    type: 'input',
    name: 'indexTemplate',
    message: "What 'index.js' file template do you want to use ?",
    default: 'index.hbs',
  },
];

class NodeArtifactConfigurator extends ArtifactConfigurator {
  constructor() {
    super();
    this.language = LANGUAGE;
    this.questions.push({
      type: 'checkbox',
      message: 'Select the packaging tools you want to use',
      name: 'packagingToInit',
      choices: [{ name: 'NPM' }],
    });

    this.config.handlebarsTemplate = DEFAULT_TEMPLATE;
    this.config.sourceFileExtension = DEFAULT_EXTENSION;
    this.config.programmingLanguage = LANGUAGE;
    this.config.artifactFolderName = LANGUAGE;
  }

  async promptPackaging(packagingTools) {
    for (let i = 0; i < packagingTools.length; i += 1) {
      if (packagingTools[i] === 'NPM') {
        // The following line requires an await in loop to enable user input
        this.packagingConfig.push(await NodeArtifactConfigurator.promptNpm()); // eslint-disable-line no-await-in-loop
      } else {
        // The values used in this function are selected through an inquirer process,
        // so this case should not happen in a normal usage.
        throw new Error(`Unsupported packaging system: [${packagingTools[i]}]`);
      }
    }
    return this.packagingConfig;
  }

  static async promptNpm() {
    // Naming the packaging tool makes the finished config file easier to read
    const npmConfig = {
      packagingTool: 'NPM',
      ...(await inquirer.prompt(NPM_MODULE_PROMPT)),
    };
    const packagingTemplate = {
      ...(await inquirer.prompt(NPM_PACKAGING_TEMPLATES_PROMPT)),
    };
    npmConfig.packagingTemplates = [
      { template: packagingTemplate.indexTemplate, fileName: 'index.js' },
      { template: packagingTemplate.packageTemplate, fileName: 'package.json' },
    ];
    return npmConfig;
  }
}

module.exports.NodeArtifactConfigurator = NodeArtifactConfigurator;
module.exports.LANGUAGE = LANGUAGE;
