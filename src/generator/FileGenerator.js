const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const logger = require('debug')('lit-artifact-generator:FileGenerator');

// TODO: Is this redundant with the language-specific ArtifactConfigurator ?
const SUPPORTED_LANGUAGES = ['Java', 'Javascript'];

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
    const outputDirectoryForSourceCode = artifactDetails.outputDirectoryForArtifact;

    // For source files that might be packaged (i.e. Java), convert all '.'
    // (dots) in the package name to directory slashes and add to our
    // directory and source file name.
    // Also for Java files, we follow the Maven convention of putting source
    // code in the directory 'src/main/java' (meaning a simple 'mvn install'
    // will find them automatically).
    const packagingDirectory = artifactDetails.javaPackageName
      ? `/src/main/java/${artifactDetails.javaPackageName.replace(/\./g, '/')}`
      : 'GeneratedVocab';
    FileGenerator.createDirectory(`${outputDirectoryForSourceCode}/${packagingDirectory}`);

    FileGenerator.createFileFromTemplate(
      `../../templates/${artifactDetails.handlebarsTemplate}`,
      FileGenerator.formatTemplateData(templateData, artifactDetails.sourceFileExtension),
      `${outputDirectoryForSourceCode}/${packagingDirectory}/${templateData.nameAndPrefixOverride ||
        templateData.vocabNameUpperCase}.${artifactDetails.sourceFileExtension}`
    );
  }

  static createPackagingFiles(generalInfo, artifactInfo, packagingInfo) {
    let packagingFolder;
    if (!SUPPORTED_LANGUAGES.includes(artifactInfo.programmingLanguage)) {
      throw new Error(`Unsupported programming language: [${artifactInfo.programmingLanguage}]`);
    }
    // If no packaging is explicitely defined, packaging files are generated at the root artifact folder
    if (packagingInfo.packagingFolder) {
      packagingFolder = path.join(
        artifactInfo.outputDirectoryForArtifact,
        packagingInfo.packagingFolder
      );
      FileGenerator.createDirectory(packagingFolder);
    } else {
      packagingFolder = artifactInfo.outputDirectoryForArtifact;
    }
    packagingInfo.packagingTemplates.forEach(packagingFile => {
      FileGenerator.createFileFromTemplate(
        `../../templates/${packagingFile.template}`,
        FileGenerator.formatTemplateData(
          { ...generalInfo, ...artifactInfo, ...packagingInfo },
          // extname returns the extension prefixed with ., that we want to remove
          path.extname(packagingFile.fileName).substr(1)
        ),
        path.join(packagingFolder, packagingFile.fileName)
      );
    });

    FileGenerator.createSharedPackagedFiles(generalInfo, artifactInfo);
    return generalInfo;
  }

  /**
   * This function creates the files that are share in all the packaging (README, .gitignore...)
   * @param {*} argv the generation variables
   */
  static createSharedPackagedFiles(generalInfo, artifactInfo) {
    FileGenerator.createFileFromTemplate(
      '../../templates/.gitignore.hbs',
      generalInfo,
      `${artifactInfo.outputDirectoryForArtifact}/.gitignore`
    );

    // For our README (which uses Markdown format), if our artifact was made up
    // of multiple vocabs, break up our description into a list representation.
    // TODO: if a vocab description contains a newline, this will split it out
    //  into another list item!
    const dataWithMarkdownDescription = generalInfo.vocabListFile
      ? { ...generalInfo, description: generalInfo.description.replace(/\\n/g, '\n\n  *') }
      : generalInfo;

    FileGenerator.createFileFromTemplate(
      '../../templates/README.hbs',
      dataWithMarkdownDescription,
      `${artifactInfo.outputDirectoryForArtifact}/README.MD`
    );
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
