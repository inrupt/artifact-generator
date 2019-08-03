require('mock-local-storage');

const chai = require('chai').use(require('chai-as-promised'));
chai.use(require('chai-string'));

const { expect } = chai;
const fs = require('fs');
const del = require('del');

const ArtifactGenerator = require('./ArtifactGenerator');
const { ARTIFACT_DIRECTORY_JAVASCRIPT } = require('./FileGenerator');

describe('Artifact Generator', () => {
  describe('Processing vocab list file.', () => {
    const outputDirectory = 'test/generated';
    const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_JAVASCRIPT}`;

    beforeEach(() => {
      const deletedPaths = del.sync([`${outputDirectory}/*`]);
      console.log('Deleted files and folders:\n', deletedPaths.join('\n'));
    });

    function verifyVocabList() {
      expect(fs.existsSync(`${outputDirectoryJavascript}/index.js`)).to.be.true;
      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).to.be.true;

      expect(fs.existsSync(`${outputDirectoryJavascript}/GeneratedVocab/override-name.js`)).to.be
        .true;
      expect(fs.existsSync(`${outputDirectoryJavascript}/GeneratedVocab/schema-inrupt-ext.js`)).to
        .be.true;

      const indexOutput = fs.readFileSync(`${outputDirectoryJavascript}/index.js`).toString();
      expect(indexOutput).to.contain(
        "module.exports.SCHEMA_INRUPT_EXT = require('./GeneratedVocab/schema-inrupt-ext')"
      );

      const packageOutput = fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString();
      expect(packageOutput).to.contain('"name": "@lit/generated-vocab-common-TEST",');
    }

    it('should fail with non-existent vocab list file', async () => {
      const nonExistFile = ' nonsense file name';
      expect(new ArtifactGenerator({ vocabListFile: nonExistFile }).generate()).to.eventually.throw(
        nonExistFile
      );
    });

    it('should fail with invalid YAML vocab list file', async () => {
      const notYamlFile = './test/resources/vocabs/vocab-list.txt';
      expect(new ArtifactGenerator({ vocabListFile: notYamlFile }).generate()).to.eventually.throw(
        notYamlFile
      );
    });

    it('should generate artifact from vocab list file', async () => {
      const artifactGenerator = new ArtifactGenerator({
        vocabListFile: './test/resources/vocabs/vocab-list.yml',
        outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();
      verifyVocabList();
    });

    it('should generate artifact from vocab list file (with inquirer)', async () => {
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
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: '@lit/generated-vocab-',
        },
        inquirerProcess
      );

      await artifactGenerator.generate();
      expect(inquirerCalled).to.be.true;
      verifyVocabList();
    });
  });
});
