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

  static async askForSolidCommonVocabVersion() {
    return inquirer.prompt({
      type: "input",
      name: "solidCommonVocabVersion",
      message: "Version string for Vocab Term dependency ...",
    });
  }

  static findPublishedVersionOfModule(data) {
    const cloneData = { ...data };
    if (data.runNpmPublish) {
      try {
        const publishedVersion = ChildProcess.execSync(
          `npm view ${data.artifactName} version`
        )
          .toString()
          .trim();
        cloneData.publishedVersion = publishedVersion;
        cloneData.version = publishedVersion;

        debug(
          `Artifact [${data.artifactName}] in registry [${data.npmRegistry}] currently has version [${publishedVersion}]`
        );
      } catch (error) {
        debug(
          `Error trying to find the published version of artifact [${data.artifactName}] in registry [${data.npmRegistry}] (this probably just means the module has never been published). Error: ${error}`
        );
        // Its OK to ignore this. It just means that the module hasn't been
        // published before.
      }
    }

    return cloneData;
  }

  static async askForArtifactToBeNpmVersionBumped(data) {
    if (data.bumpVersion && data.publishedVersion) {
      return { ...data, ...CommandLine.runNpmVersion(data) }; // Merge the answers in with the data and return
    }

    let answer = {};
    if (!data.noprompt && data.publishedVersion) {
      const bumpQuestion = [
        {
          type: "list",
          name: "bumpVersion",
          message: `Current artifact version in registry is [${data.publishedVersion}]. Do you want to bump the version?`,
          choices: ["patch", "minor", "major", "no"],
          default: data.bumpVersion,
        },
      ];

      answer = await inquirer.prompt(bumpQuestion);

      if (answer.bumpVersion && answer.bumpVersion !== "no") {
        answer = { ...answer, ...CommandLine.runNpmVersion(data) };
      }

      return { ...data, ...answer }; // Merge the answers in with the data and return
    }

    return data;
  }

  static async askForArtifactToBeNpmInstalled(data) {
    if (data.runNpmInstall) {
      return { ...data, ...CommandLine.runNpmInstall(data) }; // Merge the answers in with the data and return
    }

    let answer = {};
    if (!data.noprompt) {
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
    if (!data.noprompt && data.npmRegistry) {
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
      return { ...data, ...CommandLine.runWidoco(data) }; // Merge the answers in with the data and return
    }

    let answer = {};
    if (!data.noprompt) {
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
        answer = { ...answer, ...CommandLine.runWidoco(data) };
      }
    }

    return { ...data, ...answer }; // Merge the answers in with the data and return
  }

  static runNpmInstall(data) {
    debug(
      `Running 'npm install' ${
        data.supportBundling ? "(and bundling) " : ""
      }for artifact [${data.artifactName}] in directory [${
        data.outputDirectoryForArtifact
      }]...`
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
      }].`
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
        }${getArtifactDirectorySourceCode(data)}/Java]...`
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

  static runNpmVersion(data) {
    debug(
      `Running 'npm version ${data.bumpVersion}' for artifact [${data.artifactName}] in directory [${data.outputDirectoryForArtifact}]...`
    );

    const newVersion = ChildProcess.execSync(
      `cd ${data.outputDirectoryForArtifact} && npm version ${data.bumpVersion}`
    );

    debug(
      `Ran 'npm version ${data.bumpVersion}' for artifact [${data.artifactName}] in directory [${data.outputDirectory}].`
    );

    return { ...data, ranNpmVersion: true, bumpedVersion: newVersion }; // Merge the answers in with the data and return
  }

  static runNpmPublish(data) {
    debug(
      `Running 'npm publish' for artifact [${data.artifactName}] to registry [${data.npmRegistry}]...`
    );

    ChildProcess.execSync(
      `cd ${data.outputDirectoryForArtifact} && npm publish --registry ${data.npmRegistry}`
    );

    debug(
      `Artifact [${data.artifactName}] has been published to registry [${data.npmRegistry}].`
    );

    return { ...data, ...{ ranNpmPublish: true } }; // Merge the answers in with the data and return
  }

  static runWidoco(data) {
    // Run Widoco using environment variable (since putting the JAR in a local
    // 'lib' directory doesn't work with NPM publish, as it's too big at
    // 46MB!).
    // If running on the command line, and Node is not picking up a
    // system-defined env var, then you can set this manually before running
    // node itself, e.g.:
    //   WIDOCO_JAR=$WIDOCO_JAR node index.js ...
    // ...or if no system-wide env var, just:
    //   WIDOCO_JAR=/path/to/jar/widoco-1.4.15-jar-with-dependencies.jar node index.js ...
    const widocoJar = "$WIDOCO_JAR";

    const inputResource = data.inputResources[0];
    const inputSwitch = inputResource.startsWith("http") ? "ontURI" : "ontFile";
    const destDirectory = `${data.outputDirectory}${getArtifactDirectoryRoot(
      data
    )}/Widoco`;
    const log4jPropertyFile = `-Dlog4j.configuration=file:"./widoco.log4j.properties"`;

    debug(
      `Running Widoco for artifact [${data.artifactName}] using input [${inputResource}], writing to [${destDirectory}]...`
    );

    ChildProcess.execSync(
      `java ${log4jPropertyFile} -jar ${widocoJar} -${inputSwitch} ${inputResource} -outFolder ${destDirectory} -rewriteAll -getOntologyMetadata -oops -webVowl -htaccess -licensius`
    );

    debug(
      `Widoco documentation generated for [${
        data.artifactName
      }] in directory [${CommandLine.getParentFolder(
        data.outputDirectory
      )}/Widoco].`
    );

    return {
      ...data,
      ...{ ranWidoco: true, documentationDirectory: destDirectory },
    }; // Merge the answers in with the data and return
  }
};
