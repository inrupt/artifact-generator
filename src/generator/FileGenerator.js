const fs = require('fs');
const Handlebars = require('handlebars');
const logger = require('debug')('lit-artifact-generator:FileGenerator');

const ARTIFACT_DIRECTORY_JAVASCRIPT = '/GeneratedSourceCodeArtifacts/Javascript';

class FileGenerator {
  static createFileFromTemplate(templateFile, templateData, outputFile) {
    // To support running from any arbitrary directory, reference our templates relative to this file, and not the
    // current working directory.
    const data = fs.readFileSync(`${__dirname}/${templateFile}`);

    const template = Handlebars.compile(data.toString());
    const contents = template(templateData);

    fs.writeFileSync(outputFile, contents);
    logger(`Created file: [${outputFile}]`);
  }

  static createDirectory(directory) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }

  static createSourceCodeFile(argv, templateData) {
    FileGenerator.createDirectory(
      `${argv.outputDirectory}${ARTIFACT_DIRECTORY_JAVASCRIPT}/GeneratedVocab`
    );

    FileGenerator.createFileFromTemplate(
      '../../templates/javascript-rdf-ext.hbs',
      templateData,
      `${
        argv.outputDirectory
      }${ARTIFACT_DIRECTORY_JAVASCRIPT}/GeneratedVocab/${templateData.vocabNameAndPrefixOverride ||
        templateData.vocabName}.js`
    );
  }

  static createPackagingFiles(argv) {
    FileGenerator.createDirectory(argv.outputDirectory);

    FileGenerator.createFileFromTemplate(
      '../../templates/index.hbs',
      argv,
      `${argv.outputDirectory}${ARTIFACT_DIRECTORY_JAVASCRIPT}/index.js`
    );

    // For our README (which uses Markdown format), if our artifact was made up
    // of multiple vocabs, break up our description into a list representation.
    // (TODO: if a vocab description contains a newline, this will split it out
    // into another list item!).
    const dataWithMarkdownDescription = argv.vocabListFile
      ? { ...argv, description: argv.description.replace(/\\n/g, '\n\n  *') }
      : argv;

    FileGenerator.createFileFromTemplate(
      '../../templates/README.hbs',
      dataWithMarkdownDescription,
      `${argv.outputDirectory}${ARTIFACT_DIRECTORY_JAVASCRIPT}/README.MD`
    );

    FileGenerator.createFileFromTemplate(
      '../../templates/package.hbs',
      argv,
      `${argv.outputDirectory}${ARTIFACT_DIRECTORY_JAVASCRIPT}/package.json`
    );

    return argv;
  }
}

module.exports = FileGenerator;
module.exports.ARTIFACT_DIRECTORY_JAVASCRIPT = ARTIFACT_DIRECTORY_JAVASCRIPT;
