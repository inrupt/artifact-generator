'use strict';

require('mock-local-storage');

const chai = require('chai').use(require('chai-as-promised'));
chai.use(require('chai-string'));
const expect = chai.expect;

const fs = require('fs');

const del = require('del');
const ArtifactGenerator = require('../../src/generator/ArtifactGenerator');

describe('Artifact Generator', () => {
  describe('Processing vocab list file.', () => {
    const outputDirectory = 'generated';

    beforeEach(() => {
      (async () => {
        const deletedPaths = await del([`${outputDirectory}/*`]);
        console.log('Deleted files and folders:\n', deletedPaths.join('\n'));
      })();
    });

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
        outputDirectory: outputDirectory,
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
          outputDirectory: outputDirectory,
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

    function verifyVocabList() {
      expect(fs.existsSync(`${outputDirectory}/index.js`)).to.be.true;
      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;

      expect(fs.existsSync(`${outputDirectory}/Generated/lit_gen.js`)).to.be.true;
      // expect(fs.existsSync(`${outputDirectory}/Generated/schema-inrupt-ext.js`)).to.be.true;
      expect(fs.existsSync(`${outputDirectory}/Generated/schema.js`)).to.be.true;

      const indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();
      expect(indexOutput).to.contains(
        // "module.exports.SCHEMA_INRUPT_EXT = require('./Generated/schema-inrupt-ext')"
        "module.exports.SCHEMA = require('./Generated/schema')"
      );
    }
  });
});
