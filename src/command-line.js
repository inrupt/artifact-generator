const path = require('path');
const inquirer = require('inquirer');

const ChildProcess = require('child_process');

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

    if (!data.author) {
      questions.push({
        type: 'input',
        name: 'author',
        message: 'Artifact author ...',
        default: data.author,
      });
    }

    const artifactInfoAnswers = await inquirer.prompt(questions);

    const mergedData = { ...data, ...artifactInfoAnswers }; // Merge the answers in with the data

    return CommandLine.findPublishedVersionOfModule(mergedData);
  }

  static findPublishedVersionOfModule(data) {
    const cloneData = { ...data };
    if (data.publish) {
      try {
        const publishedVersion = ChildProcess.execSync(`npm view ${data.artifactName} version`)
          .toString()
          .trim();
        cloneData.publishedVersion = publishedVersion;
        cloneData.version = publishedVersion;

        console.log(
          `Artifact [${data.artifactName}] in registry [${data.npmRegistry}] currently has version [${publishedVersion}]`
        );
      } catch (error) {
        console.log(
          `Error trying to find the published version of artifact [${data.artifactName}] in registry [${data.npmRegistry}]: ${error}`
        );
        // Its ok to ignore this. It just means that the module hasn't been published before.
      }
    }

    return cloneData;
  }

  static async askForArtifactVersionBumpType(data) {
    if (data.bumpVersion && data.publishedVersion) {
      return { ...data, ...CommandLine.runNpmVersion(data) }; // Merge the answers in with the data and return
    }

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

      let answer = await inquirer.prompt(bumpQuestion);

      if (answer.bumpVersion && answer.bumpVersion !== 'no') {
        answer = { ...answer, ...CommandLine.runNpmVersion(data) };
      }

      return { ...data, ...answer }; // Merge the answers in with the data and return
    }

    return data;
  }

  static async askForArtifactToBeInstalled(data) {
    if (data.install) {
      return { ...data, ...CommandLine.runNpmInstall(data) }; // Merge the answers in with the data and return
    }

    let answer;
    if (!data.noprompt) {
      const publishQuestion = [
        {
          type: 'confirm',
          name: 'install',
          message: `Do you want to NPM install [${data.artifactName}] in the directory [${data.outputDirectory}]?`,
          default: true,
        },
      ];

      answer = await inquirer.prompt(publishQuestion);

      if (answer.install) {
        answer = { ...answer, ...CommandLine.runNpmInstall(data) };
      }
    }

    return { ...data, ...answer }; // Merge the answers in with the data and return
  }

  static async askForArtifactToBePublished(data) {
    if (data.publish && data.npmRegistry) {
      return { ...data, ...CommandLine.runNpmPublish(data) }; // Merge the answers in with the data and return
    }

    let answer = {};
    if (!data.noprompt && data.npmRegistry) {
      const publishQuestion = [
        {
          type: 'confirm',
          name: 'publish',
          message: `Do you want to publish [${data.artifactName}] to the registry [${data.npmRegistry}]?`,
          default: false,
        },
      ];

      answer = await inquirer.prompt(publishQuestion);

      if (answer.publish) {
        answer = { ...answer, ...CommandLine.runNpmPublish(data) };
      }
    }

    return { ...data, ...answer }; // Merge the answers in with the data and return
  }

  static async askForArtifactToBeDocumented(data) {
    if (data.widoco) {
      return { ...data, ...CommandLine.runWidoco(data) }; // Merge the answers in with the data and return
    }

    let answer = {};
    if (!data.noprompt) {
      const publishQuestion = [
        {
          type: 'confirm',
          name: 'widoco',
          message: `Do you want to run Widoco documentation generation on [${data.artifactName}]?`,
          default: false,
        },
      ];

      answer = await inquirer.prompt(publishQuestion);

      if (answer.widoco) {
        answer = { ...answer, ...CommandLine.runWidoco(data) };
      }
    }

    return { ...data, ...answer }; // Merge the answers in with the data and return
  }

  static runNpmInstall(data) {
    console.log(
      `Running 'npm install' for artifact [${data.artifactName}] in directory [${data.outputDirectory}]...`
    );
    ChildProcess.execSync(`cd ${data.outputDirectory} && npm install`);

    console.log(
      `Ran 'npm install' for artifact [${data.artifactName}] in directory [${data.outputDirectory}].`
    );

    return { ...data, ranNpmInstall: true }; // Merge the answers in with the data and return
  }

  static runNpmVersion(data) {
    console.log(
      `Running 'npm version ${data.bumpVersion}' for artifact [${data.artifactName}] in directory [${data.outputDirectory}]...`
    );

    const newVersion = ChildProcess.execSync(
      `cd ${data.outputDirectory} && npm version ${data.bumpVersion}`
    );

    console.log(
      `Ran 'npm version ${data.bumpVersion}' for artifact [${data.artifactName}] in directory [${data.outputDirectory}].`
    );

    return { ...data, ranNpmVersion: true, bumpedVersion: newVersion }; // Merge the answers in with the data and return
  }

  static runNpmPublish(data) {
    console.log(
      `Running 'npm publish' for artifact [${data.artifactName}] to registry [${data.npmRegistry}]...`
    );

    ChildProcess.execSync(
      `cd ${data.outputDirectory} && npm publish --registry ${data.npmRegistry}`
    );

    console.log(
      `Artifact [${data.artifactName}] has been published to registry [${data.npmRegistry}].`
    );

    return { ...data, ...{ ranNpmPublish: true } }; // Merge the answers in with the data and return
  }

  static runWidoco(data) {
    console.log(`Running Widoco for artifact [${data.artifactName}]...`);

    // Run Widoco using environment variable (putting the JAR in a local 'lib'
    // directory doesn't work with NPM publish, as it's too big at 46MB!)...
    const widocoJar = '$WIDOCO_HOME/widoco-1.4.11-PATCHED-jar-with-dependencies.jar';

    ChildProcess.execSync(
      `cd ${data.outputDirectory} && java -jar ${widocoJar} -ontFile ${
        data.inputVocabList[0]
      } -outFolder ${CommandLine.getParentFolder(
        data.outputDirectory
      )}/Widoco -rewriteAll -getOntologyMetadata -oops -webVowl -htaccess -licensius -excludeIntroduction`
    );

    console.log(`Widoco documentation generated for [${data.artifactName}].`);

    return { ...data, ...{ ranWidoco: true } }; // Merge the answers in with the data and return
  }
};
