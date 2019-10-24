const fs = require('fs');

const inquirer = require('inquirer');
const { LANGUAGE: JAVA } = require('../config/artifacts/JavaArtifactConfigurator');

jest.mock('inquirer');

require('mock-local-storage');
const { ConfigFileGenerator, validateLanguageCheckboxes } = require('./ConfigFileGenerator');

// This line will have to change if one day we decide to support Ook (spoiler alert:
// it is unlikely https://en.wikipedia.org/wiki/Brainfuck#Derivatives).
const UNSUPORTED_LANGUAGE = 'Ook';

const TARGET_DIR = './test/generated/config/';
const TARGET_FILE = 'lit-vocab.yml';
const TARGET_PATH = TARGET_DIR + TARGET_FILE;
const REFERENCE_PROMPTED_YAML = './test/resources/expectedOutputs/lit-vocab.yml';
const REFERENCE_DEFAULT_YAML = './test/resources/expectedOutputs/default-lit-vocab.yml';

// Config components
const ARTIFACT_NAME = 'myNewArtifact';
const AUTHOR_SET = 'Cleopatra (https://cleopatra.solid.community/profile/card#me)';
const PROMPTED_JAVA_ARTIFACT = {
  artifactVersion: '0.1.0',
  litVocabTermVersion: '0.1.0-SNAPSHOT',
  javaPackageName: 'com.example.java.packagename',
};
const COMPLETE_JAVA_ARTIFACT = {
  languageKeywordsToUnderscore: ['class', 'abstract'],
  handlebarsTemplate: 'java-rdf4j.hbs',
  sourceFileExtension: 'java',
  artifactFolderName: 'Java',
  programmingLanguage: 'Java',
  ...PROMPTED_JAVA_ARTIFACT,
};
const COMPLETE_VOCAB = {
  inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
  nameAndPrefixOverride: 'schema',
  description: 'An example vocabulary',
  termSelectionFile: '',
};

const COMPLETE_CONFIG = {
  artifactName: ARTIFACT_NAME,
  authorSet: AUTHOR_SET,
  artifactToGenerate: [COMPLETE_JAVA_ARTIFACT],
  vocabList: [COMPLETE_VOCAB],
};

const SAMPLE_CONFIG = {
  artifactName: ARTIFACT_NAME,
  authorSet: AUTHOR_SET,
  artifactToGenerate: [],
  vocabList: [],
};

const INVALID_CONFIG = {};

const MOCK_CONFIG_PROMPT = jest
  .fn()
  // General prompt
  .mockReturnValueOnce(Promise.resolve({ artifactName: ARTIFACT_NAME, authorSet: AUTHOR_SET }))
  .mockReturnValueOnce(Promise.resolve({ languages: ['Java'] }))
  .mockReturnValueOnce(Promise.resolve(PROMPTED_JAVA_ARTIFACT))
  .mockReturnValueOnce(Promise.resolve({ addVocab: true }))
  .mockReturnValueOnce(Promise.resolve(COMPLETE_VOCAB))
  .mockReturnValue(Promise.resolve({ addVocab: false }));

const MOCK_VOCAB_PROMPT = jest
  .fn()
  // The user wants to add a new vocab
  .mockReturnValueOnce(Promise.resolve({ addVocab: true }))
  .mockReturnValueOnce(Promise.resolve(COMPLETE_VOCAB))
  // The user wants to add another vocab
  .mockReturnValueOnce(Promise.resolve({ addVocab: true }))
  .mockReturnValue(Promise.resolve(COMPLETE_VOCAB));

describe('ConfigFile Generator', () => {
  it('should not validate empty configs', () => {
    expect(() => {
      ConfigFileGenerator.validateConfig(INVALID_CONFIG);
    }).toThrow('Invalid configuration');
    expect(() => {
      ConfigFileGenerator.validateConfig(SAMPLE_CONFIG);
    }).not.toThrow();
  });

  it('should fail when asking for a config generator of an unsupported language', () => {
    expect(() => {
      ConfigFileGenerator.buildConfigGenerator(UNSUPORTED_LANGUAGE);
    }).toThrow(UNSUPORTED_LANGUAGE, 'Unsported language');
  });

  it('should fail when less than one language is checked', () => {
    expect(validateLanguageCheckboxes([])).toEqual('You must choose at least one target language.');
    expect(validateLanguageCheckboxes(['Java'])).toEqual(true);
  });

  it('should fail when trying to set an invalid config', () => {
    const configGenerator = new ConfigFileGenerator();
    expect(() => {
      configGenerator.setConfig(INVALID_CONFIG);
    }).toThrow('Invalid configuration');
  });

  it('should fail when using an invalid config at generation time', () => {
    const configGenerator = new ConfigFileGenerator();
    configGenerator.config = INVALID_CONFIG;
    expect(() => {
      configGenerator.generateConfigFile(TARGET_PATH);
    }).toThrow('Invalid configuration');
  });

  it('should use the provided config', () => {
    const configGenerator = new ConfigFileGenerator();
    configGenerator.setConfig(SAMPLE_CONFIG);
    expect(configGenerator.config).toEqual(SAMPLE_CONFIG);
  });

  it('should generate a valid artifact according to the checkbox selection', async () => {
    inquirer.prompt.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(COMPLETE_JAVA_ARTIFACT))
    );

    const artifacts = await ConfigFileGenerator.promptArtifacts([JAVA]);
    expect(artifacts[0].artifactVersion).toEqual(COMPLETE_JAVA_ARTIFACT.artifactVersion);
  });

  it('should return as many vocabularies as the user prompted', async () => {
    inquirer.prompt.mockImplementation(MOCK_VOCAB_PROMPT);
    expect(ConfigFileGenerator.promptVocabularies()).resolves.toEqual([
      COMPLETE_VOCAB,
      COMPLETE_VOCAB,
    ]);
  });

  it('should collect config info from the user prompt', async () => {
    inquirer.prompt.mockImplementation(MOCK_CONFIG_PROMPT);
    const configGenerator = new ConfigFileGenerator();
    await configGenerator.collectConfigInfo();
    expect(configGenerator.config).toEqual(COMPLETE_CONFIG);
  });

  it('should generate a complete file when directly setting the config', () => {
    const configGenerator = new ConfigFileGenerator();
    configGenerator.setConfig(COMPLETE_CONFIG);
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    if (fs.existsSync(TARGET_PATH)) {
      fs.unlinkSync(TARGET_PATH);
    }
    configGenerator.generateConfigFile(TARGET_PATH);
    expect(fs.existsSync(TARGET_PATH)).toEqual(true);
    expect(fs.readFileSync(TARGET_PATH).toString()).toBe(
      fs.readFileSync(REFERENCE_PROMPTED_YAML).toString()
    );
  });

  it('should generate a default file even with an empty config', () => {
    const configGenerator = new ConfigFileGenerator({});
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    if (fs.existsSync(TARGET_PATH)) {
      fs.unlinkSync(TARGET_PATH);
    }
    configGenerator.generateDefaultConfigFile(TARGET_PATH);
    expect(fs.existsSync(TARGET_PATH)).toEqual(true);
    expect(fs.readFileSync(TARGET_PATH).toString()).toBe(
      fs.readFileSync(REFERENCE_DEFAULT_YAML).toString()
    );
  });
});
