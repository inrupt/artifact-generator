const path = require("path");
const inquirer = require("inquirer");
const ChildProcess = require("child_process");
const debug = require("debug")("artifact-generator:CommandLine");

const {
  getArtifactDirectoryRoot,
  getArtifactDirectorySourceCode,
} = require("./Util");

module.exports = class CommandLine {
  static COMMAND_GENERATE() {
    return "generate";
  }
  static COMMAND_INITIALIZE() {
    return "init";
  }
  static COMMAND_WATCH() {
    return "watch";
  }
  static COMMAND_VALIDATE() {
    return "validate";
  }

  static getParentFolder(directory) {
    return path.dirname(directory);
  }

  static findPublishedVersionOfModule(data) {
    const cloneData = { ...data };
    if (data.runNpmPublish) {
      try {
        const publishedVersion = ChildProcess.execSync(
          `npm view ${data.artifactName} version`,
        )
          .toString()
          .trim();
        cloneData.publishedVersion = publishedVersion;
        cloneData.version = publishedVersion;

        debug(
          `Artifact [${data.artifactName}] in registry [${data.npmRegistry}] currently has version [${publishedVersion}]`,
        );
      } catch (error) {
        debug(
          `Error trying to find the published version of artifact [${data.artifactName}] in registry [${data.npmRegistry}] (this probably just means the module has never been published). Error: ${error}`,
        );
        // Its OK to ignore this. It just means that the module hasn't been
        // published before.
      }
    }

    return cloneData;
  }

  static async askForArtifactToBeNpmInstalled(data) {
    if (data.runNpmInstall) {
      return { ...data, ...CommandLine.runNpmInstall(data) }; // Merge the answers in with the data and return
    }

    let answer = {};
    if (!data.noPrompt) {
      const npmInstallQuestion = [
        {
          type: "confirm",
          name: "runNpmInstall",
          message: `Do you want to run NPM install for artifact [${data.artifactName}] in the directory [${data.outputDirectory}]?`,
          default: false,
        },
      ];

      answer = await inquirer.prompt(npmInstallQuestion);

      if (answer.runNpmInstall) {
        answer = { ...answer, ...CommandLine.runNpmInstall(data) };
      }
    }

    return { ...data, ...answer }; // Merge the answers in with the data and return
  }

  static async askForArtifactToBeNpmPublished(data) {
    if (data.runNpmPublish && data.npmRegistry) {
      return { ...data, ...CommandLine.runNpmPublish(data) }; // Merge the answers in with the data and return
    }

    let answer = {};
    if (!data.noPrompt && data.npmRegistry) {
      const npmPublishQuestion = [
        {
          type: "confirm",
          name: "runNpmPublish",
          message: `Do you want to run NPM publish for artifact [${data.artifactName}] to the registry [${data.npmRegistry}]?`,
          default: false,
        },
      ];

      answer = await inquirer.prompt(npmPublishQuestion);

      if (answer.runNpmPublish) {
        answer = { ...answer, ...CommandLine.runNpmPublish(data) };
      }
    }

    return { ...data, ...answer }; // Merge the answers in with the data and return
  }

  static async askForArtifactToBeDocumented(data) {
    if (data.runWidoco) {
      // Merge the answers in with the data and return.
      return { ...data, ...CommandLine.runWidocoForAllVocabs(data) };
    }

    let answer = {};
    if (!data.noPrompt) {
      const runWidocoQuestion = [
        {
          type: "confirm",
          name: "runWidoco",
          message: `Do you want to run Widoco documentation generation on [${data.artifactName}]?`,
          default: false,
        },
      ];

      answer = await inquirer.prompt(runWidocoQuestion);

      if (answer.runWidoco) {
        // Merge into our answer the result of attempting to generate documentation.
        answer = CommandLine.runWidocoForAllVocabs({
          ...data,
          runWidoco: true,
        });
      }
    }

    // Assume we did NOT run the documentation, but overwrite that assumption if we did!
    return { ranWidoco: false, ...data, ...answer }; // Merge the answers in with the data and return
  }

  static runNpmInstall(data) {
    debug(
      `Running 'npm install' ${
        data.supportBundling ? "(and bundling) " : ""
      }for artifact [${data.artifactName}] in directory [${
        data.outputDirectoryForArtifact
      }]...`,
    );

    const commandLine = `cd ${data.outputDirectoryForArtifact} && npm install${
      data.supportBundling ? " && npm run dev" : ""
    }`;
    ChildProcess.execSync(commandLine);

    debug(
      `Ran 'npm install' ${
        data.supportBundling ? "(and bundling) " : ""
      }for artifact [${data.artifactName}] in directory [${
        data.outputDirectoryForArtifact
      }].`,
    );

    return { ...data, ranNpmInstall: true }; // Merge the answers in with the data and return
  }

  static runMavenInstall(data) {
    if (data.runMavenInstall) {
      debug(
        `Running 'mvn install' for artifact [${
          data.artifactName
        }] in directory [${
          data.outputDirectory
        }${getArtifactDirectorySourceCode(data)}/Java]...`,
      );
      // Quick addition to also support Maven install for Java artifacts.
      const javaDirectory = `${
        data.outputDirectory
      }${getArtifactDirectorySourceCode(data)}/Java`;
      if (data.artifactToGenerate) {
        data.artifactToGenerate.forEach((artifact) => {
          if (artifact.programmingLanguage.toLowerCase() === "java") {
            const commandLineMaven = `cd ${javaDirectory} && mvn install`;
            ChildProcess.execSync(commandLineMaven);
          }
        });
      }
      return { ...data, ranMavenInstall: true }; // Merge the answers in with the data and return
    }

    return data;
  }

  static runNpmPublish(data) {
    debug(
      `Running 'npm publish' for artifact [${data.artifactName}] to registry [${data.npmRegistry}]...`,
    );

    ChildProcess.execSync(
      `cd ${data.outputDirectoryForArtifact} && npm publish --registry ${data.npmRegistry}`,
    );

    debug(
      `Artifact [${data.artifactName}] has been published to registry [${data.npmRegistry}].`,
    );

    return { ...data, ...{ ranNpmPublish: true } }; // Merge the answers in with the data and return
  }

  static runWidocoForAllVocabs(data) {
    const documentationDirectories = [];

    if (data.runWidoco) {
      const widocoJar = "$WIDOCO_JAR";
      const artifactDirectoryRoot = getArtifactDirectoryRoot(data);

      data.vocabList.forEach((vocab) => {
        // In both these cases (i.e., multiple input resources, or using a
        // term selection resource), we first need to write the 'augmented'
        // vocabulary to a local Linked Data resource (such as a local Turtle
        // file), so that Widoco would be able to pick that up and process it
        // accordingly. So until we have that capability, just ignore these
        // use-cases, and output an explanation for why.
        if (vocab.inputResources.length !== 1) {
          debug(
            `We don't yet support generating Widoco output for vocabularies constructed from multiple input resources [${vocab.inputResources.join(
              ", ",
            )}].`,
          );
          return;
        }

        if (vocab.termSelectionResource) {
          debug(
            `Cannot generate Widoco output for vocabulary [${vocab.inputResources[0]}], as we don't yet support term selection (we're configured to select terms from [${vocab.termSelectionResource}]).`,
          );
          return;
        }

        const inputResource = vocab.inputResources[0];

        // Use our input resource's final local name as the output directory,
        // so first strip off any trialing '/' or '#' (i.e., if input was a
        // namespace IRI, which typically end in either of those).
        let vocabDirectory = inputResource.replace(/[/#]+$/, "");

        // Now ignore everything up to the last remaining '/' or '#' (for
        // local file resources).
        vocabDirectory = vocabDirectory.substring(
          Math.max(
            vocabDirectory.lastIndexOf("/"),
            vocabDirectory.lastIndexOf("#"),
          ) + 1,
        );

        // Now strip off any file extensions (if input was a local file
        // resource).
        const extensionPos = vocabDirectory.lastIndexOf(".");
        if (extensionPos > 0) {
          vocabDirectory = vocabDirectory.substring(0, extensionPos);
        }

        const widocoInputSwitch = inputResource.startsWith("http")
          ? "ontURI"
          : "ontFile";
        const destDirectory = `${data.outputDirectory}${artifactDirectoryRoot}/Widoco/${vocabDirectory}`;
        documentationDirectories.push(destDirectory);

        const log4jPropertyFile = `-Dlog4j.configuration=file:"./widoco.log4j.properties"`;

        debug(
          `Running Widoco for artifact [${data.artifactName}] using input [${inputResource}], writing to [${destDirectory}], and using Log4J configuration [${log4jPropertyFile}]...`,
        );

        const languageSwitch = vocab.widocoLanguages
          ? ` -lang ${vocab.widocoLanguages}`
          : ``;

        const command = `java ${log4jPropertyFile} -jar ${widocoJar} -${widocoInputSwitch} ${inputResource} -outFolder ${destDirectory} -rewriteAll -getOntologyMetadata -oops -webVowl -htaccess -licensius${languageSwitch}`;
        debug(`Executing comand: [${command}]`);
        ChildProcess.execSync(command);

        debug(
          `Widoco documentation generated for [${inputResource}] in directory [${CommandLine.getParentFolder(
            data.outputDirectory,
          )}/Widoco]${
            vocab.widocoLanguages
              ? " in languages [" + vocab.widocoLanguages + "]"
              : ""
          }.`,
        );
      });
    }

    return {
      ...data,
      ...{ ranWidoco: data.runWidoco, documentationDirectories },
    }; // Merge the answers in with the data and return
  }
};
