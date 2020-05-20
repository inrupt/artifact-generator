const inquirer = require("inquirer");

const RESOURCES_SEPARATOR = ",";

function splitInputResources(inputResources) {
  return inputResources.split(RESOURCES_SEPARATOR);
}

const VOCAB_QUESTIONS = [
  {
    type: "input",
    name: "inputResources",
    message: "Resources used for the artifact (path or IRI, comma-separated):",
    filter: splitInputResources,
  },
  {
    type: "input",
    name: "nameAndPrefixOverride",
    message: "Vocabulary prefix:",
  },
  {
    type: "input",
    name: "description",
    message: "Short description of the vocabulary:",
  },
  {
    type: "input",
    name: "termSelectionFile",
    message: "File defining scope and extensions of the terms from the source:",
  },
];

class VocabularyConfigurator {
  static async prompt() {
    return inquirer.prompt(VOCAB_QUESTIONS);
  }
}

module.exports.VocabularyConfigurator = VocabularyConfigurator;
module.exports.splitInputResources = splitInputResources;
