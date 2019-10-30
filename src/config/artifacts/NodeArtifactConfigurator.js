const ArtifactConfigurator = require('../ArtifactConfigurator');

const DEFAULT_TEMPLATE = 'javascript-rdf-ext.hbs';
const DEFAULT_EXTENSION = 'js';
const LANGUAGE = 'Javascript';

class NodeArtifactConfigurator extends ArtifactConfigurator {
  constructor() {
    super();
    this.language = LANGUAGE;
    this.questions.push({
      type: 'input',
      name: 'npmModuleScope',
      message: 'Scope for the NPM module',
      default: '@exampleScope/',
    });

    this.config.handlebarsTemplate = DEFAULT_TEMPLATE;
    this.config.sourceFileExtension = DEFAULT_EXTENSION;
    this.config.programmingLanguage = LANGUAGE;
    this.config.artifactFolderName = LANGUAGE;
  }
}

module.exports.NodeArtifactConfigurator = NodeArtifactConfigurator;
module.exports.LANGUAGE = LANGUAGE;
