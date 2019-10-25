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

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile: './test/resources/vocabs/vocab-list.yml',
            outputDirectory,
            // artifactVersion: '1.0.0',
            moduleNamePrefix: '@lit/generated-vocab-',
            noprompt: true,
          },
          undefined
        )
      );

      await artifactGenerator.generate();
      verifyVocabList(outputDirectory);
    });

    it('should generate artifact from vocab list file (with inquirer)', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/vocab-list-file-inquirer';
      del.sync([`${outputDirectory}/*`]);

      let inquirerCalled = false;
      const inquirerProcess = data => {
        return new Promise(resolve => {
          inquirerCalled = true;
          resolve(data);
        });
      };

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile: './test/resources/vocabs/vocab-list-missing-info.yml',
            outputDirectory,
            moduleNamePrefix: '@lit/generated-vocab-',
          },
          inquirerProcess
        )
      );

      await artifactGenerator.generate();
      expect(inquirerCalled).toBe(true);
      verifyVocabList(outputDirectory);
    });

    it('Should generate artifact with bundling', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/bundling';
      del.sync([`${outputDirectory}/*`]);

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            _: 'generate',
            inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
            outputDirectory,
            artifactVersion: '1.0.0',
            moduleNamePrefix: '@lit/generated-vocab-',
            noprompt: true,
            supportBundling: true,
          },
          undefined
        )
      );

      await artifactGenerator.generate();
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;

      expect(fs.existsSync(`${outputDirectoryJavascript}/config`)).toBe(true);
      const packageOutput = fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString();
      expect(packageOutput.indexOf('"devDependencies":')).toBeGreaterThan(-1);
    });
  });

  describe('Processing command line vocab.', () => {
    it('Should generate artifact without bundling', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';
      del.sync([`${outputDirectory}/*`]);

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            _: 'generate',
            inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
            outputDirectory,
            artifactVersion: '1.0.0',
            litVocabTermVersion: '^1.0.10',
            moduleNamePrefix: '@lit/generated-vocab-',
            noprompt: true,
            supportBundling: false,
          },
          undefined
        )
      );

      await artifactGenerator.generate();
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;

      expect(fs.existsSync(`${outputDirectoryJavascript}/config`)).toBe(false);
      const packageOutput = fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString();
      expect(packageOutput.indexOf('"devDependencies",')).toEqual(-1);
    });

    it('should not ask for user input when no information is missing', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue(Promise.resolve(MOCKED_USER_INPUT))
      );

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            _: 'generate',
            inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
            outputDirectory,
            artifactName: 'testName',
            litVocabTermVersion: '^1.0.10',
            authorSet: new Set(['Cleopatra']),
          },
          inquirer.prompt
        )
      );

      await artifactGenerator.generate();

      expect(inquirer.prompt.mock.calls.length).toEqual(0);
    });

    it('should ask for user input when version information missing', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue(Promise.resolve(MOCKED_USER_INPUT))
      );

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            _: 'generate',
            inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
            outputDirectory,
            authorSet: new Set(['Cleopatra']),
          },
          inquirer.prompt
        )
      );

      await artifactGenerator.generate();

      expect(inquirer.prompt.mock.calls.length).toEqual(1);
    });

    it('should ask for user input when author list is empty', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue(Promise.resolve(MOCKED_USER_INPUT))
      );

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            _: 'generate',
            inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
            outputDirectory,
            artifactName: 'testName',
            litVocabTermVersion: '^1.0.10',
            authorSet: new Set([]),
          },
          inquirer.prompt
        )
      );

      await artifactGenerator.generate();

      expect(inquirer.prompt.mock.calls.length).toEqual(2);
    });

    it('should ask for user input when author information missing', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue(Promise.resolve(MOCKED_USER_INPUT))
      );

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            _: 'generate',
            inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
            outputDirectory,
            litVocabTermVersion: '^1.0.10',
          },
          inquirer.prompt
        )
      );

      await artifactGenerator.generate();
      expect(inquirer.prompt.mock.calls.length).toEqual(3);
    });
  });

  it('should ask for user input when multiple information is missing', async () => {
    const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';
    inquirer.prompt.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(MOCKED_USER_INPUT))
    );

    const artifactGenerator = new ArtifactGenerator(
      new GeneratorConfiguration(
        {
          _: 'generate',
          inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
          outputDirectory,
        },
        inquirer.prompt
      )
    );

    await artifactGenerator.generate();

    expect(inquirer.prompt.mock.calls.length).toEqual(4);
  });
});
