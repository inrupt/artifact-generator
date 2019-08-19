require('mock-local-storage');

const fs = require('fs');
const del = require('del');

const ArtifactGenerator = require('./ArtifactGenerator');
const { ARTIFACT_DIRECTORY_SOURCE_CODE } = require('./ArtifactGenerator');

describe('Artifact Generator', () => {
  describe('Processing vocab list file.', () => {
    function verifyVocabList(outputDirectory) {
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;

      expect(fs.existsSync(`${outputDirectoryJavascript}/index.js`)).toBe(true);
      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).toBe(true);

      expect(fs.existsSync(`${outputDirectoryJavascript}/GeneratedVocab/override-name.js`)).toBe(
        true
      );
      expect(
        fs.existsSync(`${outputDirectoryJavascript}/GeneratedVocab/schema-inrupt-ext.js`)
      ).toBe(true);

      const indexOutput = fs.readFileSync(`${outputDirectoryJavascript}/index.js`).toString();
      expect(indexOutput).toEqual(
        expect.stringContaining(
          "module.exports.SCHEMA_INRUPT_EXT = require('./GeneratedVocab/schema-inrupt-ext')"
        )
      );

      const packageOutput = fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString();
      expect(packageOutput).toEqual(
        expect.stringContaining('"name": "@lit/generated-vocab-common-TEST",')
      );
    }

    it('should fail with non-existent vocab list file', async () => {
      const nonExistFile = ' nonsense file name';
      await expect(
        new ArtifactGenerator({ vocabListFile: nonExistFile }).generate()
      ).rejects.toThrow(nonExistFile);
    });

    it('should fail with invalid YAML vocab list file', async () => {
      const notYamlFile = './test/resources/vocabs/vocab-list.txt';
      await expect(
        new ArtifactGenerator({ vocabListFile: notYamlFile }).generate()
      ).rejects.toThrow(notYamlFile);
    });

    it('should generate artifact from vocab list file', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/vocab-list-file';
      del.sync([`${outputDirectory}/*`]);

      const artifactGenerator = new ArtifactGenerator({
        vocabListFile: './test/resources/vocabs/vocab-list.yml',
        outputDirectory,
        artifactVersion: '1.0.0',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

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
        {
          vocabListFile: './test/resources/vocabs/vocab-list.yml',
          outputDirectory,
          artifactVersion: '1.0.0',
          moduleNamePrefix: '@lit/generated-vocab-',
        },
        inquirerProcess
      );

      await artifactGenerator.generate();
      expect(inquirerCalled).toBe(true);
      verifyVocabList(outputDirectory);
    });

    it('Should generate artifact with bundling', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/bundling';
      del.sync([`${outputDirectory}/*`]);

      const artifactGenerator = new ArtifactGenerator({
        inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
        outputDirectory,
        artifactVersion: '1.0.0',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
        supportBundling: true,
      });

      await artifactGenerator.generate();
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;

      expect(fs.existsSync(`${outputDirectoryJavascript}/config`)).toBe(true);
      const packageOutput = fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString();
      expect(packageOutput.indexOf('"devDependencies":')).toBeGreaterThan(-1);
    });

    it('Should generate artifact without bundling', async () => {
      const outputDirectory = 'test/generated/ArtifactGenerator/no-bundling';
      del.sync([`${outputDirectory}/*`]);

      const artifactGenerator = new ArtifactGenerator({
        inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
        outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
        supportBundling: false,
      });

      await artifactGenerator.generate();
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;

      expect(fs.existsSync(`${outputDirectoryJavascript}/config`)).toBe(false);
      const packageOutput = fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString();
      expect(packageOutput.indexOf('"devDependencies",')).toEqual(-1);
    });
  });
});
