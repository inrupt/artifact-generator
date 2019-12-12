const yaml = require('js-yaml');
const path = require('path');
const moment = require('moment');
const debug = require('debug')('lit-artifact-generator:GeneratorConfiguration');
const fs = require('fs');
const packageDotJson = require('../../package.json');
const CommandLine = require('../CommandLine');

const { COMMAND_INITIALIZE, COMMAND_GENERATE } = require('../App');

const ARTIFACT_DIRECTORY_ROOT = '/Generated';
const ARTIFACT_DIRECTORY_SOURCE_CODE = `${ARTIFACT_DIRECTORY_ROOT}/SourceCodeArtifacts`;
const DEFAULT_PUBLISH_KEY = '_default';

// This is the path to the template directory
const RELATIVE_TEMPLATE_DIRECTORY = path.join('..', '..', 'templates');

const WEBPACK_DEFAULT = {
  packagingTool: 'webpack',
  packagingFolder: 'config',
  packagingTemplates: [
    {
      template: path.join(__dirname, RELATIVE_TEMPLATE_DIRECTORY, 'webpack.dev.config.hbs'),
      fileName: 'webpack.dev.config.js',
    },
    {
      template: path.join(__dirname, RELATIVE_TEMPLATE_DIRECTORY, 'webpack.prod.config.hbs'),
      fileName: 'webpack.prod.config.js',
    },
  ],
};

const NPM_DEFAULT = {
  packagingTool: 'npm',
  npmModuleScope: '@lit/',
  publish: [{ key: 'local', command: 'npm publish --registry https://localhost:4873' }],
  packagingTemplates: [
    {
      template: path.join(__dirname, RELATIVE_TEMPLATE_DIRECTORY, 'package.hbs'),
      fileName: 'package.json',
    },
    {
      template: path.join(__dirname, RELATIVE_TEMPLATE_DIRECTORY, 'index.hbs'),
      fileName: 'index.js',
    },
  ],
};

const DEFAULT_CLI_ARTIFACT = [
  {
    programmingLanguage: 'Javascript',
    artifactDirectoryName: 'Javascript',
    handlebarsTemplate: path.join(__dirname, RELATIVE_TEMPLATE_DIRECTORY, 'javascript-rdf-ext.hbs'),
    sourceFileExtension: 'js',
    packaging: [NPM_DEFAULT],
  },
];

class GeneratorConfiguration {
  /**
   * Constructor for the configuration object. It is passed info collected on the command line, potentially with sensible default values.
   * The following are necessarily set:
   * - outputDirectory
   * - noprompt
   * - quiet
   * @param {Object} initialConfig the command line options
   */
  constructor(initialConfig) {
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
  }

  static normalizeInputResources(vocabConfig, normalizedYamlPath) {
    const normalizedVocabConfig = vocabConfig;
    for (let i = 0; i < vocabConfig.inputResources.length; i += 1) {
      if (!normalizedVocabConfig.inputResources[i].startsWith('http')) {
        // The vocab path is normalized by appending the normalized path of the YAML file to
        // the vocab path.
        normalizedVocabConfig.inputResources[i] = path.join(
          path.dirname(normalizedYamlPath),
          // Vocabularies are all made relative to the YAML file
          GeneratorConfiguration.normalizeAbsolutePath(
            vocabConfig.inputResources[i],
            path.dirname(normalizedYamlPath)
          )
        );
      }
    }
    return normalizedVocabConfig;
  }

  /**
   * This function checks if the provided resourcePath is a single filename
   * (e.g. example.hbs), or a path (e.g. ./templates/example.hbs).
   * @param {string} resourcePath
   * @returns a boolean
   */
  static isPlainFilename(resourcePath) {
    // TODO: as of now, online templates are not supported.
    // If the basename is identical to the full path, the provided argument
    // is just a file name
    return path.basename(resourcePath) === resourcePath;
  }

  static normalizeTemplatePath(templatePath, normalizedYamlPath) {
    let normalizedTemplate = templatePath;
    if (GeneratorConfiguration.isPlainFilename(templatePath)) {
      // If the template is just a file name, it must be resolved to the default
      // templates directory
      normalizedTemplate = GeneratorConfiguration.normalizeAbsolutePath(
        path.join(__dirname, RELATIVE_TEMPLATE_DIRECTORY, templatePath),
        process.cwd()
      );
    } else {
      normalizedTemplate = path.join(
        path.dirname(normalizedYamlPath),
        // Templates are all made relative to the YAML file
        GeneratorConfiguration.normalizeAbsolutePath(
          normalizedTemplate,
          path.dirname(normalizedYamlPath)
        )
      );
    }
    return normalizedTemplate;
  }

  /**
   * Normalizes all paths in an artifact config (source file templates,
   * packaging templates)
   * @param {*} artifactConfig
   * @param {string} normalizedYamlPath
   */
  static normalizeArtifactTemplates(artifactConfig, normalizedYamlPath) {
    const normalizedArtifactConfig = artifactConfig;
    normalizedArtifactConfig.handlebarsTemplate = GeneratorConfiguration.normalizeTemplatePath(
      artifactConfig.handlebarsTemplate,
      normalizedYamlPath
    );
    if (normalizedArtifactConfig.packaging) {
      normalizedArtifactConfig.packaging = normalizedArtifactConfig.packaging.map(
        packagingConfig => {
          const normalizedPackagingConfig = packagingConfig;
          normalizedPackagingConfig.packagingTemplates = packagingConfig.packagingTemplates.map(
            packagingTemplate => {
              const normalizedPackagingTemplate = packagingTemplate;
              normalizedPackagingTemplate.template = GeneratorConfiguration.normalizeTemplatePath(
                packagingTemplate.template,
                normalizedYamlPath
              );
              return normalizedPackagingTemplate;
            }
          );
          return normalizedPackagingConfig;
        }
      );
    }
    return normalizedArtifactConfig;
  }

  static normalizeConfigTemplatePaths(vocabConfig, normalizedYamlPath) {
    const vocabConfigNormalizedTemplates = vocabConfig;
    vocabConfigNormalizedTemplates.artifactToGenerate = vocabConfig.artifactToGenerate.map(
      artifactConfig => {
        return this.normalizeArtifactTemplates(artifactConfig, normalizedYamlPath);
      }
    );
    if (
      vocabConfigNormalizedTemplates.versioning &&
      vocabConfigNormalizedTemplates.versioning.associatedFiles
    ) {
      vocabConfigNormalizedTemplates.versioning.associatedFiles = vocabConfigNormalizedTemplates.versioning.associatedFiles.map(
        versioningFile => {
          const normalizedVersioningFile = versioningFile;
          normalizedVersioningFile.template = GeneratorConfiguration.normalizeTemplatePath(
            versioningFile.template,
            normalizedYamlPath
          );
          return normalizedVersioningFile;
        }
      );
    }
    return vocabConfigNormalizedTemplates;
  }

  /**
   *  This function makes the local vocabulary path relative to the root of the project,
   *  rather that to the configuration file. It makes it consistent with vocabularies passed
   *  on the command line.
   * @param {*} vocabConfig the path of the vocabulary, relative to the YAML config
   * @param {*} yamlPath the path of the YAML config, relative to the project root
   */
  static normalizePath(vocabConfig, yamlPath) {
    let normalizedVocabConfig = vocabConfig;
    const normalizedYamlPath = GeneratorConfiguration.normalizeAbsolutePath(
      yamlPath,
      process.cwd()
    );
    normalizedVocabConfig = GeneratorConfiguration.normalizeInputResources(
      normalizedVocabConfig,
      normalizedYamlPath
    );
    if (vocabConfig.termSelectionResource) {
      normalizedVocabConfig.termSelectionResource = path.join(
        path.dirname(normalizedYamlPath),
        GeneratorConfiguration.normalizeAbsolutePath(
          vocabConfig.termSelectionResource,
          path.dirname(normalizedYamlPath)
        )
      );
    }
    return normalizedVocabConfig;
  }

  /**
   * This function takes an absolute path, and makes it relative to the provided base. If the provided path is
   * already relative, it is returned without modification.
   * @param {*} absolute the absolute path to the vocabulary
   * @param {*} base the path we want the vocabulary to be relative to (typically the project root)
   */
  static normalizeAbsolutePath(absolute, base) {
    if (absolute.startsWith('/')) {
      return path.relative(base, absolute);
    }
    return absolute;
  }

  /**
   * This function checks the validity of artifacts objects as found in the artifactToGenerate list
   * @param {*} artifact the configuration object for an individual artifact
   */
  static validateArtifact(artifact) {
    if (!artifact.artifactDirectoryName) {
      throw new Error(
        `The target directory name for the [${artifact.programmingLanguage}] artifact is missing. Please set a value for 'artifactDirectoryName'.`
      );
    }
    if (artifact.packaging) {
      artifact.packaging.forEach(packagingConfig => {
        if (!packagingConfig.packagingTemplates) {
          throw new Error(
            `No templates associated to packaging tool [${packagingConfig.packagingTool}]`
          );
        }
      });
    }
  }

  /**
   * Validates if all the required values are present in the config file, and
   * throws an error otherwise.
   * @param {Object} config the object loaded from the YAML config
   * @param {string} file the path to the YAML file, for error message purpose
   */
  static validateYamlConfig(config, file) {
    // Check version mismatch
    if (!config.generatorVersion) {
      throw new Error(`Missing 'generatorVersion' field in ${file}.`);
    }
    if (config.generatorVersion !== packageDotJson.version) {
      debug(
        `You are running the version ${packageDotJson.version} of the generator, and reading a configuration file validated for version ${config.generatorVersion}. Please check https://github.com/inrupt/lit-artifact-generator-js/releases to verify compatibility.`
      );
    }

    // There must be at least one artifact defined
    if (!config.artifactToGenerate) {
      throw new Error(
        'No artifacts found: nothing to generate. ' +
          `Please edit the YAML configuration file [${file}] to provide artifacts to be generated.`
      );
    }
    for (let i = 0; i < config.artifactToGenerate.length; i += 1) {
      GeneratorConfiguration.validateArtifact(config.artifactToGenerate[i]);
    }
    // There must be at least one vocabulary defined
    if (!config.vocabList) {
      throw new Error(
        'No vocabularies found: nothing to generate. ' +
          `Please edit the YAML configuration file [${file}] to provide vocabularies to generate from.`
      );
    }
  }

  static validateCommandline(args) {
    let mode = COMMAND_GENERATE;
    if (args._) {
      // Only one command is passed to yargs, so this array always contains one element
      [mode] = args._;
    }
    // If the options are provided by command line, at least one input resource must be specified (except for initialization)
    if (mode !== COMMAND_INITIALIZE && !args.inputResources) {
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
      debug(`Processing YAML file...`);
      yamlConfiguration = yaml.safeLoad(fs.readFileSync(yamlPath, 'utf8'));
      if (!yamlConfiguration) {
        throw new Error('Empty YAML file');
      }
      GeneratorConfiguration.validateYamlConfig(yamlConfiguration, yamlPath);
      for (let i = 0; i < yamlConfiguration.vocabList.length; i += 1) {
        yamlConfiguration.vocabList[i] = GeneratorConfiguration.normalizePath(
          yamlConfiguration.vocabList[i],
          yamlPath
        );
      }
      GeneratorConfiguration.normalizeConfigTemplatePaths(yamlConfiguration, yamlPath);
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
    for (let i = 0; i < vocab.inputResources.length; i += 1) {
      // If the vocab passed on the CLI is absolute, it is normalized
      vocab.inputResources[i] = GeneratorConfiguration.normalizeAbsolutePath(
        vocab.inputResources[i],
        process.cwd()
      );
    }
    if (args.termSelectionResource) {
      vocab.termSelectionResource = args.termSelectionResource;
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

    // We weren't provided with a configuration file, so manually provide defaults.
    const packagingInfo = NPM_DEFAULT;
    // If the registry is set in the command line, override default
    if (args.npmRegistry) {
      packagingInfo.publish = [
        { key: DEFAULT_PUBLISH_KEY, command: `npm publish --registry ${args.npmRegistry}` },
      ];
    }
    // TODO: Here, the DEFAULT_CLI_ARTIFACT constant should be used, but since
    //  objects are copied by reference, and the tests are run in parallel, it
    //  creates thread-safety issues that should be adressed by creating a
    //  deep copy.
    cliConfig.artifactToGenerate = [
      {
        programmingLanguage: 'Javascript',
        artifactDirectoryName: 'Javascript',
        handlebarsTemplate: path.join(
          __dirname,
          RELATIVE_TEMPLATE_DIRECTORY,
          'javascript-rdf-ext.hbs'
        ),
        sourceFileExtension: 'js',
        packaging: [packagingInfo],
      },
    ];

    if (args.supportBundling) {
      cliConfig.artifactToGenerate[0].packaging.push(WEBPACK_DEFAULT);
    }

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
   * additional information. These information may be completed when generating the vocabularies, and will not
   * necessarily be asked to the user.
   */
  askAdditionalQuestions() {
    this.configuration = CommandLine.findPublishedVersionOfModule(this.configuration);
  }

  /**
   * If receiving the config from the command line, some information may be missing that we know the vocabulary generation
   * will not provide. These must be asked to the user.
   *
   */
  async completeInitialConfiguration() {
    if (!this.configuration.artifactToGenerate[0].litVocabTermVersion) {
      if (!this.configuration.noprompt) {
        const input = await CommandLine.askForLitVocabTermVersion();
        this.configuration.artifactToGenerate[0].litVocabTermVersion = input.litVocabTermVersion;
      } else {
        throw new Error(
          'Missing LIT VocabTerm version: The LIT VocabTerm version was not provided as a CLI option, and user prompt is deactivated.'
        );
      }
    }
    return this;
  }

  /**
   * This function returns all the resources (local files and online reposirtories) that are listed in the configuration object
   */
  getInputResources() {
    const resources = [];
    for (let i = 0; i < this.configuration.vocabList.length; i += 1) {
      for (let j = 0; j < this.configuration.vocabList[i].inputResources.length; j += 1) {
        resources.push(this.configuration.vocabList[i].inputResources[j]);
      }
    }
    return resources;
  }
}

module.exports = GeneratorConfiguration;
module.exports.DEFAULT_CLI_ARTIFACT = DEFAULT_CLI_ARTIFACT;
module.exports.ARTIFACT_DIRECTORY_ROOT = ARTIFACT_DIRECTORY_ROOT;
module.exports.DEFAULT_PUBLISH_KEY = DEFAULT_PUBLISH_KEY;
