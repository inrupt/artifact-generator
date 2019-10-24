const ArtifactConfig = require('../ArtifactConfig');

const DEFAULT_TEMPLATE = 'java-rdf4j.hbs';
const DEFAULT_EXTENSION = 'java';
const LANGUAGE = 'Java';

class JavaArtifactConfig extends ArtifactConfig {
  constructor() {
    super();
    this.language = LANGUAGE;
    this.questions.push({
      type: 'input',
      name: 'javaPackageName',
      message: 'Java package name',
      default: 'com.example.java.packagename',
    });

    this.config.handlebarsTemplate = DEFAULT_TEMPLATE;
    this.config.sourceFileExtension = DEFAULT_EXTENSION;
    this.config.artifactFolderName = LANGUAGE;
    this.config.programmingLanguage = LANGUAGE;
  }
}

module.exports.JavaArtifactConfig = JavaArtifactConfig;
module.exports.LANGUAGE = LANGUAGE;
