'use strict';

const fs = require('fs');
const rdf = require('rdf-ext');

const gen = require('../src/generator.js');

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;

const del = require('del');

describe('Ontology Generator', () => {
  beforeEach(() => {
    (async () => {
      const deletedPaths = await del(['generated/*']);
      console.log('Deleted files and folders:\n', deletedPaths.join('\n'));
    })();
  });

  describe('Builds node modules artifacts', () => {
    it('should create from an ontology file', async () => {
      var result = await gen.generate(
        ['./test/vocabs/schema.ttl'],
        '1.0.0',
        undefined
      );
      expect(result).to.equal('Done!');

      expect(fs.existsSync('generated/index.ts')).to.be.true;
      expect(fs.readFileSync('generated/index.ts').toString()).to.equal(
        fs.readFileSync('test/expected/single/index.ts').toString()
      );

      expect(fs.existsSync('generated/package.json')).to.be.true;
      expect(fs.readFileSync('generated/package.json').toString()).to.equal(
        fs.readFileSync('test/expected/single/package.json').toString()
      );
    });

    it('should create from an ontology link', async () => {
      var result = await gen.generate(
        ['https://schema.org/Person.ttl'],
        '1.0.0',
        undefined
      );
      expect(result).to.equal('Done!');

      expect(fs.existsSync('generated/index.ts')).to.be.true;
      expect(fs.readFileSync('generated/index.ts').toString()).to.contains(
        "Person: new LitVocabTerm(_NS('Person'), undefined, true)"
      );

      expect(fs.existsSync('generated/package.json')).to.be.true;
      expect(fs.readFileSync('generated/package.json').toString()).to.contains(
        '"name": "schema-inrupt-ext"'
      );
    }).timeout(5000);

    it('should be able to fully extend an ontology with multiple input files', async () => {
      var result = await gen.generate(
        ['./test/vocabs/schema.ttl', './test/vocabs/schema-inrupt-ext.ttl'],
        '1.0.0'
      );
      expect(result).to.equal('Done!');

      expect(fs.existsSync('generated/index.ts')).to.be.true;
      expect(fs.readFileSync('generated/index.ts').toString()).to.equal(
        fs.readFileSync('test/expected/full-ext/index.ts').toString()
      );

      expect(fs.existsSync('generated/package.json')).to.be.true;
      expect(fs.readFileSync('generated/package.json').toString()).to.equal(
        fs.readFileSync('test/expected/full-ext/package.json').toString()
      );
    });

    it('should be able to fully extend an ontology with multiple input files and URL links', async () => {
      var result = await gen.generate(
        [
          'https://schema.org/Person.ttl',
          './test/vocabs/schema-inrupt-ext.ttl',
        ],
        '1.0.0'
      );
      expect(result).to.equal('Done!');

      expect(fs.existsSync('generated/index.ts')).to.be.true;

      var indexOutput = fs.readFileSync('generated/index.ts').toString();

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
      var result = await gen.generate(
        ['./test/vocabs/schema.ttl'],
        '1.0.0',
        './test/vocabs/schema-inrupt-ext.ttl'
      );
      expect(result).to.equal('Done!');

      var indexOutput = fs.readFileSync('generated/index.ts').toString();

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
      var result = await gen.generate(
        ['./test/vocabs/schema.ttl'],
        '1.0.0',
        'https://jholleran.inrupt.net/public/vocabs/schema-inrupt-ext.ttl'
      );
      expect(result).to.equal('Done!');

      var indexOutput = fs.readFileSync('generated/index.ts').toString();

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
      var result = await gen.generate(
        ['./test/vocabs/schema.ttl'],
        '1.0.5',
        './test/vocabs/schema-inrupt-ext.ttl'
      );
      expect(result).to.equal('Done!');

      expect(fs.existsSync('generated/package.json')).to.be.true;
      expect(fs.readFileSync('generated/package.json').toString()).to.contains(
        '"version": "1.0.5"'
      );
    });

    it('should handle creating generated folder if it does not exist already', async () => {
      del.sync(['generated']);

      var result = await gen.generate(
        ['./test/vocabs/schema.ttl'],
        '1.0.0',
        undefined
      );
      expect(result).to.equal('Done!');
      expect(fs.existsSync('generated/index.ts')).to.be.true;
      expect(fs.existsSync('generated/package.json')).to.be.true;
    });
  });
});
