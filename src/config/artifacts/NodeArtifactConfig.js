const ArtifactConfig = require('../ArtifactConfig');

const DEFAULT_TEMPLATE = 'javascript-rdf-ext.hbs';
const DEFAULT_EXTENSION = 'js';
const LANGUAGE = 'Javascript';

class NodeArtifactConfig extends ArtifactConfig {
  constructor() {
    super();
    this.language = LANGUAGE;
    this.questions.push({
      type: 'input',
      name: 'npmModuleScope',
      message: 'Scope for the npm module',
      default: '@exampleScope/',
    });

    this.config.handlebarsTemplate = DEFAULT_TEMPLATE;
    this.config.sourceFileExtension = DEFAULT_EXTENSION;
    this.config.programmingLanguage = LANGUAGE;
    this.config.artifactFolderName = LANGUAGE;
  }
}

module.exports.NodeArtifactConfig = NodeArtifactConfig;
module.exports.LANGUAGE = LANGUAGE;
