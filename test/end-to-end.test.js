'use strict';

require('mock-local-storage');

const chai = require('chai').use(require('chai-as-promised'));
chai.use(require('chai-string'));
const expect = chai.expect;

const fs = require('fs');

const del = require('del');

const Generator = require('../src/generator');

const doNothingPromise = data => {
  return new Promise((resolve, reject) => {
    resolve(data);
  });
};

describe('Ontology Generator', () => {
  const outputDirectory = 'generated';

  beforeEach(() => {
    (async () => {
      const deletedPaths = await del([`${outputDirectory}/*`]);
      console.log('Deleted files and folders:\n', deletedPaths.join('\n'));
    })();
  });

  describe('Builds node modules artifacts', () => {
    it('should fail if no ontology file', async () => {
      const errorFilename = './test/vocabs/does.not.exist.ttl';

      const generator = new Generator({
        input: [errorFilename],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
      });

      await expect(generator.generate(doNothingPromise)).to.be.rejectedWith(
        Error,
        "Failed to generate: Error: ENOENT: no such file or directory, open './test/vocabs/does.not.exist.ttl'"
      );
    });

    it('should fail if ontology file invalid', async () => {
      const errorFilename = './test/vocabs/invalid-turtle.ttl';

      const generator = new Generator({
        input: [errorFilename],
        outputDirectory: outputDirectory,
      });

      generator
        .generate(doNothingPromise)
        .then(() => {
          throw new Error('Should fail!');
        })
        .catch(error => {
          expect(error).to.contain('Failed', errorFilename);
        });
    });

    it('should fail if ontology file has term from different namespace', async () => {
      const errorFilename = './test/vocabs/mismatched-namespaces.ttl';

      const generator = new Generator({
        input: [errorFilename],
        outputDirectory: outputDirectory,
      });

      generator
        .generate(doNothingPromise)
        .then(() => {
          throw new Error('Should fail!');
        })
        .catch(error => {
          expect(error).to.contain(
            'sampleTerm',
            'https://inrupt.net/vocab/different-IRI#',
            'https://inrupt.net/vocab/not-matching-preferred-namespace-IRI#',
            errorFilename
          );
        });
    });

    it('should create from an ontology file', async () => {
      const generator = new Generator({
        input: ['./test/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: 'lit-generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      expect(fs.existsSync(`${outputDirectory}/index.js`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/index.js`).toString()).to.equal(
        fs.readFileSync('test/expected/single/index.js').toString()
      );

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.equal(
        fs.readFileSync('test/expected/single/package.json').toString()
      );
    });

    it('should create from an ontology link', async () => {
      const generator = new Generator({
        input: ['./test/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      expect(fs.existsSync(`${outputDirectory}/index.js`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/index.js`).toString()).to.contains(
        "Person: new LitVocabTerm(_NS('Person'), localStorage, true)"
      );

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"name": "@lit/generated-vocab-schema"'
      );
    }).timeout(5000);

    it('should be able to fully extend an ontology with multiple input files', async () => {
      const generator = new Generator({
        input: ['./test/vocabs/schema.ttl', './test/vocabs/schema-inrupt-ext.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: 'lit-generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      expect(fs.existsSync(`${outputDirectory}/index.js`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/index.js`).toString()).to.equal(
        fs.readFileSync('test/expected/full-ext/index.js').toString()
      );

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.equal(
        fs.readFileSync('test/expected/full-ext/package.json').toString()
      );
    });

    it('should be able to fully extend an ontology with multiple input files and URL links', async () => {
      const generator = new Generator({
        input: ['https://schema.org/Person.ttl', './test/vocabs/schema-inrupt-ext.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      expect(fs.existsSync(`${outputDirectory}/index.js`)).to.be.true;

      var indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();

      expect(indexOutput).to.contains("Person: new LitVocabTerm(_NS('Person')");
      expect(indexOutput).to.contains("address: new LitVocabTerm(_NS('address')");
      expect(indexOutput).to.contains("additionalName: new LitVocabTerm(_NS('additionalName')");
      expect(indexOutput).to.contains(".addLabel('es', 'Nombre adicional')");
    }).timeout(5000);

    it('should be able to extend an ontology but only creates triples from extention file', async () => {
      const generator = new Generator({
        input: ['./test/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        vocabTermsFrom: './test/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      var indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();

      expect(indexOutput).to.contains("Person: new LitVocabTerm(_NS('Person')");
      expect(indexOutput).to.contains(".addLabel('en', 'Person')");
      expect(indexOutput).to.contains(".addLabel('fr', 'La personne')");

      expect(indexOutput).to.contains('additionalName: new LitVocabTerm');
      expect(indexOutput).to.contains('familyName: new LitVocabTerm');
      expect(indexOutput).to.contains('givenName: new LitVocabTerm');
      expect(indexOutput).to.contains(".addLabel('es', 'Nombre de pila')");
      expect(indexOutput).to.contains(".addLabel('it', 'Nome di battesimo')");

      expect(indexOutput).to.not.contains('address: new LitVocabTerm');
    }).timeout(5000);

    it('should be able to extend an ontology but only create triples from extention URL links', async () => {
      const generator = new Generator({
        input: ['./test/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        vocabTermsFrom: 'https://jholleran.inrupt.net/public/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      var indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();

      expect(indexOutput).to.contains("Person: new LitVocabTerm(_NS('Person')");
      expect(indexOutput).to.contains(".addLabel('en', 'Person')");
      expect(indexOutput).to.contains(".addLabel('fr', 'La personne')");

      expect(indexOutput).to.contains('additionalName: new LitVocabTerm');
      expect(indexOutput).to.contains('familyName: new LitVocabTerm');
      expect(indexOutput).to.contains('givenName: new LitVocabTerm');
      expect(indexOutput).to.contains(".addLabel('es', 'Nombre de pila')");
      expect(indexOutput).to.contains(".addLabel('it', 'Nome di battesimo')");

      expect(indexOutput).to.not.contains('address: new LitVocabTerm');
    }).timeout(5000);

    it('should take in a version for the output module', async () => {
      const generator = new Generator({
        input: ['./test/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        vocabTermsFrom: './test/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"version": "1.0.5"'
      );
    });

    it('should handle creating generated folder if it does not exist already', async () => {
      del.sync([outputDirectory]);

      const generator = new Generator({
        input: ['./test/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      expect(fs.existsSync(`${outputDirectory}/index.js`)).to.be.true;
      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
    });

    it('module names should by default start with @lit/generated-vocab-*', async () => {
      let generator = new Generator({
        input: ['./test/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"name": "@lit/generated-vocab-schema",'
      );

      generator = new Generator({
        input: ['./test/vocabs/schema-inrupt-ext.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"name": "@lit/generated-vocab-schema-inrupt-ext",'
      );
    });

    it('should add a description inside the package.json', async () => {
      const generator = new Generator({
        input: ['./test/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        vocabTermsFrom: './test/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"description": "Extension to Schema.org terms providing multilingual alternative names and translations for ' +
          'comments (e.g. for use directly as labels or tool-tips in user interfaces or error messages)"'
      );
    });

    it('should add a author inside the package.json', async () => {
      const generator = new Generator({
        input: ['./test/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        vocabTermsFrom: './test/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"author": "Jarlath Holleran"'
      );
    });
  });
});
