'use strict'

const fs = require('fs')
const rdf = require('rdf-ext')

const gen = require('../generator.ts')

const chai = require('chai')
chai.use(require('chai-string'));
const expect = chai.expect


const del = require('del');


describe ('Ontology Generator', () => {

  beforeEach(() => {

    (async () => {
      const deletedPaths = await del(['generated/*']);
      console.log('Deleted files and folders:\n', deletedPaths.join('\n'));
    })();
  })

  describe ('Builds node modules artifacts', () => {
    it ('should create from an ontology file', async () => {
        var result = await gen.generate(['./test/vocabs/schema.ttl'], '1.0.0', undefined)
        expect(result).to.equal("Done!");


        expect(fs.existsSync('generated/index.ts')).to.be.true
        expect(fs.readFileSync('generated/index.ts').toString()).to.equal(
            fs.readFileSync('test/expected/single/index.ts').toString())

        expect(fs.existsSync('generated/package.json')).to.be.true
        expect(fs.readFileSync('generated/package.json').toString()).to.equal(
            fs.readFileSync('test/expected/single/package.json').toString())

    })

    it ('should create from an ontology link', () => {

    })


    it ('should be able to fully extend an ontology with multiple input files', async () => {
        var result = await gen.generate(['./test/vocabs/schema.ttl', './test/vocabs/schema-ext.ttl'], '1.0.0');
        expect(result).to.equal("Done!");


        expect(fs.existsSync('generated/index.ts')).to.be.true
        expect(fs.readFileSync('generated/index.ts').toString()).to.equal(
            fs.readFileSync('test/expected/full-ext/index.ts').toString())

        expect(fs.existsSync('generated/package.json')).to.be.true
        expect(fs.readFileSync('generated/package.json').toString()).to.equal(
        fs.readFileSync('test/expected/full-ext/package.json').toString())

    })

    it ('should be able to partial extend an ontology that only creates triples from extention file', async () => {
        var result = await gen.generate(['./test/vocabs/schema.ttl', './test/vocabs/schema-ext.ttl'], '1.0.0', './test/vocabs/schema-ext.ttl');
        expect(result).to.equal("Done!");


        expect(fs.existsSync('generated/index.ts')).to.be.true
        expect(fs.readFileSync('generated/index.ts').toString()).to.equal(
            fs.readFileSync('test/expected/partial-ext/index.ts').toString())

        expect(fs.existsSync('generated/package.json')).to.be.true
        expect(fs.readFileSync('generated/package.json').toString()).to.equal(
        fs.readFileSync('test/expected/partial-ext/package.json').toString())
    })

    it ('should take in a version for the output module', async () => {
        var result = await gen.generate(['./test/vocabs/schema.ttl'], '1.0.5', './test/vocabs/schema-ext.ttl');
        expect(result).to.equal("Done!");

        expect(fs.existsSync('generated/package.json')).to.be.true
        expect(fs.readFileSync('generated/package.json').toString()).to.contains('"version": "1.0.5"')
    })
  })
})
