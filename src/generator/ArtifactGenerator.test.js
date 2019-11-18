require('mock-local-storage');

const fs = require('fs');
const del = require('del');

jest.mock('inquirer');
const inquirer = require('inquirer');

const ArtifactGenerator = require('./ArtifactGenerator');
const GeneratorConfiguration = require('../config/GeneratorConfiguration');
const { ARTIFACT_DIRECTORY_SOURCE_CODE } = require('./ArtifactGenerator');

const MOCKED_ARTIFACT_NAME = 'testArtifact';
const MOCKED_LIT_VOCAB_TERM_VERSION = '0.0.1';
const MOCKED_AUTHORS = ['Jules Caesar (https://jcaesar.solid.community/profile/card#me)'];

const MOCKED_USER_INPUT = {
  artifactName: MOCKED_ARTIFACT_NAME,
  litVocabTermVersion: MOCKED_LIT_VOCAB_TERM_VERSION,
  authorSet: MOCKED_AUTHORS,
};

beforeEach(() => {
  inquirer.prompt.mockImplementation(jest.fn().mockReturnValue(Promise.resolve(MOCKED_USER_INPUT)));
});

describe('Artifact Generator', () => {
  describe('Processing vocab list file.', () => {
    function verifyVocabList(outputDirectory) {
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;

      expect(fs.existsSync(`${outputDirectoryJavascript}/index.js`)).toBe(true);
      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).toBe(true);

      expect(fs.existsSync(`${outputDirectoryJavascript}/GeneratedVocab/OVERRIDE_NAME.js`)).toBe(
        true
      );
      expect(
        fs.existsSync(`${outputDirectoryJavascript}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`)
      ).toBe(true);

      const indexOutput = fs.readFileSync(`${outputDirectoryJavascript}/index.js`).toString();
      expect(indexOutput).toEqual(
        expect.stringContaining(
          "module.exports.SCHEMA_INRUPT_EXT = require('./GeneratedVocab/SCHEMA_INRUPT_EXT')"
        )
      );

      const packageOutput = fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString();
      expect(packageOutput).toEqual(
        expect.stringContaining('"name": "@lit/generated-vocab-common-TEST",')
      );
      expect(packageOutput).toEqual(expect.stringContaining('"version": "10.11.12"'));

      const outputDirectoryJava = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java`;
      const pomOutput = fs.readFileSync(`${outputDirectoryJava}/pom.xml`).toString();
      expect(pomOutput).toEqual(expect.stringContaining('<version>3.2.1-SNAPSHOT</version>'));
    }

    it('should generate artifact from vocab list file', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/vocab-list-file';
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile: './test/resources/vocabs/vocab-list.yml',
        outputDirectory,
        noprompt: true,
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      verifyVocabList(outputDirectory);
    });

    it('should generate artifact from vocab list file (with inquirer)', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/vocab-list-file-inquirer';
      del.sync([`${outputDirectory}/*`]);

      // There are side-effects from test to test in the mocked functions, so we only count the new calls
      const before = inquirer.prompt.mock.calls.length;

      const config = new GeneratorConfiguration({
        vocabListFile: './test/resources/vocabs/vocab-list-missing-info.yml',
        outputDirectory,
        moduleNamePrefix: '@lit/generated-vocab-',
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);
      await artifactGenerator.generate();
      expect(inquirer.prompt.mock.calls.length - before).toEqual(1);
      verifyVocabList(outputDirectory);
    });
  });

  describe('Processing command line vocab.', () => {
    it('Should generate artifact without bundling', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';
      del.sync([`${outputDirectory}/*`]);
      const config = new GeneratorConfiguration({
        _: 'generate',
        inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
        outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
        supportBundling: false,
      });
      config.completeInitialConfiguration();

      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;

      expect(fs.existsSync(`${outputDirectoryJavascript}/config`)).toBe(false);
      const packageOutput = fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString();
      expect(packageOutput.indexOf('"devDependencies",')).toEqual(-1);
    });

    it('should not ask for user input when no information is missing', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';

      const config = new GeneratorConfiguration({
        _: 'generate',
        inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
        outputDirectory,
        artifactName: 'someName',
        litVocabTermVersion: '^1.0.10',
        authorSet: new Set(['Cleopatra']),
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();

      expect(artifactGenerator.artifactData.artifactName).toEqual('someName');
      expect(artifactGenerator.artifactData.litVocabTermVersion).toEqual('^1.0.10');
      expect(artifactGenerator.artifactData.authorSet).toEqual(new Set(['Cleopatra']));
      expect(artifactGenerator.artifactData.artifactName).not.toEqual(MOCKED_ARTIFACT_NAME);
      expect(artifactGenerator.artifactData.litVocabTermVersion).not.toEqual(
        MOCKED_LIT_VOCAB_TERM_VERSION
      );
      expect(artifactGenerator.artifactData.authorSet).not.toEqual(MOCKED_AUTHORS);
    });

    it('should ask for user input when version information missing', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';
      // There are side-effects from test to test in the mocked functions, so we only count the new calls
      const before = inquirer.prompt.mock.calls.length;
      const config = new GeneratorConfiguration({
        _: 'generate',
        inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
        outputDirectory,
        authorSet: new Set(['Cleopatra']),
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();

      expect(inquirer.prompt.mock.calls.length - before).toEqual(1);
      expect(artifactGenerator.artifactData.artifactToGenerate[0].litVocabTermVersion).toEqual(
        MOCKED_LIT_VOCAB_TERM_VERSION
      );
    });

    it('should ask for user input when author list is empty', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';
      // There are side-effects from test to test in the mocked functions, so we only count the new calls
      const before = inquirer.prompt.mock.calls.length;
      const config = new GeneratorConfiguration({
        _: 'generate',
        inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
        outputDirectory,
        artifactName: 'testName',
        litVocabTermVersion: '^1.0.10',
        authorSet: new Set([]),
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();

      expect(inquirer.prompt.mock.calls.length - before).toEqual(1);
    });

    it('should ask for user input when author information missing', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';
      // There are side-effects from test to test in the mocked functions, so we only count the new calls
      const before = inquirer.prompt.mock.calls.length;
      const config = new GeneratorConfiguration({
        _: 'generate',
        inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
        outputDirectory,
        litVocabTermVersion: '^1.0.10',
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      expect(inquirer.prompt.mock.calls.length - before).toEqual(1);
    });

    it('should ask for user input twice when multiple information is missing', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';
      // There are side-effects from test to test in the mocked functions, so we only count the new calls
      const before = inquirer.prompt.mock.calls.length;
      const config = new GeneratorConfiguration({
        _: 'generate',
        inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
        outputDirectory,
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();

      // One call is for litVocabterm version, the other for artifact name and authors
      expect(inquirer.prompt.mock.calls.length - before).toEqual(2);
    });

    it('Should generate artifact with bundling', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/bundling';
      del.sync([`${outputDirectory}/*`]);
      const config = new GeneratorConfiguration({
        _: 'generate',
        inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
        outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^0.1.0',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
        supportBundling: true,
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;

      expect(fs.existsSync(`${outputDirectoryJavascript}/config`)).toBe(true);
      const packageOutput = fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString();
      expect(packageOutput.indexOf('"devDependencies":')).toBeGreaterThan(-1);
    });
  });

  describe('Publishing artifacts.', () => {
    it('should publish artifacts if the publish option is specified', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/publish/optionSet';
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile: './test/resources/packaging/vocab-list-dummy-commands.yml',
        outputDirectory,
        noprompt: true,
        publish: true,
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);
      await artifactGenerator
        .generate()
        .then(generationData => artifactGenerator.publish(generationData));
      // In the config file, the publication command has been replaced by a command creating a file in the artifact root folder
      expect(
        fs.existsSync(`${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java/mvn-publish`)
      ).toBe(true);
      expect(
        fs.existsSync(`${outputDirectory}/${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript/npm-publish`)
      ).toBe(true);
    });
  });

  describe('Testing for backward compatibility features.', () => {
    it('should generate default packaging options if none are specified in the YAML file', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/backwardCompatibility/';
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile: './test/resources/backwardCompatibility/vocab-list_no-packaging.yml',
        outputDirectory,
        noprompt: true,
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);
      await artifactGenerator
        .generate()
        .then(generationData => artifactGenerator.publish(generationData));
      // In the config file, the publication command has been replaced by a command creating a file in the artifact root folder
      expect(
        fs.existsSync(`${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java/pom.xml`)
      ).toBe(true);
      expect(
        fs.existsSync(
          `${outputDirectory}/${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript/package.json`
        )
      ).toBe(true);
    });
  });
});
