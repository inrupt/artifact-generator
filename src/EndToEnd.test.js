require('mock-local-storage');

const chai = require('chai').use(require('chai-as-promised'));

const { expect } = chai;

const fs = require('fs');
const del = require('del');

const ArtifactGenerator = require('./generator/ArtifactGenerator');
const { ARTIFACT_DIRECTORY_JAVASCRIPT } = require('./generator/FileGenerator');

const doNothingPromise = data => {
  return new Promise(resolve => {
    resolve(data);
  });
};

describe('Ontology Generator', () => {
  const outputDirectory = 'test/generated';
  const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_JAVASCRIPT}`;

  beforeEach(() => {
    const deletedPaths = del.sync([`${outputDirectory}/*`]);
    console.log('Deleted files and folders:\n', deletedPaths.join('\n'));
  });

  describe('Build node module artifacts', () => {
    it('should fail if no ontology file', async () => {
      const errorFilename = './test/resources/vocabs/does.not.exist.ttl';

      const artifactGenerator = new ArtifactGenerator(
        {
          input: [errorFilename],
          outputDirectory,
          artifactVersion: '1.0.0',
          litVocabTermVersion: '^1.0.10',
          noprompt: true,
        },
        doNothingPromise
      );

      await expect(artifactGenerator.generate()).to.be.rejectedWith(
        Error,
        "Failed to generate: Error: ENOENT: no such file or directory, open '././test/resources/vocabs/does.not.exist.ttl'"
      );
    });

    it('should fail if ontology file invalid', async () => {
      const errorFilename = './test/resources/vocabs/invalid-turtle.ttl';

      const artifactGenerator = new ArtifactGenerator({
        input: [errorFilename],
        outputDirectory,
        noprompt: true,
      });

      artifactGenerator
        .generate()
        .then(() => {
          throw new Error('Should fail!');
        })
        .catch(error => {
          expect(error).contains('Failed', errorFilename);
        });
    });

    it('should fail if ontology file has term from different namespace', async () => {
      const errorFilename = './test/resources/vocabs/mismatched-namespaces.ttl';

      const artifactGenerator = new ArtifactGenerator(
        {
          input: [errorFilename],
          outputDirectory,
          noprompt: true,
        },
        doNothingPromise
      );

      // TODO: Not sure the correct syntax to get this working - but should be something like this!
      // expect(() => artifactGenerator.generate).to.throw(
      //   'sampleTerm',
      //   'https://inrupt.net/vocab/different-IRI#',
      //   'https://inrupt.net/vocab/not-matching-preferred-namespace-IRI#',
      //   errorFilename
      // );

      artifactGenerator
        .generate()
        .then(() => {
          throw new Error('Should fail!');
        })
        .catch(error => {
          expect(error).contains(
            'sampleTerm',
            'https://inrupt.net/vocab/different-IRI#',
            'https://inrupt.net/vocab/not-matching-preferred-namespace-IRI#',
            errorFilename
          );
        });
    });

    it('should create from an ontology file', async () => {
      const artifactGenerator = new ArtifactGenerator(
        {
          input: ['./test/resources/vocabs/schema.ttl'],
          outputDirectory,
          artifactVersion: '1.0.0',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: 'lit-generated-vocab-',
          noprompt: true,
        },
        doNothingPromise
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavascript}/index.js`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectoryJavascript}/index.js`).toString()).to.equal(
        fs.readFileSync('test/resources/expectedOutputs/single/index.js').toString()
      );

      // Generated code contains timestamnp (which will change every time we generate!), so skip the first comment.
      const output = fs
        .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/schema.js`)
        .toString();
      const expected = fs
        .readFileSync('test/resources/expectedOutputs/single/GeneratedVocab/schema.js')
        .toString();
      expect(output.substring(output.indexOf(' */'))).to.equal(
        expected.substring(expected.indexOf(' */'))
      );

      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).to.equal(
        fs.readFileSync('test/resources/expectedOutputs/single/package.json').toString()
      );
    });

    it('should create from an ontology link', async () => {
      const artifactGenerator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavascript}/GeneratedVocab/schema.js`)).to.be.true;
      expect(
        fs.readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/schema.js`).toString()
      ).contains("Person: new LitVocabTerm(_NS('Person'), localStorage, true)");

      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).contains(
        '"name": "@lit/generated-vocab-schema"'
      );
    }).timeout(5000);

    it('should be able to fully extend an ontology with multiple input files', async () => {
      const artifactGenerator = new ArtifactGenerator({
        input: [
          './test/resources/vocabs/schema.ttl',
          './test/resources/vocabs/schema-inrupt-ext.ttl',
        ],
        outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: 'lit-generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();

      // Generated code contains timestamnp (which will change every time we generate!), so skip the first comment.
      const output = fs
        .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/schema-inrupt-ext.js`)
        .toString();
      const expected = fs
        .readFileSync('test/resources/expectedOutputs/full-ext/GeneratedVocab/schema-inrupt-ext.js')
        .toString();
      expect(output.substring(output.indexOf(' */'))).to.equal(
        expected.substring(expected.indexOf(' */'))
      );

      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).to.equal(
        fs.readFileSync('test/resources/expectedOutputs/full-ext/package.json').toString()
      );
    });

    it('should be able to fully extend an ontology with multiple input files and URL links', async () => {
      const artifactGenerator = new ArtifactGenerator({
        input: ['https://schema.org/Person.ttl', './test/resources/vocabs/schema-inrupt-ext.ttl'],
        outputDirectory,
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavascript}/index.js`)).to.be.true;

      const indexOutput = fs
        .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/schema-inrupt-ext.js`)
        .toString();

      expect(indexOutput).contains("Person: new LitVocabTerm(_NS('Person')");
      expect(indexOutput).contains("address: new LitVocabTerm(_NS('address')");
      expect(indexOutput).contains("additionalName: new LitVocabTerm(_NS('additionalName')");
      expect(indexOutput).contains(".addLabel('es', `Nombre adicional`)");
    }).timeout(5000);

    it('should be able to extend an ontology but only creates triples from extension file', async () => {
      const artifactGenerator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory,
        vocabTermsFrom: './test/resources/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();

      const indexOutput = fs
        .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/schema-inrupt-ext.js`)
        .toString();

      expect(indexOutput).contains("Person: new LitVocabTerm(_NS('Person')");
      expect(indexOutput).contains(".addLabel('en', `Person`)");
      expect(indexOutput).contains(".addLabel('fr', `La personne`)");

      expect(indexOutput).contains('additionalName: new LitVocabTerm');
      expect(indexOutput).contains('familyName: new LitVocabTerm');
      expect(indexOutput).contains('givenName: new LitVocabTerm');
      expect(indexOutput).contains(".addLabel('es', `Nombre de pila`)");
      expect(indexOutput).contains(".addLabel('it', `Nome di battesimo`)");

      expect(indexOutput).to.not.contains('address: new LitVocabTerm');
    }).timeout(5000);

    it('should be able to extend an ontology but only create triples from extension URL links', async () => {
      const artifactGenerator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory,
        vocabTermsFrom: 'https://jholleran.inrupt.net/public/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.0',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();

      const indexOutput = fs
        .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/schema.js`)
        .toString();

      expect(indexOutput).contains("Person: new LitVocabTerm(_NS('Person')");
      expect(indexOutput).contains(".addLabel('en', `Person`)");
      expect(indexOutput).contains(".addLabel('fr', `La personne`)");

      expect(indexOutput).contains('additionalName: new LitVocabTerm');
      expect(indexOutput).contains('familyName: new LitVocabTerm');
      expect(indexOutput).contains('givenName: new LitVocabTerm');
      expect(indexOutput).contains(".addLabel('es', `Nombre de pila`)");
      expect(indexOutput).contains(".addLabel('it', `Nome di battesimo`)");

      expect(indexOutput).to.not.contains('address: new LitVocabTerm');
    }).timeout(5000);

    it('should take in a version for the output module', async () => {
      const artifactGenerator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory,
        vocabTermsFrom: './test/resources/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).contains(
        '"version": "1.0.5"'
      );
    });

    it('should handle creating generated folder if it does not exist already', async () => {
      del.sync([outputDirectory]);

      const artifactGenerator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory,
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavascript}/index.js`)).to.be.true;
      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).to.be.true;
    });

    it('module names should by default start with @lit/generated-vocab-*', async () => {
      let artifactGenerator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory,
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();

      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).contains(
        '"name": "@lit/generated-vocab-schema",'
      );

      artifactGenerator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema-inrupt-ext.ttl'],
        outputDirectory,
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();

      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).contains(
        '"name": "@lit/generated-vocab-schema-inrupt-ext",'
      );
    });

    it('should add a description inside the package.json', async () => {
      const artifactGenerator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory,
        vocabTermsFrom: './test/resources/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();

      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).contains(
        '"description": "Extension to Schema.org terms providing multilingual alternative names and translations for ' +
          'comments (e.g. for use directly as labels or tool-tips in user interfaces or error messages)"'
      );
    });

    it('should add a authors inside the package.json', async () => {
      const artifactGenerator = new ArtifactGenerator({
        input: ['./test/resources/vocabs/schema.ttl'],
        outputDirectory,
        vocabTermsFrom: './test/resources/vocabs/schema-inrupt-ext.ttl',
        artifactVersion: '1.0.5',
        litVocabTermVersion: '^1.0.10',
        moduleNamePrefix: '@lit/generated-vocab-',
        noprompt: true,
      });

      await artifactGenerator.generate();

      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).contains(
        '"author": "Jarlath Holleran"'
      );
    });
  });
});
