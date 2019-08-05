const path = require('path');
const inquirer = require('inquirer');
const ChildProcess = require('child_process');
const logger = require('debug')('lit-artifact-generator:CommandLine');

const { ARTIFACT_DIRECTORY_ROOT } = require('./generator/ArtifactGenerator');

module.exports = class CommandLine {
  static getParentFolder(directory) {
    return path.dirname(directory);
  }

  static async askForArtifactInfo(data) {
    if (data.noprompt) {
      return CommandLine.findPublishedVersionOfModule(data);
    }

    // Craft questions to present to users.
    const questions = [];

    if (!data.moduleNamePrefix)
      questions.push({
        type: 'input',
        name: 'artifactName',
        message: 'Artifact name ...',
        default: data.artifactName,
      });

    if (!data.litVocabTermVersion) {
      questions.push({
        type: 'input',
        name: 'litVocabTermVersion',
        message: 'Version string for LIT Vocab Term dependency ...',
        default: data.litVocabTermVersion,
      });
    }

    if (!data.authorSet) {
      questions.push({
        type: 'list',
        name: 'authorSet',
        message: 'Artifact authors ...',
        default: data.authorSet,
      });
    }

    const artifactInfoAnswers = await inquirer.prompt(questions);

    const mergedData = { ...data, ...artifactInfoAnswers }; // Merge the answers in with the data

    return CommandLine.findPublishedVersionOfModule(mergedData);
  }

  static findPublishedVersionOfModule(data) {
    const cloneData = { ...data };
    if (data.runNpmPublish) {
      try {
        const publishedVersion = ChildProcess.execSync(`npm view ${data.artifactName} version`)
          .toString()
          .trim();
        cloneData.publishedVersion = publishedVersion;
        cloneData.version = publishedVersion;

        logger(
          `Artifact [${data.artifactName}] in registry [${data.npmRegistry}] currently has version [${publishedVersion}]`
        );
      } catch (error) {
        logger(
          `Error trying to find the published version of artifact [${data.artifactName}] in registry [${data.npmRegistry}]: ${error}`
        );
        // Its ok to ignore this. It just means that the module hasn't been published before.
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
          type: 'list',
          name: 'bumpVersion',
          message: `Current artifact version in registry is [${data.publishedVersion}]. Do you want to bump the version?`,
          choices: ['patch', 'minor', 'major', 'no'],
          default: data.bumpVersion,
        },
      ];

      answer = await inquirer.prompt(bumpQuestion);

      if (answer.bumpVersion && answer.bumpVersion !== 'no') {
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
          type: 'confirm',
          name: 'runNpmInstall',
          message: `Do you want to run NPM install [${data.artifactName}] in the directory [${data.outputDirectory}]?`,
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
          type: 'confirm',
          name: 'runNpmPublish',
          message: `Do you want to run NPM publish [${data.artifactName}] to the registry [${data.npmRegistry}]?`,
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

  // static async askForArtifactToBeYalced(data) {
  //   if (data.runYalcCommand) {
  //     return { ...data, ...CommandLine.runYalcCommand2(data) }; // Merge the answers in with the data and return
  //   }
  //
  //   let answer = {};
  //   if (!data.noprompt) {
  //     const yalcQuestion = [
  //       {
  //         type: 'input',
  //         name: 'runYalcCommand',
  //         message: `Do you want to run yalc for [${data.artifactName}] (e.g. 'yalc publish' or 'yalc link @lit/vocab-term')?`,
  //         default: '',
  //       },
  //     ];
  //
  //     answer = await inquirer.prompt(yalcQuestion);
  //
  //     if (answer.runYalcCommand && answer.runYalcCommand.trim().length > 0) {
  //       answer = { ...answer, ...CommandLine.runYalcCommand({ ...data, ...answer }) };
  //     }
  //   }
  //
  //   return { ...data, ...answer }; // Merge the answers in with the data and return
  // }

  static async askForArtifactToBeDocumented(data) {
    if (data.runWidoco) {
      return { ...data, ...CommandLine.runWidoco(data) }; // Merge the answers in with the data and return
    }

    let answer = {};
    if (!data.noprompt) {
      const runWidocoQuestion = [
        {
          type: 'confirm',
          name: 'runWidoco',
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
    logger(
      `Running 'npm install' ${data.supportBundling ? '(and bundling) ' : ''}for artifact [${
        data.artifactName
      }] in directory [${data.outputDirectoryForArtifact}]...`
    );

    const commandLine = `cd ${data.outputDirectoryForArtifact} && npm install${
      data.supportBundling ? ' && npm run dev' : ''
    }`;
    ChildProcess.execSync(commandLine);

    logger(
      `Ran 'npm install' ${data.supportBundling ? '(and bundling) ' : ''}for artifact [${
        data.artifactName
      }] in directory [${data.outputDirectory}].`
    );

    return { ...data, ranNpmInstall: true }; // Merge the answers in with the data and return
  }

  static runNpmVersion(data) {
    logger(
      `Running 'npm version ${data.bumpVersion}' for artifact [${data.artifactName}] in directory [${data.outputDirectoryForArtifact}]...`
    );

    const newVersion = ChildProcess.execSync(
      `cd ${data.outputDirectoryForArtifact} && npm version ${data.bumpVersion}`
    );

    logger(
      `Ran 'npm version ${data.bumpVersion}' for artifact [${data.artifactName}] in directory [${data.outputDirectory}].`
    );

    return { ...data, ranNpmVersion: true, bumpedVersion: newVersion }; // Merge the answers in with the data and return
  }

  static runNpmPublish(data) {
    logger(
      `Running 'npm publish' for artifact [${data.artifactName}] to registry [${data.npmRegistry}]...`
    );

    ChildProcess.execSync(
      `cd ${data.outputDirectoryForArtifact} && npm publish --registry ${data.npmRegistry}`
    );

    logger(`Artifact [${data.artifactName}] has been published to registry [${data.npmRegistry}].`);

    return { ...data, ...{ ranNpmPublish: true } }; // Merge the answers in with the data and return
  }

  // static runYalcCommand2(data) {
  //   log(
  //     `Running yalc command [${data.runYalcCommand}] for artifact [${data.artifactName}]...`
  //   );
  //
  //   ChildProcess.execSync(`cd ${data.outputDirectoryForArtifact} && ${data.runYalcCommand}`);
  //
  //   log(`Ran yalc command [${data.runYalcCommand}] for artifact [${data.artifactName}]...`);
  //
  //   return { ...data, ...{ ranYalcCommand: true } }; // Merge the answers in with the data and return
  // }

  static runWidoco(data) {
    // Run Widoco using environment variable (since putting the JAR in a local
    // 'lib' directory doesn't work with NPM publish, as it's too big at
    // 46MB!)...
    const widocoJar = '$WIDOCO_HOME/widoco-1.4.11-PATCHED-jar-with-dependencies.jar';

    const inputResource = data.input[0];
    const inputSwitch = inputResource.startsWith('http') ? 'ontURI' : 'ontFile';
    const destDirectory = `${data.outputDirectory}${ARTIFACT_DIRECTORY_ROOT}/Widoco`;
    const log4jPropertyFile = `-Dlog4j.configuration=file:"./widoco.log4j.properties"`;

    logger(
      `Running Widoco for artifact [${data.artifactName}] using input [${inputResource}], writing to [${destDirectory}]...`
    );

    ChildProcess.execSync(
      `java ${log4jPropertyFile} -jar ${widocoJar} -${inputSwitch} ${inputResource} -outFolder ${destDirectory} -rewriteAll -getOntologyMetadata -oops -webVowl -htaccess -licensius -excludeIntroduction`
    );

    logger(
      `Widoco documentation generated for [${
        data.artifactName
      }] in directory [${CommandLine.getParentFolder(data.outputDirectory)}/Widoco].`
    );

    return { ...data, ...{ ranWidoco: true, documentationDirectory: destDirectory } }; // Merge the answers in with the data and return
  }
};
