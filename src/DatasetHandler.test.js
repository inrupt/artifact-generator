require('mock-local-storage');

const rdf = require('rdf-ext');
const { RDF, RDFS, OWL, VANN } = require('@lit/generated-vocab-common');

const DatasetHandler = require('./DatasetHandler');

const NAMESPACE = 'http://rdf-extension.com#';
const NAMESPACE_IRI = rdf.namedNode(NAMESPACE);

const vocabMetadata = rdf
  .dataset()
  .addAll([
    rdf.quad(NAMESPACE_IRI, RDF.type, OWL.Ontology),
    rdf.quad(NAMESPACE_IRI, VANN.preferredNamespaceUri, NAMESPACE_IRI),
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

  it('should de-duplicate terms defined with multiple predicates we looks for', () => {
    const testTermClass = `${NAMESPACE}testTermClass`;
    const testTermProperty = `${NAMESPACE}testTermProperty`;
    const testTermLiteral = `${NAMESPACE}testTermLiteral`;
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .addAll([
        rdf.quad(rdf.namedNode(testTermClass), RDF.type, RDFS.Class),
        rdf.quad(rdf.namedNode(testTermClass), RDF.type, OWL.Class),

        rdf.quad(rdf.namedNode(testTermProperty), RDF.type, RDF.Property),
        rdf.quad(rdf.namedNode(testTermProperty), RDF.type, RDFS.Datatype),

        rdf.quad(rdf.namedNode(testTermLiteral), RDF.type, RDF.Property),
        rdf.quad(rdf.namedNode(testTermLiteral), RDF.type, RDFS.Literal),
      ]);

    const handler = new DatasetHandler(dataset, rdf.dataset(), { inputFiles: ['does not matter'] });
    const result = handler.buildTemplateInput();
    expect(result.classes.length).toEqual(1);
    expect(result.classes[0].name).toEqual('testTermClass');

    expect(result.properties.length).toEqual(2);
    expect(result.properties[0].name).toEqual('testTermProperty');
    expect(result.properties[1].name).toEqual('testTermLiteral');

    expect(result.literals.length).toEqual(0);
  });
});
