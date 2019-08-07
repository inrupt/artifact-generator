require('mock-local-storage');

const rdf = require('rdf-ext');
const { RDF, RDFS, OWL, VANN } = require('@lit/generated-vocab-common');

const DatasetHandler = require('./DatasetHandler');

const extSubject = rdf.namedNode('http://rdf-extension.com');

const vocabMetadata = rdf
  .dataset()
  .addAll([
    rdf.quad(extSubject, RDF.type, OWL.Ontology),
    rdf.quad(extSubject, VANN.preferredNamespaceUri, extSubject),
  ]);

describe('Dataset Handler', () => {
  it('should makes exceptions for vocab terms found in common vocabs - RDF:langString', () => {
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .add(rdf.quad(RDF.langString, RDF.type, RDFS.Datatype));

    const handler = new DatasetHandler(dataset, rdf.dataset(), { inputFiles: ['does not matter'] });
    const result = handler.buildTemplateInput();
    expect(result.properties.length).toEqual(0);
  });

  it('should makes exceptions for vocab terms found in common vocabs - XSD:duration', () => {
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .add(
        rdf.quad(
          rdf.namedNode('http://www.w3.org/2001/XMLSchema#duration'),
          RDF.type,
          RDFS.Datatype
        )
      );

    const handler = new DatasetHandler(dataset, rdf.dataset(), { inputFiles: ['does not matter'] });
    const result = handler.buildTemplateInput();
    expect(result.properties.length).toEqual(0);
  });
});
