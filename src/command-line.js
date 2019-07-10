var inquirer = require('inquirer');

module.exports = class CommandLine {
  constructor(argv) {
    this.argv = argv;
  }

  async askForArtifactInfo(data) {
    // Craft questions to present to users
    const questions = [
      {
        type: 'input',
        name: 'artifactName',
        message: 'Artifact name ...',
        default: data.artifactName,
      },
      {
        type: 'input',
        name: 'author',
        message: 'Artifact author ...',
        default: data.author,
      },
    ];

    const artifactInfoAnswers = await inquirer.prompt(questions);

    data = { ...data, ...artifactInfoAnswers }; //Merge the answers in with the data

    findPublishedVersionOfModule(data);

    return data;
  }

  findPublishedVersionOfModule(data) {
    try {
      let publishedVersion = execSync(`npm view ${data.artifactName} version`)
        .toString()
        .trim();

      data.publishedVersion = publishedVersion;
      data.version = publishedVersion;
      return publishedVersion;
    } catch (error) {
      // Its ok to ignore this. It just means that module has not been published before.
    }
  }

  async askForArtifactVersionBumpType(data) {
    const bumpQuestion = [
      {
        type: 'list',
        name: 'bump',
        message: `Current artifact version in registry is ${data.publishedVersion}. Do you want to bump the version?`,
        choices: ['patch', 'minor', 'major', 'no'],
      },
    ];

    const answer = await inquirer.prompt(bumpQuestion);

    if (answer.bump && answer.bump !== 'no') {
      execSync(`cd generated && npm version ${answer.bump}`);
      console.log(`Artifact (${data.artifactName}) version has been updated (${answer.bump}).`);
    }

    return { ...data, ...answer }; //Merge the answers in with the data and return
  }

  async askForArtifactToBePublished(data) {
    const publishQuestion = [
      {
        type: 'confirm',
        name: 'publish',
        message: `Do you want to publish ${data.artifactName} to the registry ${this.argv.npmRegistry}?`,
        default: false,
      },
    ];

    const answer = await inquirer.prompt(publishQuestion);

    if (answer.publish) {
      execSync(`cd generated && npm publish --registry ${this.argv.npmRegistry}`);
      console.log(
        `Artifact (${data.artifactName}) has been published to ${this.argv.npmRegistry}.`
      );
    }

    return { ...data, ...answer }; //Merge the answers in with the data and return
  }
};
