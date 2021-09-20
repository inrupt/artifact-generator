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
  SKOSXL,
  VANN,
  ARTIFACT_GENERATOR,
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
  describe("Static reporting helpers", () => {
    it("should report override only if one provided", () => {
      expect(DatasetHandler.mentionNamespaceOverrideIfPresent({})).toBe("");

      const override = "test override";
      expect(
        DatasetHandler.mentionNamespaceOverrideIfPresent({
          namespaceOverride: override,
        })
      ).toContain(override);
    });
  });

  describe("Ontology description ", () => {
    it("should use English description if multiple", () => {
      const commentInEnglish = rdf.literal("Some comment in English", "en");
      const commentInIrish = rdf.literal("Tráchtann cuid acu i nGaeilge", "ga");
      const commentInFrench = rdf.literal(
        "Quelques commentaires en français",
        "fr"
      );

      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInIrish))
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInFrench))
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInEnglish))
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.description).toContain(commentInEnglish.value);
    });

    it("should use description that starts with explicit English tag", () => {
      const commentInUsEnglish = rdf.literal(
        "Some comment in US English",
        "en-US"
      );
      const commentInIrish = rdf.literal("Tráchtann cuid acu i nGaeilge", "ga");
      const commentInFrench = rdf.literal(
        "Quelques commentaires en français",
        "fr"
      );

      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInIrish))
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInFrench))
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInUsEnglish))
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.description).toContain(commentInUsEnglish.value);
    });

    it("should fallback to no language tag if no explicit English", () => {
      const commentWithNoLocale = rdf.literal(
        "Some comment with no language tag"
      );
      const commentInIrish = rdf.literal("Tráchtann cuid acu i nGaeilge", "ga");
      const commentInFrench = rdf.literal(
        "Quelques commentaires en français",
        "fr"
      );

      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInIrish))
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInFrench))
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentWithNoLocale))
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.description).toContain(commentWithNoLocale.value);
    });
  });

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

  describe("handling multilingual descriptions for labels, comments, etc.", () => {
    const labelNoLocale = rdf.literal("No locale label");
    const commentNoLocale = rdf.literal("No locale comment");
    const labelInEnglish = rdf.literal("English label", "en");
    const commentInEnglish = rdf.literal("English comment", "en");
    const labelInIrish = rdf.literal("Lipéad éigin i nGaeilge", "ga");
    const commentInIrish = rdf.literal("Tráchtann cuid acu i nGaeilge", "ga");
    const labelInFrench = rdf.literal("Une étiquette en français", "fr");
    const commentInFrench = rdf.literal(
      "Quelques commentaires en français",
      "fr"
    );

    it("should give full description of matching labels and comments in all languages", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInIrish))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInIrish))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInFrench))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInFrench))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInEnglish))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInEnglish))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelNoLocale))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentNoLocale));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("[4] labels and comments");
      expect(description).toContain("languages [NoLocale, en, fr, ga]");
    });

    it("should treat 'skosxl:literalForm' as labels in all languages", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, SKOSXL.Label))
        .add(rdf.quad(OWL.Ontology, SKOSXL.literalForm, labelInIrish))
        .add(rdf.quad(OWL.Ontology, SKOSXL.literalForm, labelInFrench))
        .add(rdf.quad(OWL.Ontology, SKOSXL.literalForm, labelInEnglish))
        .add(rdf.quad(OWL.Ontology, SKOSXL.literalForm, labelNoLocale));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.properties.length).toEqual(1);
      const description = result.properties[0].termDescription;
      expect(description).toContain("[4] labels (");
      expect(description).toContain("languages [NoLocale, en, fr, ga]");
      expect(description).toContain("but no long-form descriptions");
    });

    it("should report all lang tags, but not report mismatch if only on @en", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInIrish))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInIrish))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInFrench))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInFrench))
        // Deliberately do not have a label in explicit English.
        // .add(rdf.quad(OWL.Ontology, RDFS.label, labelInEnglish))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInEnglish))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelNoLocale))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentNoLocale));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("[3] labels");
      expect(description).toContain("languages [NoLocale, fr, ga]");
      expect(description).toContain("[4] comments");
      expect(description).toContain("languages [NoLocale, en, fr, ga]");
      expect(description).not.toContain("mismatch");
    });

    it("should report difference is only in @en vs NoLocale", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInEnglish))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentNoLocale));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("only in English");
      expect(description).toContain("language [en]");
      expect(description).toContain("language [NoLocale]");
      expect(description).toContain("we consider the same");
    });

    it("should describe single matching non-English label and comment", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInIrish))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInIrish));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("language [ga]");
      expect(description).toContain("[1] label and comment");
    });

    it("should describe single mismatching non-English label and comment", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInIrish))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInFrench));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("has a mismatch");
      expect(description).toContain("[1]");
      expect(description).toContain("language [ga]");
      expect(description).toContain("language [fr]");
    });

    it("should describe multiple matching non-English label and comment", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInIrish))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInFrench))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInIrish))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInFrench));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("[2] labels and comments");
      expect(description).toContain("languages [fr, ga]");
    });

    it("should say no long-form description if no comment at all", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.label, rdf.literal("label", "en")))
        .add(rdf.quad(OWL.Ontology, RDFS.label, rdf.literal("label no lang")));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      expect(result.classes[0].termDescription).toContain(
        "no long-form descriptions at all"
      );
    });

    it("should describe mismatch label and missing comment", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInEnglish))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInEnglish))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInIrish));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("mismatch");
      expect(description).toContain("languages [en, ga]");
      expect(description).toContain("language [en]");
    });

    it("should describe single label and no comments", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInIrish));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("term has a label");
      expect(description).toContain("in language [ga]");
      expect(description).toContain("no long-form descriptions at all");
    });

    it("should describe multiple labels and no comments", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInIrish))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelNoLocale))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInFrench));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("term has [3] labels");
      expect(description).toContain("in languages [NoLocale, fr, ga]");
      expect(description).toContain("no long-form descriptions at all");
    });

    it("should describe single label and comment in English only", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelInEnglish))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInEnglish));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("descriptions only in English");
    });

    it("should describe single label and comment in no-locale only", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.label, labelNoLocale))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentNoLocale));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain(
        "descriptions only with no explicit locale"
      );
    });

    it("should describe mismatch comment and multiple missing label", () => {
      const dataset = rdf
        .dataset()
        .add(rdf.quad(OWL.Ontology, RDF.type, RDFS.Class))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInIrish))
        .add(rdf.quad(OWL.Ontology, RDFS.comment, commentInFrench));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("mismatch");
      expect(description).toContain("[0] labels");
      expect(description).toContain("languages [fr, ga]");
    });
  });

  describe("handle sub-classes or sub-properties", () => {
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
        rdf.quad(testTermConstantIri, RDF.type, ARTIFACT_GENERATOR.ConstantIri),

        // Define this subject as a Literal first, meaning it'll be ignored as
        // as a constant string.
        rdf.quad(testTermConstantString, RDF.type, RDFS.Literal),
        rdf.quad(
          testTermConstantString,
          RDF.type,
          ARTIFACT_GENERATOR.ConstantString
        ),
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
