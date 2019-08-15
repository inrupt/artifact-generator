const fs = require('fs');
const Handlebars = require('handlebars');
const logger = require('debug')('lit-artifact-generator:FileGenerator');

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

  static createSourceCodeFile(argv, artifactDetails, templateData) {
    const outputDirectoryForSourceCode = argv.outputDirectoryForArtifact;

    // For source files that might be packaged (i.e. Java), convert all '.'
    // (dots) in the package name to directory slashes and add to our
    // directory and source file name.
    const packagingDirectory = templateData.javaPackageName
      ? `/${templateData.javaPackageName.replace(/\./g, '/')}`
      : '';
    FileGenerator.createDirectory(
      `${outputDirectoryForSourceCode}/GeneratedVocab${packagingDirectory}`
    );

    FileGenerator.createFileFromTemplate(
      `../../templates/${artifactDetails.handlebarsTemplate}`,
      templateData,
      `${outputDirectoryForSourceCode}/GeneratedVocab${packagingDirectory}/${templateData.nameAndPrefixOverride ||
        templateData.vocabName}.${artifactDetails.sourceFileExtension}`
    );
  }

  static createPackagingFiles(argv) {
    FileGenerator.createDirectory(argv.outputDirectory);

    FileGenerator.createFileFromTemplate(
      '../../templates/.gitignore.hbs',
      argv,
      `${argv.outputDirectoryForArtifact}/.gitignore`
    );

    FileGenerator.createFileFromTemplate(
      '../../templates/index.hbs',
      argv,
      `${argv.outputDirectoryForArtifact}/index.js`
    );

    if (argv.supportBundling) {
      FileGenerator.createDirectory(`${argv.outputDirectoryForArtifact}/config`);

      FileGenerator.createFileFromTemplate(
        '../../templates/webpack.dev.config.hbs',
        argv,
        `${argv.outputDirectoryForArtifact}/config/webpack.dev.config.js`
      );
      FileGenerator.createFileFromTemplate(
        '../../templates/webpack.prod.config.hbs',
        argv,
        `${argv.outputDirectoryForArtifact}/config/webpack.prod.config.js`
      );
    }

    FileGenerator.createFileFromTemplate(
      '../../templates/package.hbs',
      argv,
      `${argv.outputDirectoryForArtifact}/package.json`
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
      `${argv.outputDirectoryForArtifact}/README.MD`
    );

    return argv;
  }
}

module.exports = FileGenerator;
