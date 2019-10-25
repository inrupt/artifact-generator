const yaml = require('js-yaml');
const path = require('path');
const moment = require('moment');
const logger = require('debug')('lit-artifact-generator:GeneratorConfiguration');
const fs = require('fs');
const packageDotJson = require('../../package.json');

// TODO: Find out why this is undefined
// const { INITIALIZE_COMMAND, GENERATE_COMMAND } = require('../App');
const INITIALIZE_COMMAND = 'init';
const GENERATE_COMMAND = 'generate';

const ARTIFACT_DIRECTORY_ROOT = '/Generated';
const ARTIFACT_DIRECTORY_SOURCE_CODE = `${ARTIFACT_DIRECTORY_ROOT}/SourceCodeArtifacts`;

class GeneratorConfiguration {
  /**
   * Constructor for the configuration object. It is passed info collected on the command line, potentially with sensible default values.
   * The following are necessarily set:
   * - outputDirectory
   * - noprompt
   * - quiet
   * @param {Object} initialConfig the command line options
   * @param {*} inquirerProcess additional user prompt
   */
  constructor(initialConfig, inquirerProcess) {
    if (initialConfig.vocabListFile) {
      // The command line contains a yaml file
      this.configuration = {
        ...initialConfig,
        ...GeneratorConfiguration.fromYaml(initialConfig.vocabListFile),
      };
    } else {
      this.configuration = {
        ...initialConfig,
        ...GeneratorConfiguration.fromCommandLine(initialConfig),
      };
    }
    // Extend the received arguments with contextual data
    this.configuration.generatedTimestamp = moment().format('LLLL');
    this.configuration.generatorName = packageDotJson.name;
    this.configuration.generatorVersion = packageDotJson.version;
    // Enable asking for additional info
    this.inquirerProcess = inquirerProcess;
  }

  static normalizeResources(vocab, yamlPath) {
    const normalizedVocab = vocab;
    for (let i = 0; i < vocab.inputResources.length; i += 1) {
      if (!vocab.inputResources[i].startsWith('http')) {
        // This modification makes the local vocabulary path relative to the root of the project,
        // rather that to the configuration file. It makes it consistent with vocabularies passed
        // on the command line.
        normalizedVocab.inputResources[i] = path.join(
          path.dirname(yamlPath),
          vocab.inputResources[i]
        );
      }
    }
    if (vocab.termSelectionFile) {
      normalizedVocab.termSelectionFile = path.join(
        path.dirname(yamlPath),
        vocab.termSelectionFile
      );
    }
    return normalizedVocab;
  }

  /**
   * Validates if all the required values are present in the config file, and throws an error otherwise.
   * @param {Object} config the object loaded from the YAML config
   * @param {string} file the path to the YAML file, for error message purpose
   */
  static validateYamlConfig(config, file) {
    // If the vocab list is non-existent or empty (e.g. after initialization), the generator
    // cannot run.
    if (!config.vocabList) {
      throw new Error(
        'No vocabularies found: nothing to generate. ' +
          `Please edit the YAML configuration file [${file}] to provide vocabularies to generate from.`
      );
    }
  }

  static validateCommandline(args) {
    let mode = GENERATE_COMMAND;
    if (args._) {
      // Only one command is passed to yargs, so this array always contains one element
      [mode] = args._;
    }
    // If the options are provided by command line, at least one input resource must be specified (except for initialization)
    if (mode !== INITIALIZE_COMMAND && !args.inputResources) {
      throw new Error(
        'Missing input resource. Please provide either a YAML configuration file, or at least one input resource.'
      );
    }
  }

  /**
   * Parses the provided YAML file, and returns the read configuration it it is valid.
   *
   * @param {string} yamlPath path to the config file
   */
  static fromYaml(yamlPath) {
    let yamlConfiguration = {};
    try {
      logger(`Processing YAML file...`);
      yamlConfiguration = yaml.safeLoad(fs.readFileSync(yamlPath, 'utf8'));
      for (let i = 0; i < yamlConfiguration.vocabList.length; i += 1) {
        yamlConfiguration.vocabList[i] = GeneratorConfiguration.normalizeResources(
          yamlConfiguration.vocabList[i],
          yamlPath
        );
      }
      GeneratorConfiguration.validateYamlConfig(yamlConfiguration, yamlPath);
    } catch (error) {
      throw new Error(`Failed to read configuration file [${yamlPath}]: ${error}`);
    }
    return yamlConfiguration;
  }

  /**
   * Collects vocabulary-related information from the command line
   * @param {*} args
   */
  static collectVocabFromCLI(args) {
    const vocab = {};
    vocab.inputResources = args.inputResources;
    if (args.vocabTermsFrom) {
      vocab.termSelectionFile = args.vocabTermsFrom;
    }
    return vocab;
  }

  static fromCommandLine(args) {
    const cliConfig = {};
    GeneratorConfiguration.validateCommandline(args);

    // It is assumed that by default, all vocabularies are resources for the same artifact.
    // The most common case for using the command line is providing a single vocab anyways.
    cliConfig.vocabList = [GeneratorConfiguration.collectVocabFromCLI(args)];

    cliConfig.outputDirectoryForArtifact = `${args.outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;

    // We weren't provided with a configuration file, so manually provide
    // defaults.
    cliConfig.artifactToGenerate = [
      {
        programmingLanguage: 'Javascript',
        artifactFolderName: 'Javascript',
        handlebarsTemplate: 'javascript-rdf-ext.hbs',
        sourceFileExtension: 'js',
      },
    ];

    if (args.artifactVersion) {
      cliConfig.artifactToGenerate[0].artifactVersion = args.artifactVersion;
    }

    if (args.litVocabTermVersion) {
      cliConfig.artifactToGenerate[0].litVocabTermVersion = args.litVocabTermVersion;
    }

    return cliConfig;
  }

  /**
   * This function is asked when generating a single vocab, if processing the vocab did not provide the expected
   * additional information.
   */
  async askAdditionalQuestions() {
    if (this.inquirerProcess) {
      this.configuration = await this.inquirerProcess(this.configuration);
    }
  }
}

module.exports = GeneratorConfiguration;
