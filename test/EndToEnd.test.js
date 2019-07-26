'use strict';

require('mock-local-storage');

const chai = require('chai').use(require('chai-as-promised'));
chai.use(require('chai-string'));
const expect = chai.expect;

const fs = require('fs');

const del = require('del');

const ArtifactGenerator = require('../src/generator/ArtifactGenerator');

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
      const errorFilename = './test/resources/vocabs/does.not.exist.ttl';

      const generator = new ArtifactGenerator(
        {
          input: [errorFilename],
          outputDirectory: outputDirectory,
          artifactVersion: '1.0.0',
          litVocabTermVersion: '^1.0.10',
          noprompt: true,
        },
        doNothingPromise
      );

      await expect(generator.generate()).to.be.rejectedWith(
        Error,
        "Failed to generate: Error: ENOENT: no such file or directory, open '././test/resources/vocabs/does.not.exist.ttl'"
      );
    });

    it('should fail if ontology file invalid', async () => {
      const errorFilename = './test/resources/vocabs/invalid-turtle.ttl';

      const generator = new ArtifactGenerator({
        input: [errorFilename],
        outputDirectory: outputDirectory,
        noprompt: true,
      });

      generator
        .generate()
        .then(() => {
          throw new Error('Should fail!');
        })
        .catch(error => {
          expect(error).to.contain('Failed', errorFilename);
        });
    });

    it('should fail if ontology file has term from different namespace', async () => {
      const errorFilename = './test/resources/vocabs/mismatched-namespaces.ttl';

      const generator = new ArtifactGenerator(
        {
          input: [errorFilename],
          outputDirectory: outputDirectory,
          noprompt: true,
        },
        doNothingPromise
      );

      generator
        .generate()
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
      const generator = new ArtifactGenerator(
        {
          input: ['./test/resources/vocabs/schema.ttl'],
          outputDirectory: outputDirectory,
          artifactVersion: '1.0.0',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: 'lit-generated-vocab-',
          noprompt: true,
        },
        doNothingPromise
      );

      await generator.generate();

      expect(fs.existsSync(`${outputDirectory}/index.js`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/index.js`).toString()).to.equal(
        fs.readFileSync('test/resources/expectedOutputs/single/index.js').toString()
      );

      expect(fs.readFileSync(`${outputDirectory}/Generated/schema.js`).toString()).to.equal(
        fs.readFileSync('test/resources/expectedOutputs/single/Generated/schema.js').toString()
      );

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.equal(
        fs.readFileSync('test/resources/expectedOutputs/single/package.json').toString()
      );
    });

    it('should create from an ontology link', async () => {
      const generator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await generator.generate();

      expect(fs.existsSync(`${outputDirectory}/Generated/schema.js`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/Generated/schema.js`).toString()).to.contains(
        "Person: new LitVocabTerm(_NS('Person'), localStorage, true)"
      );

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"name": "@lit/generated-vocab-schema"'
      );
    }).timeout(5000);

    it('should be able to fully extend an ontology with multiple input files', async () => {
      const generator = new ArtifactGenerator({
        input: [
          './test/resources/vocabs/schema.ttl',
          './test/resources/vocabs/schema-inrupt-ext.ttl',
        ],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: 'lit-generated-vocab-',
        noprompt: true,
      });

      await generator.generate();

      expect(
        fs.readFileSync(`${outputDirectory}/Generated/schema-inrupt-ext.js`).toString()
      ).to.equal(
        fs
          .readFileSync('test/resources/expectedOutputs/full-ext/Generated/schema-inrupt-ext.js')
          .toString()
      );

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.equal(
        fs.readFileSync('test/resources/expectedOutputs/full-ext/package.json').toString()
      );
    });

    it('should be able to fully extend an ontology with multiple input files and URL links', async () => {
      const generator = new ArtifactGenerator({
        input: ['https://schema.org/Person.ttl', './test/resources/vocabs/schema-inrupt-ext.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await generator.generate();

      expect(fs.existsSync(`${outputDirectory}/index.js`)).to.be.true;

      var indexOutput = fs
        .readFileSync(`${outputDirectory}/Generated/schema-inrupt-ext.js`)
        .toString();

      expect(indexOutput).to.contains("Person: new LitVocabTerm(_NS('Person')");
      expect(indexOutput).to.contains("address: new LitVocabTerm(_NS('address')");
      expect(indexOutput).to.contains("additionalName: new LitVocabTerm(_NS('additionalName')");
      expect(indexOutput).to.contains(".addLabel('es', `Nombre adicional`)");
    }).timeout(5000);

    it('should be able to extend an ontology but only creates triples from extension file', async () => {
      const generator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        vocabTermsFrom: './test/resources/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await generator.generate();

      var indexOutput = fs
        .readFileSync(`${outputDirectory}/Generated/schema-inrupt-ext.js`)
        .toString();

      expect(indexOutput).to.contains("Person: new LitVocabTerm(_NS('Person')");
      expect(indexOutput).to.contains(".addLabel('en', `Person`)");
      expect(indexOutput).to.contains(".addLabel('fr', `La personne`)");

      expect(indexOutput).to.contains('additionalName: new LitVocabTerm');
      expect(indexOutput).to.contains('familyName: new LitVocabTerm');
      expect(indexOutput).to.contains('givenName: new LitVocabTerm');
      expect(indexOutput).to.contains(".addLabel('es', `Nombre de pila`)");
      expect(indexOutput).to.contains(".addLabel('it', `Nome di battesimo`)");

      expect(indexOutput).to.not.contains('address: new LitVocabTerm');
    }).timeout(5000);

    it('should be able to extend an ontology but only create triples from extension URL links', async () => {
      const generator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        vocabTermsFrom: 'https://jholleran.inrupt.net/public/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await generator.generate();

      var indexOutput = fs.readFileSync(`${outputDirectory}/Generated/schema.js`).toString();

      expect(indexOutput).to.contains("Person: new LitVocabTerm(_NS('Person')");
      expect(indexOutput).to.contains(".addLabel('en', `Person`)");
      expect(indexOutput).to.contains(".addLabel('fr', `La personne`)");

      expect(indexOutput).to.contains('additionalName: new LitVocabTerm');
      expect(indexOutput).to.contains('familyName: new LitVocabTerm');
      expect(indexOutput).to.contains('givenName: new LitVocabTerm');
      expect(indexOutput).to.contains(".addLabel('es', `Nombre de pila`)");
      expect(indexOutput).to.contains(".addLabel('it', `Nome di battesimo`)");

      expect(indexOutput).to.not.contains('address: new LitVocabTerm');
    }).timeout(5000);

    it('should take in a version for the output module', async () => {
      const generator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        vocabTermsFrom: './test/resources/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await generator.generate();

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"version": "1.0.5"'
      );
    });

    it('should handle creating generated folder if it does not exist already', async () => {
      del.sync([outputDirectory]);

      const generator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await generator.generate();

      expect(fs.existsSync(`${outputDirectory}/index.js`)).to.be.true;
      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
    });

    it('module names should by default start with @lit/generated-vocab-*', async () => {
      let generator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await generator.generate();

      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"name": "@lit/generated-vocab-schema",'
      );

      generator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema-inrupt-ext.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await generator.generate();

      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"name": "@lit/generated-vocab-schema-inrupt-ext",'
      );
    });

    it('should add a description inside the package.json', async () => {
      const generator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        vocabTermsFrom: './test/resources/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await generator.generate();

      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"description": "Extension to Schema.org terms providing multilingual alternative names and translations for ' +
          'comments (e.g. for use directly as labels or tool-tips in user interfaces or error messages)"'
      );
    });

    it('should add a author inside the package.json', async () => {
      const generator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        vocabTermsFrom: './test/resources/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await generator.generate();

      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"author": "Jarlath Holleran"'
      );
    });
  });
});
