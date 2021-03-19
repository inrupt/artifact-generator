require("mock-local-storage");

const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

const rdf = require("rdf-ext");
const {
  RDF,
  RDF_NAMESPACE,
  RDFS,
  OWL,
  OWL_NAMESPACE,
  SKOS,
  VANN,
  LIT_CORE,
} = require("./CommonTerms");

const DatasetHandler = require("./DatasetHandler");

const NAMESPACE = "http://rdf-extension.com#";
const NAMESPACE_IRI = rdf.namedNode(NAMESPACE);

const vocabMetadata = rdf
  .dataset()
  .addAll([
    rdf.quad(NAMESPACE_IRI, RDF.type, OWL.Ontology),
    rdf.quad(NAMESPACE_IRI, VANN.preferredNamespaceUri, NAMESPACE_IRI),
    rdf.quad(NAMESPACE_IRI, VANN.preferredNamespacePrefix, "rdf-ext"),
  ]);

describe("Dataset Handler", () => {
  describe("Edge-case vocabulary cases ", () => {
    it("should ignore properties defined on the namespace IRI", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(rdf.namedNode(OWL_NAMESPACE), RDF.type, RDF.Property))
        .add(rdf.quad(OWL.Ontology, RDF.type, rdf.namedNode(OWL_NAMESPACE)));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.properties.length).toBe(0);
    });
  });

  describe("Handle sub-classes or sub-properties", () => {
    it("should handle sub-classes", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDFS.subClassOf, SKOS.Concept));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      expect(result.classes[0].name).toEqual("Ontology");
    });

    it("should handle sub-properties", () => {
      const dataset = rdf
        .dataset()
        .add(
          rdf.quad(
            rdf.namedNode("http://www.w3.org/2001/XMLSchema#float"),
            RDFS.subPropertyOf,
            rdf.literal(
              "Also need to make sure we ignore terms from XSD namespace..."
            )
          )
        )
        .add(rdf.quad(RDFS.label, RDFS.subPropertyOf, SKOS.definition));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.properties.length).toEqual(1);
      expect(result.properties[0].name).toEqual("label");
    });
  });

  it("should ignore vocab terms not in our namespace, if configured to do so", () => {
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .add(
        rdf.quad(
          rdf.namedNode("https://ex.com/different-namespace#term"),
          RDF.type,
          RDFS.Class
        )
      );

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
      ignoreNonVocabTerms: true,
    });
    const result = handler.buildTemplateInput();
    expect(result.classes.length).toEqual(0);
  });

  it("should makes exceptions for vocab terms found in common vocabs - RDF:langString", () => {
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .add(rdf.quad(RDF.langString, RDF.type, RDFS.Datatype));

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
    });
    const result = handler.buildTemplateInput();
    expect(result.properties.length).toEqual(0);
  });

  it("should makes exceptions for vocab terms found in common vocabs - XSD:duration", () => {
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .add(
        rdf.quad(
          rdf.namedNode("http://www.w3.org/2001/XMLSchema#duration"),
          RDF.type,
          RDFS.Datatype
        )
      );

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
    });

    const result = handler.buildTemplateInput();
    expect(result.properties.length).toEqual(0);
  });

  it("should de-duplicate terms defined with multiple predicates we look for", () => {
    // Note: This test relies on the order different predicates are processing
    // in the implementation - i.e. if a subject matches multiple RDF types,
    // then only the first one will be used.
    const testTermClass = rdf.namedNode(`${NAMESPACE}testTermClass`);
    const testTermProperty = rdf.namedNode(`${NAMESPACE}testTermProperty`);
    const testTermLiteral = rdf.namedNode(`${NAMESPACE}testTermLiteral`);
    const testTermConstantIri = rdf.namedNode(
      `${NAMESPACE}testTermConstantIri`
    );
    const testTermConstantString = rdf.namedNode(
      `${NAMESPACE}testTermConstantString`
    );

    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .addAll([
        rdf.quad(testTermClass, RDF.type, RDFS.Class),
        rdf.quad(testTermClass, RDF.type, OWL.Class),

        rdf.quad(testTermProperty, RDF.type, RDF.Property),
        rdf.quad(testTermProperty, RDF.type, RDFS.Datatype),

        rdf.quad(testTermLiteral, RDF.type, RDF.Property),
        rdf.quad(testTermLiteral, RDF.type, RDFS.Literal),

        // Define this subject as a Literal first, meaning it'll be ignored as
        // as a constant IRI.
        rdf.quad(testTermConstantIri, RDF.type, RDFS.Literal),
        rdf.quad(testTermConstantIri, RDF.type, LIT_CORE.ConstantIri),

        // Define this subject as a Literal first, meaning it'll be ignored as
        // as a constant string.
        rdf.quad(testTermConstantString, RDF.type, RDFS.Literal),
        rdf.quad(testTermConstantString, RDF.type, LIT_CORE.ConstantString),
      ]);

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
    });

    const result = handler.buildTemplateInput();
    expect(result.classes.length).toEqual(1);
    expect(result.classes[0].name).toEqual("testTermClass");

    expect(result.properties.length).toEqual(2);
    expect(result.properties[0].name).toEqual("testTermProperty");
    expect(result.properties[1].name).toEqual("testTermLiteral");

    expect(result.literals.length).toEqual(2);

    // There guys get ignored because we process them as Literals first (in the
    // processing order in the implementation!)
    expect(result.constantIris.length).toEqual(0);
    expect(result.constantStrings.length).toEqual(0);
  });

  it("should skip classes and sub-classes from other, but well-known, vocabs", () => {
    // Create terms that look they come from a well-known vocab.
    const testTermClass = rdf.namedNode(`${RDF_NAMESPACE}testTermClass`);
    const testTermSubClass = rdf.namedNode(`${RDF_NAMESPACE}testTermSubClass`);

    const dataset = rdf.dataset().addAll([
      // Define this ontology as having it's own namespace...
      rdf.quad(NAMESPACE_IRI, RDF.type, OWL.Ontology),

      // ...now add terms from different, but **well-known**, namespaces:
      rdf.quad(testTermClass, RDF.type, RDFS.Class),
      rdf.quad(testTermSubClass, RDFS.subClassOf, RDFS.Class),
    ]);

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
    });

    const result = handler.buildTemplateInput();
    expect(result.classes.length).toEqual(0);
  });

  it("should fail if no prefix is defined in the vocabulary", () => {
    const NS = "http://some.namespace.com#";
    const NS_IRI = rdf.namedNode(NS);

    const vocab = rdf
      .dataset()
      .addAll([
        rdf.quad(NS_IRI, RDF.type, OWL.Ontology),
        rdf.quad(NS_IRI, VANN.preferredNamespaceUri, NS_IRI),
      ]);

    const handler = new DatasetHandler(vocab, rdf.dataset(), {
      inputResources: ["does not matter"],
    });

    expect(() => {
      handler.findPreferredNamespacePrefix(NS);
    }).toThrow("No vocabulary prefix defined");
  });

  it("should not fail for known namespaces without prefix", () => {
    const NS = "http://xmlns.com/foaf/0.1/";
    const NS_IRI = rdf.namedNode(NS);

    const vocab = rdf
      .dataset()
      .addAll([
        rdf.quad(NS_IRI, RDF.type, OWL.Ontology),
        rdf.quad(NS_IRI, VANN.preferredNamespaceUri, NS_IRI),
      ]);

    const handler = new DatasetHandler(vocab, rdf.dataset(), {
      inputResources: ["does not matter"],
    });

    expect(handler.findPreferredNamespacePrefix(NS)).toEqual("foaf");
  });

  it("should throw an error if the vocabulary does not define any term", () => {
    const NS = "http://xmlns.com/foaf/0.1/";
    const NS_IRI = rdf.namedNode(NS);

    const vocab = rdf
      .dataset()
      .addAll([
        rdf.quad(NS_IRI, RDF.type, OWL.Ontology),
        rdf.quad(NS_IRI, VANN.preferredNamespaceUri, NS_IRI),
      ]);

    const handler = new DatasetHandler(vocab, rdf.dataset(), {
      inputResources: ["does not matter"],
    });

    expect(() => {
      handler.buildTemplateInput();
    }).toThrow(`[${NS}] does not contain any terms.`);
  });

  it("should override the namespace of the terms", () => {
    const namespaceOverride = "https://override.namespace.org";
    const testTermClass = `${NAMESPACE}testTermClass`;
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .addAll([rdf.quad(rdf.namedNode(testTermClass), RDF.type, RDFS.Class)]);

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
      namespaceOverride,
      nameAndPrefixOverride: "does not matter",
    });

    const result = handler.buildTemplateInput();
    expect(result.namespace).toEqual(namespaceOverride);
  });

  it("should override the namespace of the terms if the heuristic namespace determination fails.", () => {
    const namespaceOverride = "http://rdf-extension.com#";
    const otherNamespace = "https://another.long.namespace.org#";
    const testTermClass = `${NAMESPACE}testTermClass`;
    const longestTerm = `${otherNamespace}thisIsAVeryLongTermThatBreaksOurHeuristic`;
    const dataset = rdf
      .dataset()
      // .addAll(vocabMetadata)
      .addAll([rdf.quad(rdf.namedNode(testTermClass), RDF.type, RDFS.Class)])
      .addAll([
        rdf.quad(
          rdf.namedNode(longestTerm),
          RDF.type,
          `${otherNamespace}someClass`
        ),
      ]);

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
      namespaceOverride,
      nameAndPrefixOverride: "does not matter",
    });

    const result = handler.buildTemplateInput();
    expect(result.namespace).toEqual(namespaceOverride);
  });

  describe("storing local copy of vocab", () => {
    it("should store local copy", () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(OWL.Ontology, RDFS.subClassOf, SKOS.Concept));

      const testLocalCopyDirectory = path.join(
        ".",
        "test",
        "Generated",
        "UNIT_TEST",
        "LocalCopyOfVocab",
        "testStoringVocab"
      );
      rimraf.sync(testLocalCopyDirectory);

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
        storeLocalCopyOfVocabDirectory: testLocalCopyDirectory,
      });

      handler.buildTemplateInput();

      const matches = fs
        .readdirSync(testLocalCopyDirectory)
        .filter(
          (filename) =>
            filename.startsWith(`rdf-ext-`) &&
            filename.endsWith(`--152985056__http---rdf-extension.com#.ttl`)
        );

      expect(matches.length).toBe(1);
    });
  });
});
