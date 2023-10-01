const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const debug = require("debug")("artifact-generator:FileGenerator");

const {
  getArtifactDirectoryRoot,
  getArtifactDirectorySourceCode,
} = require("../Util");

Handlebars.registerHelper("helperMissing", function (/* dynamic arguments */) {
  const options = arguments[arguments.length - 1];
  const configuration =
    options.data.root.vocabListFile || options.data.root.inputResources;

  const message = `Undefined template variable: [${options.name}] was used in template [${options.data.root.templateFile}], but was not defined. Configuration from: [${configuration}].`;
  debug(message);
  throw new Error(message);
});

class FileGenerator {
  /**
   *
   * @param {string} templateFile path to the template file
   * @param {*} templateData
   * @param {*} outputFile
   */
  static createFileFromTemplate(templateFile, templateData, outputFile) {
    let data;
    try {
      data = fs.readFileSync(templateFile);
    } catch (error) {
      throw new Error(
        `Failed to read template file [${templateFile}] trying to generate output file [${outputFile}]. Error: ${error}`,
      );
    }

    const template = Handlebars.compile(data.toString());

    // Overwrite any previous template file with our current one (useful for debugging if
    // there's a problem with a template, such as a variable needed that isn't provided).
    templateData.templateFile = templateFile;

    const contents = template(templateData);

    fs.writeFileSync(outputFile, contents);
    debug(`Generated: [${outputFile}]`);
  }

  static createDirectoryIfNotExist(directory) {
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
      vocabPrefix: templateData.nameAndPrefixOverride || templateData.vocabName,
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
    templateData,
  ) {
    return path.join(
      targetFolder,
      `${
        templateData.nameAndPrefixOverride || templateData.vocabNameUpperCase
      }.${artifactDetails.sourceFileExtension}`,
    );
  }

  static previouslyGeneratedFileExists(artifactDetails, templateData) {
    return fs.existsSync(
      FileGenerator.buildTargetSourceCodeFilePath(
        FileGenerator.buildTargetSourceCodeFolder(artifactDetails),
        artifactDetails,
        templateData,
      ),
    );
  }

  static createSourceCodeFile(argv, artifactDetails, templateData) {
    const outputDirectoryForSourceCode =
      FileGenerator.buildTargetSourceCodeFolder(artifactDetails);
    FileGenerator.createDirectoryIfNotExist(outputDirectoryForSourceCode);

    try {
      FileGenerator.createFileFromTemplate(
        `${artifactDetails.sourceCodeTemplate}`,
        // Some artifact-specific info may be required in the template (e.g., the Java package
        // name).
        FileGenerator.formatTemplateData(
          { ...argv, ...templateData, ...artifactDetails },
          artifactDetails.sourceFileExtension,
        ),
        FileGenerator.buildTargetSourceCodeFilePath(
          outputDirectoryForSourceCode,
          artifactDetails,
          templateData,
        ),
      );
    } catch (error) {
      throw new Error(
        `Failed to generate [${artifactDetails.programmingLanguage}] source-code file in artifact directory [${artifactDetails.outputDirectoryForArtifact}]. Error: ${error}`,
      );
    }
  }

  static createPackagingFiles(generalInfo, artifactInfo, packagingInfo) {
    let packagingDirectory;

    // If no packaging is explicitly defined, packaging files are generated at
    // the root artifact directory.
    if (packagingInfo.packagingDirectory) {
      packagingDirectory = path.join(
        artifactInfo.outputDirectoryForArtifact,
        packagingInfo.packagingDirectory,
      );

      FileGenerator.createDirectoryIfNotExist(packagingDirectory);
    } else {
      packagingDirectory = artifactInfo.outputDirectoryForArtifact;
    }

    packagingInfo.packagingTemplates.forEach((packagingFile) => {
      FileGenerator.createFileFromTemplate(
        `${packagingFile.template}`,
        FileGenerator.formatTemplateData(
          { ...generalInfo, ...artifactInfo, ...packagingInfo },
          // extname returns the extension prefixed with ., that we want to remove
          path.extname(packagingFile.fileName).substr(1),
        ),
        path.join(packagingDirectory, packagingFile.fileName),
      );
    });

    FileGenerator.createSharedPackagedFiles(generalInfo, artifactInfo);
    return generalInfo;
  }

  static createVersioningFiles(generalInfo) {
    if (
      generalInfo.generated &&
      generalInfo.versioning &&
      generalInfo.versioning.versioningTemplates
    ) {
      generalInfo.versioning.versioningTemplates.forEach((associatedFile) => {
        FileGenerator.createFileFromTemplate(
          path.join(associatedFile.template),
          generalInfo,
          path.join(
            generalInfo.outputDirectory,
            getArtifactDirectoryRoot(generalInfo),
            associatedFile.fileName,
          ),
        );
      });
    }
  }

  /**
   * Converts the description property of the passed object to a
   * Markdown-suitable format by converting newlines into multiple lines and
   * adding a bullet-point, if and only if that object has a vocabulary list
   * file (i.e., if it has multiple vocabularies).
   *
   * @param data the configuration object
   * @returns {*}
   */
  static convertDescriptionToMarkdown(data) {
    return data.vocabListFile
      ? {
          ...data,
          description: data.description.replace(/\\n/g, "\n\n  *"),
        }
      : data;
  }

  /**
   * This function creates the files that are shared across all packaging
   * (i.e., README, .gitignore, etc.).
   * @param generalInfo
   * @param artifactInfo
   */
  static createSharedPackagedFiles(generalInfo, artifactInfo) {
    const generalAndArtifactInfo = {
      // For our README (which uses Markdown format), if our artifact was made up
      // of multiple vocabs, break up our description into a list representation.
      // TODO: if a vocab description contains a newline, this will split it out
      //  into another list item!
      ...FileGenerator.convertDescriptionToMarkdown(generalInfo),
      ...artifactInfo,
    };

    // Generate README in source code root directory.
    FileGenerator.createFileFromTemplate(
      `${__dirname}/../../template/README-package.hbs`,
      generalAndArtifactInfo,
      path.join(
        generalInfo.outputDirectory,
        getArtifactDirectorySourceCode(generalInfo),
        artifactInfo.artifactDirectoryName,
        "README.md",
      ),
    );
  }

  /**
   * Simple utility function that encodes the specified value for use within JSON (e.g. escapes newline characters).
   * Note: It simply returns the value ready to be placed into a JSON value string, so it does NOT include delimiting
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
    return value
      .replace(/\\/g, "\\\\\\\\")
      .replace(/"/g, '\\"')
      .replace(
        /\n/g,
        `\\n" +
"`,
      );
  }
}

module.exports = FileGenerator;
