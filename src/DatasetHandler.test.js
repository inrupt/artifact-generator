require('mock-local-storage');

const rdf = require('rdf-ext');
const { RDF, RDFS, OWL, VANN } = require('./CommonTerms');

const DatasetHandler = require('./DatasetHandler');

const NAMESPACE = 'http://rdf-extension.com#';
const NAMESPACE_IRI = rdf.namedNode(NAMESPACE);

const vocabMetadata = rdf
  .dataset()
  .addAll([
    rdf.quad(NAMESPACE_IRI, RDF.type, OWL.Ontology),
    rdf.quad(NAMESPACE_IRI, VANN.preferredNamespaceUri, NAMESPACE_IRI),
    rdf.quad(NAMESPACE_IRI, VANN.preferredNamespacePrefix, 'rdf-ext'),
  ]);

describe('Dataset Handler', () => {
  it('should makes exceptions for vocab terms found in common vocabs - RDF:langString', () => {
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .add(rdf.quad(RDF.langString, RDF.type, RDFS.Datatype));

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ['does not matter'],
    });
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

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ['does not matter'],
    });
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

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ['does not matter'],
    });
    const result = handler.buildTemplateInput();
    expect(result.classes.length).toEqual(1);
    expect(result.classes[0].name).toEqual('testTermClass');

    expect(result.properties.length).toEqual(2);
    expect(result.properties[0].name).toEqual('testTermProperty');
    expect(result.properties[1].name).toEqual('testTermLiteral');

    expect(result.literals.length).toEqual(0);
  });

  it('should fail if no prefix is defined in the vocabulary', () => {
    const NS = 'http://some.namespace.com#';
    const NS_IRI = rdf.namedNode(NS);

    const vocab = rdf
      .dataset()
      .addAll([
        rdf.quad(NS_IRI, RDF.type, OWL.Ontology),
        rdf.quad(NS_IRI, VANN.preferredNamespaceUri, NS_IRI),
      ]);
    const handler = new DatasetHandler(vocab, rdf.dataset(), {
      inputResources: ['does not matter'],
    });
    expect(() => {
      handler.findPreferredNamespacePrefix();
    }).toThrow('No prefix defined');
  });

  it('should not fail for known namespaces without prefix', () => {
    const NS = 'http://xmlns.com/foaf/0.1/';
    const NS_IRI = rdf.namedNode(NS);

    const vocab = rdf
      .dataset()
      .addAll([
        rdf.quad(NS_IRI, RDF.type, OWL.Ontology),
        rdf.quad(NS_IRI, VANN.preferredNamespaceUri, NS_IRI),
      ]);
    const handler = new DatasetHandler(vocab, rdf.dataset(), {
      inputResources: ['does not matter'],
    });
    expect(handler.findPreferredNamespacePrefix()).toEqual('foaf');
  });

  it('should throw an error if the vocabulary does not define any term', () => {
    const NS = 'http://xmlns.com/foaf/0.1/';
    const NS_IRI = rdf.namedNode(NS);

    const vocab = rdf
      .dataset()
      .addAll([
        rdf.quad(NS_IRI, RDF.type, OWL.Ontology),
        rdf.quad(NS_IRI, VANN.preferredNamespaceUri, NS_IRI),
      ]);
    const handler = new DatasetHandler(vocab, rdf.dataset(), {
      inputResources: ['does not matter'],
    });
    expect(() => {
      handler.buildTemplateInput();
    }).toThrow(`[${NS}] does not contain any terms.`);
  });

  it('should override the namespace of the terms', () => {
    const namespaceOverride = 'https://override.namespace.org';
    const testTermClass = `${NAMESPACE}testTermClass`;
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .addAll([rdf.quad(rdf.namedNode(testTermClass), RDF.type, RDFS.Class)]);

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ['does not matter'],
      namespaceOverride,
      nameAndPrefixOverride: 'does not matter',
    });
    const result = handler.buildTemplateInput();
    expect(result.namespace).toEqual(namespaceOverride);
  });

  it('should override the namespace of the terms if the heuristic namespace determination fails.', () => {
    const namespaceOverride = 'http://rdf-extension.com#';
    const otherNamespace = 'https://another.long.namespace.org#';
    const testTermClass = `${NAMESPACE}testTermClass`;
    const longestTerm = `${otherNamespace}thisIsAVeryLongTermThatBreaksOurHeuristic`;
    const dataset = rdf
      .dataset()
      // .addAll(vocabMetadata)
      .addAll([rdf.quad(rdf.namedNode(testTermClass), RDF.type, RDFS.Class)])
      .addAll([rdf.quad(rdf.namedNode(longestTerm), RDF.type, `${otherNamespace}someClass`)]);

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ['does not matter'],
      namespaceOverride,
      nameAndPrefixOverride: 'does not matter',
    });
    const result = handler.buildTemplateInput();
    expect(result.namespace).toEqual(namespaceOverride);
  });
});
