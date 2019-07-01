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
        var result = await gen.generate(['./test/vocabs/schema.ttl'], '1.0.0')
        expect(result).to.equal("Done!");


        expect(fs.existsSync('generated/index.ts')).to.be.true
        expect(fs.readFileSync('generated/index.ts').toString()).to.equal(
            fs.readFileSync('test/expected/index.ts').toString())

        expect(fs.existsSync('generated/package.json')).to.be.true
        expect(fs.readFileSync('generated/package.json').toString()).to.equal(
            fs.readFileSync('test/expected/package.json').toString())
    })

    it ('should create from an ontology link', () => {

    })


    it ('should be able to fully extend an ontology with multiple input files', async () => {

    })

    it ('should be able to partial extend an ontology that only creates triples from extention file', () => {

    })

    it ('should take in a version for the output module', () => {

    })
})


})
