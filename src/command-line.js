const inquirer = require('inquirer');

const ChildProcess = require('child_process');

module.exports = class CommandLine {
  static async askForArtifactInfo(data) {
    // Craft questions to present to users.
    const questions = [
      {
        type: 'input',
        name: 'artifactName',
        message: 'Artifact name ...',
        default: data.artifactName,
      },
      {
        type: 'input',
        name: 'litVocabTermVersion',
        message: 'Version string for LIT Vocab Term dependency ...',
        default: data.litVocabTermVersion,
      },
      {
        type: 'input',
        name: 'author',
        message: 'Artifact author ...',
        default: data.author,
      },
    ];

    const artifactInfoAnswers = await inquirer.prompt(questions);

    const mergedData = { ...data, ...artifactInfoAnswers }; // Merge the answers in with the data

    return CommandLine.findPublishedVersionOfModule(mergedData);
  }

  static findPublishedVersionOfModule(data) {
    const cloneData = { ...data };
    try {
      const publishedVersion = ChildProcess.execSync(`npm view ${data.artifactName} version`)
        .toString()
        .trim();
      cloneData.publishedVersion = publishedVersion;
      cloneData.version = publishedVersion;
    } catch (error) {
      // Its ok to ignore this. It just means that module has not been published before.
    }
    return cloneData;
  }

  static async askForArtifactVersionBumpType(data) {
    if (data.publishedVersion) {
      const bumpQuestion = [
        {
          type: 'list',
          name: 'bump',
          message: `Current artifact version in registry is [${data.publishedVersion}]. Do you want to bump the version?`,
          choices: ['patch', 'minor', 'major', 'no'],
        },
      ];

      const answer = await inquirer.prompt(bumpQuestion);

      if (answer.bump && answer.bump !== 'no') {
        ChildProcess.execSync(`cd ${data.outputDirectory} && npm version ${answer.bump}`);
        console.log(`Artifact [${data.artifactName}] version has been updated [${answer.bump}].`);
      }

      return { ...data, ...answer }; // Merge the answers in with the data and return
    }

    return data;
  }

  static async askForArtifactToBePublished(data) {
    const publishQuestion = [
      {
        type: 'confirm',
        name: 'publish',
        message: `Do you want to publish [${data.artifactName}] to the registry [${data.npmRegistry}]?`,
        default: false,
      },
    ];

    const answer = await inquirer.prompt(publishQuestion);

    if (answer.publish) {
      ChildProcess.execSync(
        `cd ${data.outputDirectory} && npm publish --registry [${data.npmRegistry}]`
      );
      console.log(`Artifact [${data.artifactName}] has been published to [${data.npmRegistry}].`);
    }

    return { ...data, ...answer }; // Merge the answers in with the data and return
  }

  static runNpmInstall(data) {
    // ChildProcess.execSync(`cd ${data.outputDirectory} && npm install`);
    ChildProcess.execSync(`cd ${data.outputDirectory}`);

    console.log(
      `Ran 'npm install' for artifact [${data.artifactName}] in directory [${data.outputDirectory}].`
    );

    return { ...data, ...{ ranNpmInstall: true } }; // Merge the answers in with the data and return
  }
};
