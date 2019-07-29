'use strict';

require('mock-local-storage');

const chai = require('chai').use(require('chai-as-promised'));
chai.use(require('chai-string'));
const expect = chai.expect;

const fs = require('fs');

const del = require('del');
const ArtifactGenerator = require('../../src/generator/ArtifactGenerator');

describe('Artifact Generator', () => {
  describe('Processing vocab list file...', () => {
    it('should ignore comments and empty lines', () => {
      expect(ArtifactGenerator.extractLinesWithDetails('')).to.be.empty;
      expect(ArtifactGenerator.extractLinesWithDetails('\n\n\n')).to.be.empty;
      expect(ArtifactGenerator.extractLinesWithDetails('     ')).to.be.empty;
      expect(ArtifactGenerator.extractLinesWithDetails('#')).to.be.empty;
      expect(ArtifactGenerator.extractLinesWithDetails('   #')).to.be.empty;
      expect(ArtifactGenerator.extractLinesWithDetails('   # Comment...')).to.be.empty;
    });

    it('should tokenize list of input files', () => {
      const x = ArtifactGenerator.extractLinesWithDetails('file1.txt file2.txt', 1, 'inputFile');

      expect(
        ArtifactGenerator.extractLinesWithDetails('file1.txt file2.txt', 1, 'inputFile')[0]
      ).to.deep.equal({ inputFiles: ['file1.txt', 'file2.txt'], lineNumber: 1 });

      expect(
        ArtifactGenerator.extractLinesWithDetails(
          '   file1.txt    file2.txt    ',
          1,
          'inputFile'
        )[0]
      ).to.deep.equal({ inputFiles: ['file1.txt', 'file2.txt'], lineNumber: 1 });
    });

    it('should fail if no valid selection file', () => {
      expect(() => ArtifactGenerator.extractLinesWithDetails('[]', 1, 'inputFile')).to.throw(
        'Invalid term selection file',
        'empty term selection filename'
      );
      expect(() => ArtifactGenerator.extractLinesWithDetails(' [ ] ', 1, 'inputFile')).to.throw(
        'Invalid term selection file',
        'empty term selection filename'
      );
      expect(() =>
        ArtifactGenerator.extractLinesWithDetails('file1 file2 [ ] ', 1, 'inputFile')
      ).to.throw('Invalid term selection file', 'empty term selection filename');
    });

    it('should fail if valid selection file, but no inputs', () => {
      expect(() => ArtifactGenerator.extractLinesWithDetails(' [file] ', 1, 'inputFile')).to.throw(
        'Invalid term selection file',
        '[file]',
        'no input files'
      );
      expect(() => ArtifactGenerator.extractLinesWithDetails(' [ file] ', 1, 'inputFile')).to.throw(
        'Invalid term selection file',
        '[file]',
        'no input files'
      );
      expect(() => ArtifactGenerator.extractLinesWithDetails(' [file ] ', 1, 'inputFile')).to.throw(
        'Invalid term selection file',
        '[file]',
        'no input files'
      );
      expect(() =>
        ArtifactGenerator.extractLinesWithDetails(' [ file ] ', 1, 'inputFile')
      ).to.throw('Invalid term selection file', '[file]', 'no input files');
    });

    it('should fail if validly delimited selection file', () => {
      expect(() =>
        ArtifactGenerator.extractLinesWithDetails(' file1 file2 ] ', 1, 'inputFile')
      ).to.throw(
        'Invalid term selection file',
        '[file]',
        'incorrectly specified term selection filename'
      );
    });

    it('should tokenize list of input files and selection file', () => {
      expect(
        ArtifactGenerator.extractLinesWithDetails('file1.txt file2.txt [x]', 1, 'inputFile')[0]
      ).to.deep.equal({
        inputFiles: ['file1.txt', 'file2.txt'],
        selectTermsFromFile: 'x',
        lineNumber: 1,
      });

      expect(
        ArtifactGenerator.extractLinesWithDetails('file1.txt file2.txt [file3]', 1, 'inputFile')[0]
      ).to.deep.equal({
        inputFiles: ['file1.txt', 'file2.txt'],
        selectTermsFromFile: 'file3',
        lineNumber: 1,
      });

      expect(
        ArtifactGenerator.extractLinesWithDetails(
          '   file1.txt    file2.txt  [     file3 ]  ',
          1,
          'inputFile'
        )[0]
      ).to.deep.equal({
        inputFiles: ['file1.txt', 'file2.txt'],
        selectTermsFromFile: 'file3',
        lineNumber: 1,
      });

      expect(
        ArtifactGenerator.extractLinesWithDetails(
          '   file1.txt    file2.txt  [     file3]  ',
          1,
          'inputFile'
        )[0]
      ).to.deep.equal({
        inputFiles: ['file1.txt', 'file2.txt'],
        selectTermsFromFile: 'file3',
        lineNumber: 1,
      });

      expect(
        ArtifactGenerator.extractLinesWithDetails(
          '   file1.txt    file2.txt  [file3 ]  ',
          1,
          'inputFile'
        )[0]
      ).to.deep.equal({
        inputFiles: ['file1.txt', 'file2.txt'],
        selectTermsFromFile: 'file3',
        lineNumber: 1,
      });

      expect(
        ArtifactGenerator.extractLinesWithDetails(
          '   file1.txt    file2.txt  [file3 ]  ',
          1,
          'inputFile'
        )[0]
      ).to.deep.equal({
        inputFiles: ['file1.txt', 'file2.txt'],
        selectTermsFromFile: 'file3',
        lineNumber: 1,
      });
    });
  });

  describe('Processing valid vocab list file.', () => {
    const outputDirectory = 'generated';

    beforeEach(() => {
      (async () => {
        const deletedPaths = await del([`${outputDirectory}/*`]);
        console.log('Deleted files and folders:\n', deletedPaths.join('\n'));
      })();
    });

    it('should generate artifact from vocab list file', async () => {
      const artifactGenerator = new ArtifactGenerator({
        vocabListFile: './test/resources/vocabs/vocab-list.txt',
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectory}/index.js`)).to.be.true;
      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;

      expect(fs.existsSync(`${outputDirectory}/Generated/lit_gen.js`)).to.be.true;
      expect(fs.existsSync(`${outputDirectory}/Generated/schema-inrupt-ext.js`)).to.be.true;

      const indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();
      expect(indexOutput).to.contains(
        "module.exports.SCHEMA_INRUPT_EXT = require('./Generated/schema-inrupt-ext')"
      );
    });

    it('should generate artifact from vocab list file', async () => {
      let inquirerCalled = false;
      const inquirerProcess = data => {
        return new Promise((resolve, reject) => {
          inquirerCalled = true;
          resolve(data);
        });
      };

      const artifactGenerator = new ArtifactGenerator(
        {
          vocabListFile: './test/resources/vocabs/vocab-list.txt',
          outputDirectory: outputDirectory,
          artifactVersion: '1.0.0',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        },
        inquirerProcess
      );

      await artifactGenerator.generate();

      expect(inquirerCalled).to.be.true;

      expect(fs.existsSync(`${outputDirectory}/index.js`)).to.be.true;
      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;

      expect(fs.existsSync(`${outputDirectory}/Generated/lit_gen.js`)).to.be.true;
      expect(fs.existsSync(`${outputDirectory}/Generated/schema-inrupt-ext.js`)).to.be.true;

      const indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();
      expect(indexOutput).to.contains(
        "module.exports.SCHEMA_INRUPT_EXT = require('./Generated/schema-inrupt-ext')"
      );
    });
  });
});
