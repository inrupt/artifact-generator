'use strict';

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;

const fs = require('fs');

const del = require('del');

const Generator = require('../src/generator');

describe('Ontology Generator', () => {
  const outputDirectory = 'generated'

  beforeEach(() => {
    (async () => {
      const deletedPaths = await del([`${outputDirectory}/*`]);
      console.log('Deleted files and folders:\n', deletedPaths.join('\n'));
    })();
  });

  describe('Builds node modules artifacts', () => {
    it('should create from an ontology file', async () => {
      const generator = new Generator( {
        'input': ['./test/vocabs/schema.ttl'],
        'outputDirectory': outputDirectory,
        'artifactVersion': '1.0.0' }
      );

      const result = await generator.generate();
      expect(result).to.equal('Done!');

      expect(fs.existsSync(`${outputDirectory}/index.ts`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/index.ts`).toString()).to.equal(
        fs.readFileSync('test/expected/single/index.ts').toString()
      );

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.equal(
        fs.readFileSync('test/expected/single/package.json').toString()
      );
    });

    it('should create from an ontology link', async () => {
      const generator = new Generator( {
        'input': ['./test/vocabs/schema.ttl'],
        'outputDirectory': outputDirectory,
        'artifactVersion': '1.0.0' }
      );

      const result = await generator.generate();
      expect(result).to.equal('Done!');

      expect(fs.existsSync(`${outputDirectory}/index.ts`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/index.ts`).toString()).to.contains(
        "Person: new LitVocabTerm(_NS('Person'), undefined, true)"
      );

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"name": "schema-inrupt-ext"'
      );
    }).timeout(5000);

    it('should be able to fully extend an ontology with multiple input files', async () => {
      const generator = new Generator( {
        'input': [
          './test/vocabs/schema.ttl',
          './test/vocabs/schema-inrupt-ext.ttl',
        ],
        'outputDirectory': outputDirectory,
        'artifactVersion': '1.0.0' }
      );

      var result = await generator.generate();
      expect(result).to.equal('Done!');

      expect(fs.existsSync(`${outputDirectory}/index.ts`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/index.ts`).toString()).to.equal(
        fs.readFileSync('test/expected/full-ext/index.ts').toString()
      );

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.equal(
        fs.readFileSync('test/expected/full-ext/package.json').toString()
      );
    });

    it('should be able to fully extend an ontology with multiple input files and URL links', async () => {
      const generator = new Generator( {
        'input': [
          'https://schema.org/Person.ttl',
          './test/vocabs/schema-inrupt-ext.ttl',
        ],
        'outputDirectory': outputDirectory,
        'artifactVersion': '1.0.0' }
      );


      var result = await generator.generate();
      expect(result).to.equal('Done!');

      expect(fs.existsSync(`${outputDirectory}/index.ts`)).to.be.true;

      var indexOutput = fs.readFileSync(`${outputDirectory}/index.ts`).toString();

      expect(indexOutput).to.contains("Person: new LitVocabTerm(_NS('Person')");
      expect(indexOutput).to.contains(
        "address: new LitVocabTerm(_NS('address')"
      );
      expect(indexOutput).to.contains(
        "additionalName: new LitVocabTerm(_NS('additionalName')"
      );
      expect(indexOutput).to.contains(".addLabel('es', 'Nombre adicional')");
    }).timeout(5000);

    it('should be able to extend an ontology but only creates triples from extention file', async () => {
      const generator = new Generator( {
        'input': ['./test/vocabs/schema.ttl'],
        'outputDirectory': outputDirectory,
        'vocabTermsFrom': './test/vocabs/schema-inrupt-ext.ttl',
        'artifactVersion': '1.0.0' }
      );

      var result = await generator.generate();
      expect(result).to.equal('Done!');

      var indexOutput = fs.readFileSync(`${outputDirectory}/index.ts`).toString();

      expect(indexOutput).to.contains("Person: new LitVocabTerm(_NS('Person')");
      expect(indexOutput).to.contains(".addLabel('en', 'Person')");
      expect(indexOutput).to.contains(".addLabel('fr', 'La personne')");

      expect(indexOutput).to.contains('additionalName: new LitVocabTerm');
      expect(indexOutput).to.contains('familyName: new LitVocabTerm');
      expect(indexOutput).to.contains('givenName: new LitVocabTerm');
      expect(indexOutput).to.contains(".addLabel('es', 'Nombre de pila')");
      expect(indexOutput).to.contains(".addLabel('it', 'Nome di battesimo')");

      expect(indexOutput).to.not.contains('address: new LitVocabTerm');
    });

    it('should be able to extend an ontology but only create triples from extention URL links', async () => {
      const generator = new Generator( {
        'input': ['./test/vocabs/schema.ttl'],
        'outputDirectory': outputDirectory,
        'vocabTermsFrom': 'https://jholleran.inrupt.net/public/vocabs/schema-inrupt-ext.ttl',
        'artifactVersion': '1.0.0' }
      );

      var result = await generator.generate();
      expect(result).to.equal('Done!');

      var indexOutput = fs.readFileSync(`${outputDirectory}/index.ts`).toString();

      expect(indexOutput).to.contains("Person: new LitVocabTerm(_NS('Person')");
      expect(indexOutput).to.contains(".addLabel('en', 'Person')");
      expect(indexOutput).to.contains(".addLabel('fr', 'La personne')");

      expect(indexOutput).to.contains('additionalName: new LitVocabTerm');
      expect(indexOutput).to.contains('familyName: new LitVocabTerm');
      expect(indexOutput).to.contains('givenName: new LitVocabTerm');
      expect(indexOutput).to.contains(".addLabel('es', 'Nombre de pila')");
      expect(indexOutput).to.contains(".addLabel('it', 'Nome di battesimo')");

      expect(indexOutput).to.not.contains('address: new LitVocabTerm');
    });

    it('should take in a version for the output module', async () => {
      const generator = new Generator( {
        'input': ['./test/vocabs/schema.ttl'],
        'outputDirectory': outputDirectory,
        'vocabTermsFrom': './test/vocabs/schema-inrupt-ext.ttl',
        'artifactVersion': '1.0.5' }
      );

      var result = await generator.generate();
      expect(result).to.equal('Done!');

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.contains(
        '"version": "1.0.5"'
      );
    });

    it('should handle creating generated folder if it does not exist already', async () => {
      del.sync([outputDirectory]);

      const generator = new Generator( {
        'input': ['./test/vocabs/schema.ttl'],
        'outputDirectory': outputDirectory,
        'artifactVersion': '1.0.5' }
      );

      var result = await generator.generate();
      expect(result).to.equal('Done!');

      expect(fs.existsSync(`${outputDirectory}/index.ts`)).to.be.true;
      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
    });
  });
});
