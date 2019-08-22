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

  /**
   * We may need to escape parts of our template data for the generated file
   * (based on it's type).
   */
  static formatTemplateData(templateData, fileExtension) {
    const descriptionToUse =
      fileExtension.toLowerCase() === 'json'
        ? FileGenerator.escapeStringForJson(templateData.description)
        : templateData.description;

    return {
      ...templateData,
      description: descriptionToUse,
      vocabPrefix: templateData.nameAndPrefixOverride || templateData.vocabName,
    };
  }

  static createSourceCodeFile(argv, artifactDetails, templateData) {
    const outputDirectoryForSourceCode = argv.outputDirectoryForArtifact;

    // For source files that might be packaged (i.e. Java), convert all '.'
    // (dots) in the package name to directory slashes and add to our
    // directory and source file name.
    // Also for Java files, we follow the Maven convention of putting source
    // code in the directory 'src/main/java' (meaning a simple 'mvn install'
    // will find them automatically).
    const packagingDirectory = templateData.javaPackageName
      ? `/src/main/java/${templateData.javaPackageName.replace(/\./g, '/')}`
      : 'GeneratedVocab';
    FileGenerator.createDirectory(`${outputDirectoryForSourceCode}/${packagingDirectory}`);

    FileGenerator.createFileFromTemplate(
      `../../templates/${artifactDetails.handlebarsTemplate}`,
      FileGenerator.formatTemplateData(templateData, artifactDetails.sourceFileExtension),
      `${outputDirectoryForSourceCode}/${packagingDirectory}/${templateData.nameAndPrefixOverride ||
        templateData.vocabNameUpperCase}.${artifactDetails.sourceFileExtension}`
    );
  }

  static createPackagingFiles(argv, programmingLanguage) {
    FileGenerator.createDirectory(argv.outputDirectory);

    switch (programmingLanguage.toLowerCase()) {
      case 'java':
        FileGenerator.createPackagingFilesJava(argv);
        break;

      case 'javascript':
        FileGenerator.createPackagingFilesJavascript(argv);
        break;
      default:
        throw new Error(
          `Unsupported programming language [${programmingLanguage}], we don't know how to create an packaging artifact for this language.`
        );
    }

    FileGenerator.createFileFromTemplate(
      '../../templates/.gitignore.hbs',
      argv,
      `${argv.outputDirectoryForArtifact}/.gitignore`
    );

    // For our README (which uses Markdown format), if our artifact was made up
    // of multiple vocabs, break up our description into a list representation.
    // TODO: if a vocab description contains a newline, this will split it out
    //  into another list item!
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

  static createPackagingFilesJavascript(argv) {
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
      FileGenerator.formatTemplateData(argv, 'json'),
      `${argv.outputDirectoryForArtifact}/package.json`
    );

    return argv;
  }

  static createPackagingFilesJava(argv) {
    FileGenerator.createFileFromTemplate(
      '../../templates/pom.hbs',
      FileGenerator.formatTemplateData(argv, 'pom.xml'),
      `${argv.outputDirectoryForArtifact}/pom.xml`
    );

    return argv;
  }

  /**
   * Simple utility function that encodes the specified value for use within JSON (e.g. escapes newline characters).
   * NOTE: It simply returns the value ready to be placed into a JSON value string, so it does NOT include delimiting
   * quotes!
   *
   * @param value The value to escape
   * @returns {string} The escaped string
   */
  static escapeStringForJson(value) {
    // Just use JSON.stringify, but make sure we strip off the enclosing quotes!
    const escaped = JSON.stringify(value);
    return escaped.substr(1, escaped.length - 2);
  }

  static escapeStringForJavascript(value) {
    return value.replace(/`/g, '\\`');
  }

  static escapeStringForJava(value) {
    return value.replace(/"/g, '\\"').replace(
      /\n/g,
      `\\n" +
"`
    );
  }
}

module.exports = FileGenerator;
