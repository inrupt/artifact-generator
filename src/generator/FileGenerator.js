const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const debug = require("debug")("lit-artifact-generator:FileGenerator");

const ARTIFACT_DIRECTORY_ROOT = "./Generated";

class FileGenerator {
  /**
   *
   * @param {string} templateFile path to the template file
   * @param {*} templateData
   * @param {*} outputFile
   */
  static createFileFromTemplate(templateFile, templateData, outputFile) {
    const data = fs.readFileSync(templateFile);

    const template = Handlebars.compile(data.toString());

    const contents = template(templateData);

    fs.writeFileSync(outputFile, contents);
    debug(`Created file: [${outputFile}]`);
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
      fileExtension.toLowerCase() === "json"
        ? FileGenerator.escapeStringForJson(templateData.description)
        : templateData.description;

    return {
      ...templateData,
      description: descriptionToUse,
      vocabPrefix: templateData.nameAndPrefixOverride || templateData.vocabName
    };
  }

  static buildTargetSourceCodeFolder(artifactDetails) {
    const outputDirectoryForSourceCode =
      artifactDetails.outputDirectoryForArtifact;
    // For source files that might be packaged (i.e. Java), convert all '.'
    // (dots) in the package name to directory slashes and add to our
    // directory and source file name.
    // Also for Java files, we follow the Maven convention of putting source
    // code in the directory 'src/main/java' (meaning a simple 'mvn install'
    // will find them automatically).
    const packagingDirectory = artifactDetails.javaPackageName
      ? `/src/main/java/${artifactDetails.javaPackageName.replace(/\./g, "/")}`
      : "GeneratedVocab";
    return `${outputDirectoryForSourceCode}/${packagingDirectory}`;
  }

  static buildTargetSourceCodeFilePath(
    targetFolder,
    artifactDetails,
    templateData
  ) {
    return path.join(
      targetFolder,
      `${templateData.nameAndPrefixOverride ||
        templateData.vocabNameUpperCase}.${artifactDetails.sourceFileExtension}`
    );
  }

  static previouslyGeneratedFileExists(artifactDetails, templateData) {
    return fs.existsSync(
      FileGenerator.buildTargetSourceCodeFilePath(
        FileGenerator.buildTargetSourceCodeFolder(artifactDetails),
        artifactDetails,
        templateData
      )
    );
  }

  static createSourceCodeFile(argv, artifactDetails, templateData) {
    const outputDirectoryForSourceCode = FileGenerator.buildTargetSourceCodeFolder(
      artifactDetails
    );
    FileGenerator.createDirectory(outputDirectoryForSourceCode);
    FileGenerator.createFileFromTemplate(
      `${artifactDetails.sourceCodeTemplate}`,
      // Some artifact-specific info may be required in the template (e.g. the java package name)
      FileGenerator.formatTemplateData(
        { ...argv, ...templateData, ...artifactDetails },
        artifactDetails.sourceFileExtension
      ),
      FileGenerator.buildTargetSourceCodeFilePath(
        outputDirectoryForSourceCode,
        artifactDetails,
        templateData
      )
    );
  }

  static createPackagingFiles(generalInfo, artifactInfo, packagingInfo) {
    let packagingDirectory;

    // If no packaging is explicitly defined, packaging files are generated at
    // the root artifact directory.
    if (packagingInfo.packagingDirectory) {
      packagingDirectory = path.join(
        artifactInfo.outputDirectoryForArtifact,
        packagingInfo.packagingDirectory
      );

      FileGenerator.createDirectory(packagingDirectory);
    } else {
      packagingDirectory = artifactInfo.outputDirectoryForArtifact;
    }

    packagingInfo.packagingTemplates.forEach(packagingFile => {
      FileGenerator.createFileFromTemplate(
        `${packagingFile.template}`,
        FileGenerator.formatTemplateData(
          { ...generalInfo, ...artifactInfo, ...packagingInfo },
          // extname returns the extension prefixed with ., that we want to remove
          path.extname(packagingFile.fileName).substr(1)
        ),
        path.join(packagingDirectory, packagingFile.fileName)
      );
    });

    FileGenerator.createSharedPackagedFiles(generalInfo);
    return generalInfo;
  }

  static createVersioningFiles(generalInfo) {
    if (generalInfo.versioning && generalInfo.versioning.versioningTemplates) {
      generalInfo.versioning.versioningTemplates.forEach(associatedFile => {
        FileGenerator.createFileFromTemplate(
          path.join(associatedFile.template),
          generalInfo,
          path.join(
            generalInfo.outputDirectory,
            ARTIFACT_DIRECTORY_ROOT,
            associatedFile.fileName
          )
        );
      });
    }
  }

  /**
   * This function creates the files that are share in all the packaging (README, .gitignore...)
   * @param {*} argv the generation variables
   */
  static createSharedPackagedFiles(generalInfo) {
    // For our README (which uses Markdown format), if our artifact was made up
    // of multiple vocabs, break up our description into a list representation.
    // TODO: if a vocab description contains a newline, this will split it out
    //  into another list item!
    const dataWithMarkdownDescription = generalInfo.vocabListFile
      ? {
          ...generalInfo,
          description: generalInfo.description.replace(/\\n/g, "\n\n  *")
        }
      : generalInfo;

    FileGenerator.createFileFromTemplate(
      `${__dirname}/../../templates/README.hbs`,
      dataWithMarkdownDescription,
      path.join(
        generalInfo.outputDirectory,
        ARTIFACT_DIRECTORY_ROOT,
        "README.md"
      )
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

  static escapeStringForJavaScript(value) {
    return value.replace(/`/g, "\\`");
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
