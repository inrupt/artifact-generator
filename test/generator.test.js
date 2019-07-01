'use strict'

const rdf = require('rdf-ext')

const { RDF, RDFS, SCHEMA } = require('vocab-lit')

const gen = require('../generator.ts')

const chai = require('chai')
chai.use(require('chai-string'));
const expect = chai.expect



// const person = rdf.namedNode('http://schema.org/Person')
// const givenName = rdf.namedNode('http://schema.org/givenName')
// const familyName = rdf.namedNode('http://schema.org/familyName')

const dataset = rdf.dataset().addAll([
  rdf.quad(SCHEMA.Person, RDF.type, RDFS.Class),
  rdf.quad(SCHEMA.Person, RDFS.label, rdf.literal('Person', 'fr')),
  rdf.quad(SCHEMA.Person, RDFS.comment, rdf.literal('Person dead of alive', 'en')),


  rdf.quad(SCHEMA.givenName, RDF.type, RDF.Property),
  rdf.quad(SCHEMA.givenName, RDFS.label, rdf.literal('givenName', '')),
  rdf.quad(SCHEMA.givenName, RDFS.comment, rdf.literal('A given name is the first name of a person.', 'en')),

  rdf.quad(SCHEMA.familyName, RDF.type, RDF.Property),
  rdf.quad(SCHEMA.familyName, RDFS.label, rdf.literal('familyName', 'fr')),
  rdf.quad(SCHEMA.familyName, RDFS.comment, rdf.literal('A family name is the last name of a person.', 'en')),

]);

const datasetExtension = rdf.dataset().addAll([
  rdf.quad(SCHEMA.Person, SCHEMA.alternateName, rdf.literal('Person-fr', 'fr')),
  rdf.quad(SCHEMA.Person, SCHEMA.alternateName, rdf.literal('Person-de', 'de')),
  rdf.quad(SCHEMA.Person, SCHEMA.alternateName, rdf.literal('Person-es', 'es')),
  rdf.quad(SCHEMA.Person, RDFS.comment, rdf.literal('Person dead of alive fr', 'fr')),
  rdf.quad(SCHEMA.Person, RDFS.comment, rdf.literal('Person dead of alive de', 'de')),
  rdf.quad(SCHEMA.Person, RDFS.comment, rdf.literal('Person dead of alive es', 'es')),

  rdf.quad(SCHEMA.givenName, SCHEMA.alternateName, rdf.literal('Given Name', 'en')),
  rdf.quad(SCHEMA.givenName, SCHEMA.alternateName, rdf.literal('Given Name-fr', 'fr')),
  rdf.quad(SCHEMA.givenName, SCHEMA.alternateName, rdf.literal('Given Name-de', 'de')),
  rdf.quad(SCHEMA.givenName, SCHEMA.alternateName, rdf.literal('Given Name-es', 'es')),
  rdf.quad(SCHEMA.givenName, RDFS.comment, rdf.literal('Given name of a person fr', 'fr')),
  rdf.quad(SCHEMA.givenName, RDFS.comment, rdf.literal('Given name of a person de', 'de')),
  rdf.quad(SCHEMA.givenName, RDFS.comment, rdf.literal('Given name of a person es', 'es')),
]);


const dataSetA = rdf.dataset().addAll([
  rdf.quad(SCHEMA.Person, RDF.type, RDFS.Class),
  rdf.quad(SCHEMA.Person, RDFS.label, rdf.literal('Person')),
]);

const dataSetB = rdf.dataset().addAll([
  rdf.quad(SCHEMA.givenName, RDF.type, RDF.Property),
  rdf.quad(SCHEMA.givenName, RDFS.label, rdf.literal('Given Name')),
]);

const dataSetC = rdf.dataset().addAll([
  rdf.quad(SCHEMA.familyName, RDF.type, RDFS.Property),
  rdf.quad(SCHEMA.familyName, RDFS.label, rdf.literal('Family Name')),
]);

describe ('LIT JS unit tests', () => {
  // const aliceIriAsString = 'https://alice.example.org/profile#me'
  // const alice = rdf.namedNode(aliceIriAsString)

  beforeEach(() => {
    // delete process.env.IRI_HINT_APPLICATION
    // delete process.env.DATA_SERVER_SOLID
  })

  describe ('Building the Template input', () => {
    it ('should create a simple JSON object with all the fields', () => {
      // const username = 'TestUser'
      // const webId = LitUtils.createWebId(username)
      // expect(webId.value).to.include('https://', username, LitUtils.DEFAULT_WEDID_SERVER_DOMAIN, '#')

      const result = gen.buildTemplateInput(gen.load([dataset, datasetExtension]), gen.load([datasetExtension]));
      expect(result.namespace).to.equal("http://schema.org/");
      expect(result.ontologyNameUppercase).to.equal("SCHEMA_EXT");
      expect(result.classes[0].name).to.equal("Person");
      expect(result.classes[0].comment).to.equal("Person dead of alive");
      expect(result.classes[0].labels[0].value).to.equal("Person");
      expect(result.classes[0].alternateNames[0].value).to.equal("Person-fr");
      expect(result.classes[0].alternateNames[1].value).to.equal("Person-de");
      expect(result.classes[0].alternateNames[2].value).to.equal("Person-es");

      expect(result.properties[0].name).to.equal("givenName");
      expect(result.properties[0].comment).to.equal("A given name is the first name of a person.");
      expect(result.properties[0].labels[0].value).to.equal("givenName");
      expect(result.properties[0].alternateNames[0].value).to.equal("Given Name");
      expect(result.properties[0].alternateNames[1].value).to.equal("Given Name-fr");
      expect(result.properties[0].alternateNames[2].value).to.equal("Given Name-de");
      expect(result.properties[0].alternateNames[3].value).to.equal("Given Name-es");
    })

    it ('Should load A and B, and generate code from A and B', () => {
        const result = gen.buildTemplateInput(gen.load([dataSetA, dataSetB]), gen.load([dataSetA, dataSetB]));

        expect(result.classes[0].name).to.equal('Person');
        expect(result.properties[0].name).to.equal('Given Name');
    })

    it ('Should load A and B, and generate code from A (not B)', () => {
      const result = gen.buildTemplateInput(gen.load([dataSetA, dataSetB]), gen.load([dataSetA]));

      expect(result.classes[0].name).to.equal('Person');
      expect(result.properties.length).to.equal(0);
    })


    it ('Should load A and B, and generate code from B (not A)', () => {
      const result = gen.buildTemplateInput(gen.load([dataSetA, dataSetB]), gen.load([dataSetB]));

      expect(result.classes.length).to.equal(0);
      expect(result.properties[0].name).to.equal('Given Name');
    })

    it ('Should load A B and C, and generate code from A and B (not C)', () => {
      const result = gen.buildTemplateInput(gen.load([dataSetA, dataSetB, dataSetC]), gen.load([dataSetA, dataSetB]));

      expect(result.classes[0].name).to.equal('Person');
      expect(result.properties[0].name).to.equal('Given Name');
      expect(result.properties.length).to.equal(1);
    })


    it ('Should generate using environment value', () => {
      gen.generate();
    })
  })



  describe ('Passing the JSON to the template to create the output file', () => {
    it ('should ', () => {

    });
  });

})
