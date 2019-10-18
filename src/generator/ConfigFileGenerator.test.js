const fs = require('fs');

const inquirer = require('inquirer');
const { LANGUAGE: JAVA } = require('../config/artifacts/JavaArtifactConfig');

jest.mock('inquirer');

require('mock-local-storage');
const { ConfigFileGenerator, validateLanguageCheckboxes } = require('./ConfigFileGenerator');

// This line will have to change if one day we decide to support Ook (spoiler alert:
// it is unlikely https://en.wikipedia.org/wiki/Brainfuck#Derivatives).
const UNSUPPORTED_LANGUAGE = 'Ook';

const targetPath = './lit-vocab.yml';

const COMPLETE_CONFIG = {
  artifactName: 'myNewArtifact',
  authorSet: 'Cleopatra (https://cleopatra.solid.community/profile/card#me)',
  artifactToGenerate: [
    {
      languageKeywordsToUnderscore: ['class', 'abstract'],
      handlebarsTemplate: 'java-rdf4j.hbs',
      sourceFileExtension: 'java',
      artifactFolderName: 'Java',
      programmingLanguage: 'Java',
      artifactVersion: '0.1.0',
      litVocabTermVersion: '0.1.0-SNAPSHOT',
      javaPackageName: 'com.example.java.packagename',
    },
    {
      languageKeywordsToUnderscore: ['class', 'abstract'],
      handlebarsTemplate: 'javascript-rdf-ext.hbs',
      sourceFileExtension: 'js',
      programmingLanguage: 'Javascript',
      artifactFolderName: 'Javascript',
      artifactVersion: '0.1.0',
      litVocabTermVersion: '^0.1.0',
      npmModuleScope: '@exampleScope/',
    },
  ],
  vocabList: [
    {
      inputResources: ['http://xmlns.com/foaf/0.1/'],
      nameAndPrefixOverride: 'foaf',
      description: 'An example vocabulary',
      termSelectionFile: '',
    },
    {
      inputResources: [`http://xmlns.com/foaf/0.1/`],
      nameAndPrefixOverride: 'sch',
      description: 'Another example',
      termSelectionFile: ``,
    },
  ],
};

const SAMPLE_CONFIG = {
  artifactName: 'myNewArtifact',
  authorSet: 'Cleopatra (https://cleopatra.solid.community/profile/card#me)',
  artifactToGenerate: [],
  vocabList: [],
};

const DUMMY_JAVA_ARTIFACT = {
  artifactVersion: '0.0.1',
  javaPackageName: 'com.example.dummy.packagename',
};

const INVALID_CONFIG = {};

describe('ConfigFile Generator', () => {
  it('should not validate empty configs', () => {
    expect(ConfigFileGenerator.isValidConfig(INVALID_CONFIG)).toEqual(false);
    expect(ConfigFileGenerator.isValidConfig(SAMPLE_CONFIG)).toEqual(true);
  });

  it('should fail when asking for a config generator of an unsupported language', () => {
    expect(() => {
      ConfigFileGenerator.buildConfigGenerator(UNSUPPORTED_LANGUAGE);
    }).toThrow(UNSUPPORTED_LANGUAGE, 'Unsported language');
  });

  it('should fail when less than one language is checked', () => {
    expect(validateLanguageCheckboxes([])).toEqual('You must choose at least one target language.');
  });

  it('should fail when trying to set an invalid config', () => {
    const configGenerator = new ConfigFileGenerator();
    expect(() => {
      configGenerator.setConfig(INVALID_CONFIG);
    }).toThrow('Invalid configuration');
  });

  it('should use the provided config', () => {
    const configGenerator = new ConfigFileGenerator();
    configGenerator.setConfig(SAMPLE_CONFIG);
    expect(configGenerator.config).toEqual(SAMPLE_CONFIG);
  });

  it('should generate a complete file when directly setting the config', () => {
    const configGenerator = new ConfigFileGenerator();
    configGenerator.setConfig(COMPLETE_CONFIG);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    configGenerator.generateConfigFile(targetPath);
    expect(fs.existsSync(targetPath)).toEqual(true);
    fs.unlinkSync(targetPath);
  });

  it('should generate a valid artifact according to the checkbox selection', async () => {
    inquirer.prompt.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(DUMMY_JAVA_ARTIFACT))
    );

    const artifacts = await ConfigFileGenerator.promptArtifacts([JAVA]);
    expect(artifacts[0].artifactVersion).toEqual(DUMMY_JAVA_ARTIFACT.artifactVersion);
  });

  it('should fail when the user prompt is not valid', async () => {
    inquirer.prompt.mockImplementation(jest.fn().mockReturnValue(Promise.resolve({})));
    const configGenerator = new ConfigFileGenerator();
    // For now, we just mock basic user input
    // TODO: Figure out how to mock more complex user input
    expect(configGenerator.collectConfigInfo()).rejects.toThrow();
  });
});
