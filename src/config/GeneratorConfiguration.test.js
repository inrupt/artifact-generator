require('mock-local-storage');

jest.mock('inquirer');
const inquirer = require('inquirer');

const GeneratorConfiguration = require('./GeneratorConfiguration');

const EXPECTED_VOCAB_LIST_FROM_YAML = [
  {
    description: 'Snippet of Schema.org from Google, Microsoft, Yahoo and Yandex',
    inputResources: ['test/resources/vocabs/schema-snippet.ttl'],
    termSelectionFile: 'test/resources/vocabs/schema-inrupt-ext.ttl',
  },
  {
    description: 'Vocab for testing predicate types...',
    nameAndPrefixOverride: 'override-name',
    inputResources: ['test/resources/vocabs/supported-data-types.ttl'],
  },
];

const EXPECTED_VOCAB_LIST_FROM_CLI = [
  {
    inputResources: ['test/resources/vocabs/schema-snippet.ttl'],
  },
];

const DEFAULT_CLI_ARTIFACT = [
  {
    programmingLanguage: 'Javascript',
    artifactFolderName: 'Javascript',
    handlebarsTemplate: 'javascript-rdf-ext.hbs',
    sourceFileExtension: 'js',
  },
];

const MOCKED_USER_INPUT = { authorSet: new Set(['Cleopatra']), artifactName: 'someName' };

describe('Generator configuration', () => {
  describe('Processing vocab list file.', () => {
    // FAILURE CASES
    it('should fail with non-existent vocab list file', async () => {
      const nonExistFile = ' nonsense file name';
      await expect(() => {
        GeneratorConfiguration.fromYaml(nonExistFile);
      }).toThrow('Failed to read configuration file');
    });

    it('should fail with invalid YAML vocab list file', async () => {
      const notYamlFile = './test/resources/vocabs/vocab-list.txt';
      await expect(() => {
        GeneratorConfiguration.fromYaml(notYamlFile);
      }).toThrow('Failed to read configuration file');
    });

    it('should throw an error trying to generate from an empty vocab list', async () => {
      const configFile = 'empty-vocab-list.yml';
      const configPath = `./test/resources/vocabs/${configFile}`;

      // Test that the error message contains the expected explanation and file name
      await expect(() => {
        GeneratorConfiguration.validateYamlConfig(
          {
            vocabListFile: configPath,
            artifactVersion: '1.0.0',
            moduleNamePrefix: '@lit/generated-vocab-',
          },
          configFile
        );
      }).toThrow(/^No vocabularies found/, configFile);
    });

    // SUCCESS CASE
    it('should generate collected configuration from vocab list file', async () => {
      const generatorConfiguration = new GeneratorConfiguration(
        {
          _: ['generate'],
          vocabListFile: './test/resources/vocabs/vocab-list.yml',
          noprompt: true,
        },
        undefined
      );

      expect(generatorConfiguration.configuration.noprompt).toBe(true);
      expect(generatorConfiguration.configuration.vocabList).toEqual(EXPECTED_VOCAB_LIST_FROM_YAML);
    });
  });

  describe('Processing command line.', () => {
    // FAILURE CASE
    it('should fail with non-existent input resource for generation', async () => {
      await expect(() => {
        GeneratorConfiguration.fromCommandLine({ _: ['generate'] });
      }).toThrow('Missing input resource');
    });

    it('should accept a non-existent input resource for initialization', async () => {
      await expect(() => {
        GeneratorConfiguration.fromCommandLine({ _: ['init'] });
      }).not.toThrow('Missing input resource');
    });

    // SUCCESS CASE
    it('should generate collected configuration from command line', async () => {
      const generatorConfiguration = new GeneratorConfiguration(
        {
          _: ['generate'],
          inputResources: ['test/resources/vocabs/schema-snippet.ttl'],
          moduleNamePrefix: '@lit/generated-vocab-',
          authorSet: new Set(['Cleopatra']),
          noprompt: true,
        },
        undefined
      );

      expect(generatorConfiguration.configuration.noprompt).toBe(true);
      expect(generatorConfiguration.configuration.authorSet).toEqual(new Set(['Cleopatra']));
      expect(generatorConfiguration.configuration.vocabList).toEqual(EXPECTED_VOCAB_LIST_FROM_CLI);
      expect(generatorConfiguration.configuration.artifactToGenerate).toEqual(DEFAULT_CLI_ARTIFACT);
    });
  });

  describe('Additional questions.', () => {
    it('should set missing information when prompting questions', async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue(Promise.resolve(MOCKED_USER_INPUT))
      );

      const generatorConfiguration = new GeneratorConfiguration({
        vocabListFile: './test/resources/vocabs/vocab-list-missing-info.yml',
      });
      await generatorConfiguration.askAdditionalQuestions();
      expect(generatorConfiguration.configuration.authorSet).toEqual(new Set(['Cleopatra']));
    });

    it('should fail when not providing info and preventing prompt', async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue(Promise.resolve(MOCKED_USER_INPUT))
      );

      const generatorConfiguration = new GeneratorConfiguration({
        inputResources: ['test/resources/vocabs/schema-snippet.ttl'],
        noprompt: true,
      });
      expect(generatorConfiguration.completeInitialConfiguration()).rejects.toThrow(
        'Missing LIT VocabTerm version'
      );
    });
  });
});
