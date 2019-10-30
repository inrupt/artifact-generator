require('mock-local-storage');

const GeneratorConfiguration = require('./GeneratorConfiguration');

const EXPECTED_VOCAB_LIST_FROM_YAML = [
  {
    description: 'Schema.org from Google, Microsoft, Yahoo and Yandex',
    inputResources: ['schema-snippet.ttl'],
    termSelectionFile: 'schema-inrupt-ext.ttl',
  },
  {
    description: 'Vocab for testing predicate types...',
    nameAndPrefixOverride: 'override-name',
    inputResources: ['./supported-data-types.ttl'],
  },
];

const EXPECTED_VOCAB_LIST_FROM_CLI = [
  {
    inputResources: ['schema-snippet.ttl'],
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
          moduleNamePrefix: '@lit/generated-vocab-',
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
          inputResources: ['schema-snippet.ttl'],
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        },
        undefined
      );

      expect(generatorConfiguration.configuration.noprompt).toBe(true);
      expect(generatorConfiguration.configuration.vocabList).toEqual(EXPECTED_VOCAB_LIST_FROM_CLI);
      expect(generatorConfiguration.configuration.artifactToGenerate).toEqual(DEFAULT_CLI_ARTIFACT);
    });
  });

  describe('Additional questions.', () => {
    it('should call the callback function when prompting questions', async () => {
      const mockCallback = jest.fn(x => x);
      const generatorConfiguration = new GeneratorConfiguration(
        {
          vocabListFile: './test/resources/vocabs/vocab-list.yml',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        },
        mockCallback
      );
      generatorConfiguration.askAdditionalQuestions();
      expect(mockCallback.mock.calls.length).toBe(1);
    });

    it('should do nothing when the callback is not specified', async () => {
      const mockCallback = jest.fn(x => x);
      const generatorConfiguration = new GeneratorConfiguration(
        {
          vocabListFile: './test/resources/vocabs/vocab-list.yml',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        },
        undefined
      );
      generatorConfiguration.askAdditionalQuestions();
      expect(mockCallback.mock.calls.length).toBe(0);
    });
  });
});
