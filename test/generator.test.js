'use strict';

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;

const rdf = require('rdf-ext');

const { RDF, RDFS, SCHEMA } = require('vocab-lit');

const Generator = require('../src/generator');
const generator = new Generator({ input: [], artifactVersion: '1.0.0' });

const dataset = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA.Person, RDF.type, RDFS.Class),
    rdf.quad(SCHEMA.Person, RDFS.label, rdf.literal('Person', 'en')),
    rdf.quad(SCHEMA.Person, RDFS.comment, rdf.literal('Person dead or alive', 'en')),

    rdf.quad(SCHEMA.givenName, RDF.type, RDF.Property),
    rdf.quad(SCHEMA.givenName, RDFS.label, rdf.literal('givenName', '')),
    rdf.quad(
      SCHEMA.givenName,
      RDFS.comment,
      rdf.literal('A given name is the first name of a person.', 'en')
    ),

    rdf.quad(SCHEMA.familyName, RDF.type, RDF.Property),
    rdf.quad(SCHEMA.familyName, RDFS.label, rdf.literal('familyName', 'fr')),
    rdf.quad(
      SCHEMA.familyName,
      RDFS.comment,
      rdf.literal('A family name is the last name of a person.', 'en')
    ),
  ]);

const datasetExtension = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA.Person, SCHEMA.alternateName, rdf.literal('Person-fr', 'fr')),
    rdf.quad(SCHEMA.Person, SCHEMA.alternateName, rdf.literal('Person-de', 'de')),
    rdf.quad(SCHEMA.Person, SCHEMA.alternateName, rdf.literal('Person-es', 'es')),
    rdf.quad(SCHEMA.Person, RDFS.comment, rdf.literal('Person dead or alive fr', 'fr')),
    rdf.quad(SCHEMA.Person, RDFS.comment, rdf.literal('Person dead or alive de', 'de')),
    rdf.quad(SCHEMA.Person, RDFS.comment, rdf.literal('Person dead or alive es', 'es')),

    rdf.quad(SCHEMA.givenName, SCHEMA.alternateName, rdf.literal('Given Name', 'en')),
    rdf.quad(SCHEMA.givenName, SCHEMA.alternateName, rdf.literal('Given Name-fr', 'fr')),
    rdf.quad(SCHEMA.givenName, SCHEMA.alternateName, rdf.literal('Given Name-de', 'de')),
    rdf.quad(SCHEMA.givenName, SCHEMA.alternateName, rdf.literal('Given Name-es', 'es')),
    rdf.quad(SCHEMA.givenName, RDFS.comment, rdf.literal('Given name of a person fr', 'fr')),
    rdf.quad(SCHEMA.givenName, RDFS.comment, rdf.literal('Given name of a person de', 'de')),
    rdf.quad(SCHEMA.givenName, RDFS.comment, rdf.literal('Given name of a person es', 'es')),
  ]);

const emptyDataSet = rdf.dataset();

const dataSetA = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA.Person, RDF.type, RDFS.Class),
    rdf.quad(SCHEMA.Person, RDFS.label, rdf.literal('Person')),
  ]);

const dataSetB = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA.givenName, RDF.type, RDF.Property),
    rdf.quad(SCHEMA.givenName, RDFS.label, rdf.literal('Given Name')),
  ]);

const dataSetC = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA.familyName, RDF.type, RDF.Property),
    rdf.quad(SCHEMA.familyName, RDFS.label, rdf.literal('Family Name'), 'en'),
  ]);

const overrideLabelTerms = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA.Person, RDFS.label, rdf.literal('Override Person')),
    rdf.quad(SCHEMA.givenName, RDFS.label, rdf.literal('Override Given Name')),
    rdf.quad(SCHEMA.familyName, RDFS.label, rdf.literal('Override Family Name'), 'en'),
  ]);

const overrideCommentTerms = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA.Person, RDFS.comment, rdf.literal('Override comment for Person')),
    rdf.quad(SCHEMA.givenName, RDFS.comment, rdf.literal('Override comment for Given Name')),
    rdf.quad(
      SCHEMA.familyName,
      RDFS.comment,
      rdf.literal('Override comment for Family Name'),
      'en'
    ),
  ]);

const overrideAtlNameTerms = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA.Person, SCHEMA.alternateName, rdf.literal('Alt Person')),
    rdf.quad(SCHEMA.givenName, SCHEMA.alternateName, rdf.literal('Alt Given Name')),
    rdf.quad(SCHEMA.familyName, SCHEMA.alternateName, rdf.literal('Alt Family Name'), 'en'),
  ]);

describe('Artifact generator unit tests', () => {
  beforeEach(() => {
    delete process.env.IRI_HINT_APPLICATION;
    delete process.env.DATA_SERVER_SOLID;
  });

  describe('Building the Template input', () => {
    it('should create a simple JSON object with all the fields', () => {
      const result = generator.buildTemplateInput(
        Generator.merge([dataset, datasetExtension]),
        Generator.merge([datasetExtension])
      );
      expect(result.namespace).to.equal('http://schema.org/');
      expect(result.ontologyPrefix).to.equal('schema');
      expect(result.classes[0].name).to.equal('Person');
      expect(result.classes[0].comment).to.equal('Person dead or alive');

      var personLabels = result.classes[0].labels;
      expect(personLabels).to.deep.include({
        value: 'Person',
        language: 'en',
      });

      expect(personLabels).to.deep.include({
        value: 'Person-fr',
        language: 'fr',
      });
      expect(personLabels).to.deep.include({
        value: 'Person-de',
        language: 'de',
      });
      expect(personLabels).to.deep.include({
        value: 'Person-es',
        language: 'es',
      });

      expect(result.properties[0].name).to.equal('givenName');
      expect(result.properties[0].comment).to.equal('A given name is the first name of a person.');
      var givenNameLabels = result.properties[0].labels;

      expect(givenNameLabels).to.deep.include({
        value: 'Given Name',
        language: 'en',
      });
      expect(givenNameLabels).to.deep.include({
        value: 'Given Name-fr',
        language: 'fr',
      });
      expect(givenNameLabels).to.deep.include({
        value: 'Given Name-de',
        language: 'de',
      });
      expect(givenNameLabels).to.deep.include({
        value: 'Given Name-es',
        language: 'es',
      });
    });

    it('Should merge A and B, and generate code from A and B', () => {
      const result = generator.buildTemplateInput(
        Generator.merge([dataSetA, dataSetB]),
        Generator.merge([dataSetA, dataSetB])
      );

      expect(result.classes[0].name).to.equal('Person');
      expect(result.properties[0].name).to.equal('givenName');
    });

    it('Should merge A and B, and generate code from A (not B)', () => {
      const result = generator.buildTemplateInput(
        Generator.merge([dataSetA, dataSetB]),
        Generator.merge([dataSetA])
      );

      expect(result.classes[0].name).to.equal('Person');
      expect(result.properties.length).to.equal(0);
    });

    it('Should merge A and B, and generate code from B (not A)', () => {
      const result = generator.buildTemplateInput(
        Generator.merge([dataSetA, dataSetB]),
        Generator.merge([dataSetB])
      );

      expect(result.classes.length).to.equal(0);
      expect(result.properties[0].name).to.equal('givenName');
    });

    it('Should merge A B and C, and generate code from A and B (not C)', () => {
      const result = generator.buildTemplateInput(
        Generator.merge([dataSetA, dataSetB, dataSetC]),
        Generator.merge([dataSetA, dataSetB])
      );

      expect(result.classes[0].name).to.equal('Person');
      expect(result.properties[0].name).to.equal('givenName');
      expect(result.properties.length).to.equal(1);
    });

    it('Should handle empty datasets', () => {
      const result = generator.buildTemplateInput(
        Generator.merge([emptyDataSet]),
        Generator.merge([emptyDataSet])
      );

      expect(result.namespace).to.equal('');
      expect(result.ontologyPrefix).to.equal('');
      expect(result.classes.length).to.equal(0);
      expect(result.properties.length).to.equal(0);
    });

    it('Should have an empty comment for the class or property if one cant be found', () => {
      const result = generator.buildTemplateInput(
        Generator.merge([dataSetA, dataSetB]),
        Generator.merge([dataSetB])
      );

      expect(result.properties[0].name).to.equal('givenName');
      expect(result.properties.length).to.equal(1);
      expect(result.properties[0].comment).to.equal('');
    });

    it('Should take any comment for the class or property if english or default cant be found', () => {
      const dataSetFrenchOnlyComment = rdf
        .dataset()
        .addAll([
          rdf.quad(SCHEMA.givenName, RDF.type, RDF.Property),
          rdf.quad(
            SCHEMA.givenName,
            RDFS.comment,
            rdf.literal('Given Name comment in french', 'fr')
          ),
        ]);

      const result = generator.buildTemplateInput(
        Generator.merge([dataSetA, dataSetFrenchOnlyComment]),
        Generator.merge([dataSetFrenchOnlyComment])
      );

      expect(result.properties[0].name).to.equal('givenName');
      expect(result.properties.length).to.equal(1);
      expect(result.properties[0].comment).to.equal('Given Name comment in french');
    });
  });

  describe('Vocab terms from extention dataset', () => {
    it('should override label terms of the main datasets', () => {
      const result = generator.buildTemplateInput(
        Generator.merge([dataSetA, dataSetB, dataSetC, overrideLabelTerms]),
        Generator.merge([overrideLabelTerms])
      );

      var person = result.classes[0];

      expect(person.name).to.equal('Person');
      expect(person.labels.length).to.equal(1);
      expect(person.labels[0].value).to.equal('Override Person');

      var givenName = result.properties[0];

      expect(givenName.name).to.equal('givenName');
      expect(givenName.labels.length).to.equal(1);
      expect(givenName.labels[0].value).to.equal('Override Given Name');

      var familyName = result.properties[1];

      expect(familyName.name).to.equal('familyName');
      expect(familyName.labels.length).to.equal(1);
      expect(familyName.labels[0].value).to.equal('Override Family Name');
    });

    it('should override comment terms of the main datasets', () => {
      const result = generator.buildTemplateInput(
        Generator.merge([dataSetA, dataSetB, dataSetC, overrideCommentTerms]),
        Generator.merge([overrideCommentTerms])
      );

      var person = result.classes[0];

      expect(person.name).to.equal('Person');
      expect(person.comments.length).to.equal(1);
      expect(person.comments[0].value).to.equal('Override comment for Person');

      var givenName = result.properties[0];

      expect(givenName.name).to.equal('givenName');
      expect(givenName.comments.length).to.equal(1);
      expect(givenName.comments[0].value).to.equal('Override comment for Given Name');

      var familyName = result.properties[1];

      expect(familyName.name).to.equal('familyName');
      expect(familyName.comments.length).to.equal(1);
      expect(familyName.comments[0].value).to.equal('Override comment for Family Name');
    });

    it('should override label with alternativeNames from the vocab terms', () => {
      const result = generator.buildTemplateInput(
        Generator.merge([dataSetA, dataSetB, dataSetC, overrideAtlNameTerms]),
        Generator.merge([overrideAtlNameTerms])
      );

      var person = result.classes[0];

      expect(person.name).to.equal('Person');
      expect(person.labels.length).to.equal(1);
      expect(person.labels[0].value).to.equal('Alt Person');

      var givenName = result.properties[0];

      expect(givenName.name).to.equal('givenName');
      expect(givenName.labels.length).to.equal(1);
      expect(givenName.labels[0].value).to.equal('Alt Given Name');

      var familyName = result.properties[1];

      expect(familyName.name).to.equal('familyName');
      expect(familyName.labels.length).to.equal(1);
      expect(familyName.labels[0].value).to.equal('Alt Family Name');
    });
  });
});
