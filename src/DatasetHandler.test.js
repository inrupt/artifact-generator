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
  SHACL,
  SKOS,
  SKOSXL,
  VANN,
  ARTIFACT_GENERATOR,
  DCTERMS,
} = require("./CommonTerms");

const DatasetHandler = require("./DatasetHandler");

const NAMESPACE = "https://rdf-extension.com/";
const NAMESPACE_IRI = rdf.namedNode(NAMESPACE);
const DEFAULT_DESCRIPTION = rdf.literal("Default vocab description...", "en");
const DEFAULT_PREFIX = rdf.literal("rdf-ext");

const NAMESPACE_TEST_TERM = rdf.namedNode(NAMESPACE + "testTerm");

const vocabMetadata = rdf
  .dataset()
  .addAll([
    rdf.quad(NAMESPACE_IRI, RDF.type, OWL.Ontology),
    rdf.quad(NAMESPACE_IRI, VANN.preferredNamespaceUri, NAMESPACE_IRI),
    rdf.quad(NAMESPACE_IRI, VANN.preferredNamespacePrefix, DEFAULT_PREFIX),
  ]);

describe("Dataset Handler", () => {
  describe("Handle multiple owl:Ontology triples", () => {
    it("should bomb out if multiple owl:Ontology triples", async () => {
      const extraOntology = NAMESPACE + "_AnotherOntology";
      const NAMESPACE_IRI_2 = rdf.namedNode(extraOntology);

      const datasetMultipleOntologies = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_IRI_2, RDF.type, OWL.Ontology))
        .add(rdf.quad(NAMESPACE_IRI_2, RDFS.label, DEFAULT_DESCRIPTION));

      const handler = new DatasetHandler(
        datasetMultipleOntologies,
        rdf.dataset(),
        {
          inputResources: ["does not matter"],
        },
      );

      await expect(handler.buildTemplateInput()).rejects.toThrow(extraOntology);
    });

    it("should warn if multiple owl:Ontology triples, but namespace overridden", async () => {
      const extraOntology = NAMESPACE + "_ExtraOntology";
      const NAMESPACE_IRI_2 = rdf.namedNode(extraOntology);

      const overrideOntology = NAMESPACE + "_OverrideOntology";
      const NAMESPACE_IRI_OVERRIDE = rdf.namedNode(overrideOntology);

      const datasetMultipleOntologies = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_IRI_2, RDF.type, OWL.Ontology))
        .add(rdf.quad(NAMESPACE_IRI_2, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_IRI_OVERRIDE, RDFS.label, DEFAULT_DESCRIPTION));

      const handler = new DatasetHandler(
        datasetMultipleOntologies,
        rdf.dataset(),
        {
          inputResources: ["does not matter"],
          vocabularyIriOverride: overrideOntology,
          nameAndPrefixOverride: "does_not_matter",
        },
      );

      const result = await handler.buildTemplateInput();
      expect(result.vocabularyIri).toEqual(overrideOntology);
      expect(result.namespaceIri).toEqual(NAMESPACE);
    });
  });

  describe("Static reporting helpers", () => {
    it("should report override only if one provided", () => {
      expect(DatasetHandler.describeNamespaceInUse("X")).toContain("X");

      const override = "test override";
      expect(DatasetHandler.describeNamespaceInUse("X", override)).toContain(
        override,
      );
    });
  });

  describe("Find longest term name", () => {
    it("should find longest from collection", () => {
      const ontologyIri = "https://ex.com/vocab/";
      const nonOntologyTermButVeryLong =
        "https://NOT-ex.com/vocab/nonOntologyTermButVeryLongIndeed";
      const termShort = `${ontologyIri}short`;
      const termLong = `${ontologyIri}longer-than-short`;

      expect(DatasetHandler.findLongestTermName([termShort, termLong])).toEqual(
        termLong,
      );
      expect(DatasetHandler.findLongestTermName([termLong, termShort])).toEqual(
        termLong,
      );
      expect(
        DatasetHandler.findLongestTermName([
          nonOntologyTermButVeryLong,
          termShort,
          termLong,
        ]),
      ).toEqual(nonOntologyTermButVeryLong);
      expect(
        DatasetHandler.findLongestTermName([
          termLong,
          termShort,
          nonOntologyTermButVeryLong,
        ]),
      ).toEqual(nonOntologyTermButVeryLong);
    });
  });

  describe("Ontology description ", () => {
    it("should pick up alternative vocab description predicates", async () => {
      const datasetRdfsLabel = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class));

      const handler = new DatasetHandler(datasetRdfsLabel, rdf.dataset(), {
        inputResources: ["does not matter"],
      });
      const result = await handler.buildTemplateInput();
      expect(result.description).toContain(DEFAULT_DESCRIPTION.value);
    });

    it("should pick up vocab description when non-English", async () => {
      const description = rdf.literal(
        "Some description with non-English locale...",
        "es",
      );

      const datasetRdfsLabel = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, description))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class));

      const handler = new DatasetHandler(datasetRdfsLabel, rdf.dataset(), {
        inputResources: ["does not matter"],
      });
      const result = await handler.buildTemplateInput();
      expect(result.description).toContain(description.value);
    });

    it("should use English description if multiple", async () => {
      const commentInEnglish = rdf.literal("Some comment in English", "en");
      const commentInIrish = rdf.literal("Tráchtann cuid acu i nGaeilge", "ga");
      const commentInFrench = rdf.literal(
        "Quelques commentaires en français",
        "fr",
      );

      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInIrish))
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInFrench))
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInEnglish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.description).toContain(commentInEnglish.value);
    });

    it("should use description that starts with explicit English tag", async () => {
      const commentInUsEnglish = rdf.literal(
        "Some comment in US English",
        "en-US",
      );
      const commentInIrish = rdf.literal("Tráchtann cuid acu i nGaeilge", "ga");
      const commentInFrench = rdf.literal(
        "Quelques commentaires en français",
        "fr",
      );

      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInIrish))
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInFrench))
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInUsEnglish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.description).toContain(commentInUsEnglish.value);
    });

    it("should fallback to no language tag if no explicit English", async () => {
      const commentWithNoLocale = rdf.literal(
        "Some comment with no language tag",
      );
      const commentInIrish = rdf.literal("Tráchtann cuid acu i nGaeilge", "ga");
      const commentInFrench = rdf.literal(
        "Quelques commentaires en français",
        "fr",
      );

      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInIrish))
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentInFrench))
        .add(rdf.quad(NAMESPACE_IRI, RDFS.comment, commentWithNoLocale))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.description).toContain(commentWithNoLocale.value);
    });
  });

  describe("Edge-case vocabulary cases ", () => {
    it("should ignore properties defined on the namespace IRI", async () => {
      const namespaceIri = "https://test.ex.com/vocab/";

      const dataset = rdf
        .dataset()
        // Define our vocab as a 'type' that we treat as a vocab property -
        // this should be ignored as being a property from the vocab itself!
        .add(rdf.quad(rdf.namedNode(namespaceIri), RDF.type, RDF.Property))
        // We need to define at least one term, in our vocab, otherwise we'll
        // blow up with an 'empty vocab' error.
        .add(
          rdf.quad(
            rdf.namedNode(`${namespaceIri}MyClass`),
            RDF.type,
            RDFS.Class,
          ),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        // We need to inject a vocab description, even though we didn't add
        // ontology triples, since we want to invoke our heuristic to determine
        // the vocab IRI, and we don't want to blow up on that description
        // check.
        descriptionFallback: DEFAULT_DESCRIPTION.value,
        inputResources: ["does not matter"],
        nameAndPrefixOverride: "test",
      });

      const result = await handler.buildTemplateInput();
      expect(result.properties.length).toBe(0);
    });

    it("should find vocab description in heuristically determined namespace", async () => {
      const namespaceIri = "https://test.ex.com/vocab/";
      const description = "Test description...";

      const dataset = rdf
        .dataset()
        // Describe our vocab directly (no 'owl:Ontology' triple).
        .add(
          rdf.quad(
            rdf.namedNode(namespaceIri),
            DCTERMS.title,
            rdf.literal(description),
          ),
        )
        // We need to define at least one term, in our vocab, otherwise we'll
        // blow up with an 'empty vocab' error.
        .add(
          rdf.quad(
            rdf.namedNode(`${namespaceIri}MyClass`),
            RDF.type,
            RDFS.Class,
          ),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
        nameAndPrefixOverride: "test",
      });

      const result = await handler.buildTemplateInput();
      expect(result.description).toContain(description);
    });
  });

  describe("handling vocabulary IRI as separate from namespace IRI", () => {
    it("should treat vocabulary IRI as namespace IRI", async () => {
      const vocabIri = "https://test.ex.com/vocab-not-namespace/";

      const dataset = rdf
        .dataset()
        .add(rdf.quad(rdf.namedNode(vocabIri), RDF.type, OWL.Ontology))
        // We need to define at least one term, in our vocab, otherwise we'll
        // blow up with an 'empty vocab' error.
        .add(
          rdf.quad(rdf.namedNode(`${vocabIri}MyClass`), RDF.type, RDFS.Class),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        // We need to inject a vocab description, even though we didn't add
        // ontology triples, since we want to invoke our heuristic to determine
        // the vocab IRI, and we don't want to blow up on that description
        // check.
        descriptionFallback: DEFAULT_DESCRIPTION.value,
        inputResources: ["does not matter"],
        nameAndPrefixOverride: "test",
      });

      const result = await handler.buildTemplateInput();
      expect(result.vocabularyIri).toEqual(vocabIri);
      expect(result.namespaceIri).toEqual(vocabIri);
    });

    it("should use vocabulary IRI override if none found", async () => {
      const vocabIri = "https://test.ex.com/vocab-not-namespace/";

      const dataset = rdf
        .dataset()
        // We need to define at least one term, in our vocab, otherwise we'll
        // blow up with an 'empty vocab' error.
        .add(
          rdf.quad(rdf.namedNode(`${vocabIri}MyClass`), RDF.type, RDFS.Class),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        // We need to inject a vocab description, even though we didn't add
        // ontology triples, since we want to invoke our heuristic to determine
        // the vocab IRI, and we don't want to blow up on that description
        // check.
        descriptionFallback: DEFAULT_DESCRIPTION.value,
        inputResources: ["does not matter"],
        nameAndPrefixOverride: "test",

        vocabularyIriOverride: vocabIri,
      });

      const result = await handler.buildTemplateInput();
      expect(result.vocabularyIri).toEqual(vocabIri);
      expect(result.namespaceIri).toEqual(vocabIri);
    });

    it("should fail if multiple vocabulary IRIs and no override", async () => {
      const vocabIri1 = "https://test.ex.com/vocab-1/";
      const vocabIri2 = "https://test.ex.com/vocab-2/";

      const dataset = rdf
        .dataset()
        .add(rdf.quad(rdf.namedNode(vocabIri1), RDF.type, OWL.Ontology))
        .add(rdf.quad(rdf.namedNode(vocabIri2), RDF.type, OWL.Ontology))
        // We need to define at least one term, in our vocab, otherwise we'll
        // blow up with an 'empty vocab' error.
        .add(
          rdf.quad(rdf.namedNode(`${vocabIri1}MyClass`), RDF.type, RDFS.Class),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        // We need to inject a vocab description, even though we didn't add
        // ontology triples, since we want to invoke our heuristic to determine
        // the vocab IRI, and we don't want to blow up on that description
        // check.
        descriptionFallback: DEFAULT_DESCRIPTION.value,
        inputResources: ["does not matter"],
        nameAndPrefixOverride: "test",
      });

      await expect(handler.buildTemplateInput()).rejects.toThrow(vocabIri2);
    });

    it("should report if vocabulary IRI and override are the same", async () => {
      const vocabIri = "https://test.ex.com/vocab/";

      const dataset = rdf
        .dataset()
        .add(rdf.quad(rdf.namedNode(vocabIri), RDF.type, OWL.Ontology))
        // We need to define at least one term, in our vocab, otherwise we'll
        // blow up with an 'empty vocab' error.
        .add(
          rdf.quad(rdf.namedNode(`${vocabIri}MyClass`), RDF.type, RDFS.Class),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        // We need to inject a vocab description, even though we didn't add
        // ontology triples, since we want to invoke our heuristic to determine
        // the vocab IRI, and we don't want to blow up on that description
        // check.
        descriptionFallback: DEFAULT_DESCRIPTION.value,
        inputResources: ["does not matter"],
        nameAndPrefixOverride: "test",

        // Override the same as the vocab IRI itself.
        vocabularyIriOverride: vocabIri,
      });

      const result = await handler.buildTemplateInput();
      expect(result.vocabularyIri).toEqual(vocabIri);
      expect(result.namespaceIri).toEqual(vocabIri);
    });

    it("should fail if multiple namespace IRIs and no namespace override", async () => {
      const vocabIri = "https://test.ex.com/vocab/";
      const namespaceIri1 = "https://test.ex.com/namespace-1/";
      const namespaceIri2 = "https://test.ex.com/namespace-2/";

      const dataset = rdf
        .dataset()
        .add(rdf.quad(rdf.namedNode(vocabIri), RDF.type, OWL.Ontology))
        .add(
          rdf.quad(
            rdf.namedNode(vocabIri),
            VANN.preferredNamespaceUri,
            rdf.namedNode(namespaceIri1),
          ),
        )
        .add(
          rdf.quad(
            rdf.namedNode(vocabIri),
            VANN.preferredNamespaceUri,
            rdf.namedNode(namespaceIri2),
          ),
        )
        // We need to define at least one term, in a namespace, otherwise
        // we'll blow up with an 'empty vocab' error.
        .add(
          rdf.quad(
            rdf.namedNode(`${namespaceIri1}MyClass`),
            RDF.type,
            RDFS.Class,
          ),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        // We need to inject a vocab description, even though we didn't add
        // ontology triples, since we want to invoke our heuristic to determine
        // the vocab IRI, and we don't want to blow up on that description
        // check.
        descriptionFallback: DEFAULT_DESCRIPTION.value,
        inputResources: ["does not matter"],
        nameAndPrefixOverride: "test",
      });

      await expect(handler.buildTemplateInput()).rejects.toThrow(namespaceIri2);
    });

    it("should use namespace IRI override if multiple namespace IRIs, but given namespace override", async () => {
      const vocabIri = "https://test.ex.com/vocab/";
      const namespaceIri1 = "https://test.ex.com/vocab/1/";
      const namespaceIri2 = "https://test.ex.com/vocab/2/";
      const namespaceIri3 = "https://test.ex.com/vocab/3/";

      const dataset = rdf
        .dataset()
        .add(rdf.quad(rdf.namedNode(vocabIri), RDF.type, OWL.Ontology))
        .add(
          rdf.quad(
            rdf.namedNode(vocabIri),
            VANN.preferredNamespaceUri,
            rdf.namedNode(namespaceIri1),
          ),
        )
        .add(
          rdf.quad(
            rdf.namedNode(vocabIri),
            VANN.preferredNamespaceUri,
            rdf.namedNode(namespaceIri2),
          ),
        )
        .add(
          rdf.quad(
            rdf.namedNode(vocabIri),
            VANN.preferredNamespaceUri,
            rdf.namedNode(namespaceIri3),
          ),
        )
        // We need to define at least one term, in a namespace, otherwise
        // we'll blow up with an 'empty vocab' error.
        .add(
          rdf.quad(
            rdf.namedNode(`${namespaceIri2}MyClass`),
            RDF.type,
            RDFS.Class,
          ),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        // We need to inject a vocab description, even though we didn't add
        // ontology triples, since we want to invoke our heuristic to determine
        // the vocab IRI, and we don't want to blow up on that description
        // check.
        descriptionFallback: DEFAULT_DESCRIPTION.value,
        inputResources: ["does not matter"],
        nameAndPrefixOverride: "test",

        // Override the same as the vocab IRI itself.
        namespaceIriOverride: namespaceIri2,
      });

      const result = await handler.buildTemplateInput();
      expect(result.vocabularyIri).toEqual(vocabIri);
      expect(result.namespaceIri).toEqual(namespaceIri2);
    });

    it("should use override if multiple vocabulary IRIs, but given vocabulary override", async () => {
      const vocabIri1 = "https://test.ex.com/vocab-1/";
      const vocabIri2 = "https://test.ex.com/vocab-2/";
      const vocabIri3 = "https://test.ex.com/vocab-3/";

      const dataset = rdf
        .dataset()
        .add(rdf.quad(rdf.namedNode(vocabIri1), RDF.type, OWL.Ontology))
        .add(rdf.quad(rdf.namedNode(vocabIri2), RDF.type, OWL.Ontology))
        .add(rdf.quad(rdf.namedNode(vocabIri3), RDF.type, OWL.Ontology))
        // We need to define at least one term, in our vocab, otherwise we'll
        // blow up with an 'empty vocab' error.
        .add(
          rdf.quad(rdf.namedNode(`${vocabIri2}MyClass`), RDF.type, RDFS.Class),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        // We need to inject a vocab description, even though we didn't add
        // ontology triples, since we want to invoke our heuristic to determine
        // the vocab IRI, and we don't want to blow up on that description
        // check.
        descriptionFallback: DEFAULT_DESCRIPTION.value,
        inputResources: ["does not matter"],
        nameAndPrefixOverride: "test",

        vocabularyIriOverride: vocabIri2,
      });

      const result = await handler.buildTemplateInput();
      expect(result.vocabularyIri).toEqual(vocabIri2);
      expect(result.namespaceIri).toEqual(vocabIri2);
    });

    it("should report if namespace IRI and override are the same", async () => {
      const vocabIri = "https://test.ex.com/vocab/";
      const namespaceIri = "https://test.ex.com/namespace/";

      const dataset = rdf
        .dataset()
        .add(rdf.quad(rdf.namedNode(vocabIri), RDF.type, OWL.Ontology))
        // We need to define at least one term, in our vocab, otherwise we'll
        // blow up with an 'empty vocab' error.
        .add(
          rdf.quad(
            rdf.namedNode(vocabIri),
            VANN.preferredNamespaceUri,
            rdf.namedNode(namespaceIri),
          ),
        )
        .add(
          rdf.quad(
            rdf.namedNode(`${namespaceIri}MyClass`),
            RDF.type,
            RDFS.Class,
          ),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        // We need to inject a vocab description, even though we didn't add
        // ontology triples, since we want to invoke our heuristic to determine
        // the vocab IRI, and we don't want to blow up on that description
        // check.
        descriptionFallback: DEFAULT_DESCRIPTION.value,
        inputResources: ["does not matter"],
        nameAndPrefixOverride: "test",

        // Override the same as the namespace IRI itself.
        namespaceIriOverride: namespaceIri,
      });

      const result = await handler.buildTemplateInput();
      expect(result.vocabularyIri).toEqual(vocabIri);
      expect(result.namespaceIri).toEqual(namespaceIri);
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
      "fr",
    );

    it("should give full description of matching labels and comments in all languages", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInIrish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInIrish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInFrench))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInFrench))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInEnglish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInEnglish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelNoLocale))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentNoLocale));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("[4] labels and comments");
      expect(description).toContain("languages [NoLocale, en, fr, ga]");
    });

    it("should treat 'skosxl:literalForm' as labels in all languages", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, SKOSXL.Label))
        .add(rdf.quad(NAMESPACE_TEST_TERM, SKOSXL.literalForm, labelInIrish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, SKOSXL.literalForm, labelInFrench))
        .add(rdf.quad(NAMESPACE_TEST_TERM, SKOSXL.literalForm, labelInEnglish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, SKOSXL.literalForm, labelNoLocale));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.properties.length).toEqual(1);
      const description = result.properties[0].termDescription;
      expect(description).toContain("[4] labels (");
      expect(description).toContain("languages [NoLocale, en, fr, ga]");
      expect(description).toContain("but no long-form descriptions");
    });

    it("should report all lang tags, but not report mismatch if only on @en", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInIrish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInIrish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInFrench))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInFrench))
        // Deliberately do not have a label in explicit English.
        // .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInEnglish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInEnglish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelNoLocale))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentNoLocale));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("[3] labels");
      expect(description).toContain("languages [NoLocale, fr, ga]");
      expect(description).toContain("[4] comments");
      expect(description).toContain("languages [NoLocale, en, fr, ga]");
      expect(description).not.toContain("mismatch");
    });

    it("should report difference is only in @en vs NoLocale", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInEnglish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentNoLocale));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("only in English");
      expect(description).toContain("language [en]");
      expect(description).toContain("language [NoLocale]");
      expect(description).toContain("we consider the same");
    });

    it("should describe single matching non-English label and comment", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInIrish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInIrish));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("language [ga]");
      expect(description).toContain("[1] label and comment");
    });

    it("should describe single mismatching non-English label and comment", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInIrish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInFrench));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("has a mismatch");
      expect(description).toContain("[1]");
      expect(description).toContain("language [ga]");
      expect(description).toContain("language [fr]");
    });

    it("should describe multiple matching non-English label and comment", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInIrish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInFrench))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInIrish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInFrench));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("[2] labels and comments");
      expect(description).toContain("languages [fr, ga]");
    });

    it("should say no long-form description if no comment at all", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(
          rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, rdf.literal("label", "en")),
        )
        .add(
          rdf.quad(
            NAMESPACE_TEST_TERM,
            RDFS.label,
            rdf.literal("label no lang"),
          ),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      expect(result.classes[0].termDescription).toContain(
        "no long-form descriptions at all",
      );
    });

    it("should describe mismatch label and missing comment", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInEnglish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInEnglish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInIrish));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("mismatch");
      expect(description).toContain("languages [en, ga]");
      expect(description).toContain("language [en]");
    });

    it("should describe single label and no comments", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInIrish));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("term has a label");
      expect(description).toContain("in language [ga]");
      expect(description).toContain("no long-form descriptions at all");
    });

    it("should describe multiple labels and no comments", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInIrish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelNoLocale))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInFrench));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("term has [3] labels");
      expect(description).toContain("in languages [NoLocale, fr, ga]");
      expect(description).toContain("no long-form descriptions at all");
    });

    it("should describe single label and comment in English only", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelInEnglish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInEnglish));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("descriptions only in English");
    });

    it("should describe single label and comment in no-locale only", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.label, labelNoLocale))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentNoLocale));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain(
        "descriptions only with no explicit locale",
      );
    });

    it("should describe mismatch comment and multiple missing label", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDF.type, RDFS.Class))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInIrish))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.comment, commentInFrench));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      const description = result.classes[0].termDescription;
      expect(description).toContain("mismatch");
      expect(description).toContain("[0] labels");
      expect(description).toContain("languages [fr, ga]");
    });
  });

  describe("handle sub-classes or sub-properties", () => {
    it("should handle sub-classes", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.subClassOf, SKOS.Concept));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.classes.length).toEqual(1);
      expect(result.classes[0].value).toEqual(NAMESPACE_TEST_TERM.name);
    });

    it("should handle sub-properties", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, RDFS.label, DEFAULT_DESCRIPTION))
        .add(
          rdf.quad(
            rdf.namedNode("http://www.w3.org/2001/XMLSchema#float"),
            RDFS.subPropertyOf,
            rdf.literal(
              "Also need to make sure we ignore terms from XSD namespace...",
            ),
          ),
        )
        .add(
          rdf.quad(NAMESPACE_TEST_TERM, RDFS.subPropertyOf, SKOS.definition),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.properties.length).toEqual(1);
      expect(result.properties[0].value).toEqual(NAMESPACE_TEST_TERM.name);
    });
  });

  it("should ignore vocab terms not in our namespace, if configured to do so", async () => {
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .add(rdf.quad(NAMESPACE_IRI, DCTERMS.description, DEFAULT_DESCRIPTION))
      .add(
        rdf.quad(
          rdf.namedNode("https://ex.com/different-namespace#term"),
          RDF.type,
          RDFS.Class,
        ),
      );

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
      ignoreNonVocabTerms: true,
    });
    const result = await handler.buildTemplateInput();
    expect(result.classes.length).toEqual(0);
  });

  it("should makes exceptions for vocab terms found in common vocabs - RDF:langString", async () => {
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .add(rdf.quad(NAMESPACE_IRI, DCTERMS.description, DEFAULT_DESCRIPTION))
      .add(rdf.quad(RDF.langString, RDF.type, RDFS.Datatype));

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
    });
    const result = await handler.buildTemplateInput();
    expect(result.properties.length).toEqual(0);
  });

  it("should makes exceptions for vocab terms found in common vocabs - XSD:duration", async () => {
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .add(rdf.quad(NAMESPACE_IRI, DCTERMS.description, DEFAULT_DESCRIPTION))
      .add(
        rdf.quad(
          rdf.namedNode("http://www.w3.org/2001/XMLSchema#duration"),
          RDF.type,
          RDFS.Datatype,
        ),
      );

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
    });

    const result = await handler.buildTemplateInput();
    expect(result.properties.length).toEqual(0);
  });

  it("should de-duplicate terms defined with multiple predicates we look for", async () => {
    // Note: This test relies on the order different predicates are processing
    // in the implementation - i.e. if a subject matches multiple RDF types,
    // then only the first one will be used.
    const testTermClass = rdf.namedNode(`${NAMESPACE}testTermClass`);
    const testTermProperty = rdf.namedNode(`${NAMESPACE}testTermProperty`);
    const testTermLiteral = rdf.namedNode(`${NAMESPACE}testTermLiteral`);
    const testTermConstantIri = rdf.namedNode(
      `${NAMESPACE}testTermConstantIri`,
    );
    const testTermConstantString = rdf.namedNode(
      `${NAMESPACE}testTermConstantString`,
    );

    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .add(rdf.quad(NAMESPACE_IRI, DCTERMS.description, DEFAULT_DESCRIPTION))
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
          ARTIFACT_GENERATOR.ConstantString,
        ),
      ]);

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
    });

    const result = await handler.buildTemplateInput();
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

  it("should skip classes and sub-classes from other, but well-known, vocabs", async () => {
    // Create terms that look they come from a well-known vocab.
    const testTermClass = rdf.namedNode(`${RDF_NAMESPACE}testTermClass`);
    const testTermSubClass = rdf.namedNode(`${RDF_NAMESPACE}testTermSubClass`);

    const dataset = rdf.dataset().addAll([
      // Define this ontology as having it's own namespace...
      rdf.quad(NAMESPACE_IRI, RDF.type, OWL.Ontology),
      rdf.quad(NAMESPACE_IRI, DCTERMS.description, DEFAULT_DESCRIPTION),
      rdf.quad(NAMESPACE_IRI, VANN.preferredNamespaceUri, NAMESPACE_IRI),
      rdf.quad(NAMESPACE_IRI, VANN.preferredNamespacePrefix, DEFAULT_PREFIX),

      // ...now add terms from different, but **well-known**, namespaces:
      rdf.quad(testTermClass, RDF.type, RDFS.Class),
      rdf.quad(testTermSubClass, RDFS.subClassOf, RDFS.Class),
    ]);

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
    });

    const result = await handler.buildTemplateInput();
    expect(result.classes.length).toEqual(0);
  });

  it("should fail if no prefix is defined in the vocabulary", () => {
    const NS = "https://some.namespace.com/";
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
      handler.lookupNamespaceDetails(NS);
    }).toThrow("No prefix defined for vocabulary");
  });

  it("should fail if no prefix is defined *and* no vocabulary IRI", () => {
    const NS = "https://some.namespace.com/";
    const NS_IRI = rdf.namedNode(NS);

    const vocab = rdf
      .dataset()
      .addAll([rdf.quad(NS_IRI, VANN.preferredNamespaceUri, NS_IRI)]);

    const handler = new DatasetHandler(vocab, rdf.dataset(), {
      inputResources: ["does not matter"],
    });

    expect(() => {
      handler.lookupNamespaceDetails(undefined);
    }).toThrow("Could not be determined");
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

    const namespaceDetails = handler.lookupNamespaceDetails(NS);
    expect(namespaceDetails.namespacePrefix).toEqual("foaf");
  });

  it("should throw an error if the vocabulary does not define any term", async () => {
    const NS = "http://xmlns.com/foaf/0.1/";
    const NS_IRI = rdf.namedNode(NS);

    const vocab = rdf
      .dataset()
      .addAll([
        rdf.quad(NS_IRI, RDF.type, OWL.Ontology),
        rdf.quad(NS_IRI, DCTERMS.description, DEFAULT_DESCRIPTION),
        rdf.quad(NS_IRI, VANN.preferredNamespaceUri, NS_IRI),
      ]);

    const handler = new DatasetHandler(vocab, rdf.dataset(), {
      inputResources: ["does not matter"],
    });

    await expect(handler.buildTemplateInput()).rejects.toThrow(
      `[${NS}] does not contain any terms.`,
    );
  });

  it("should override the namespace of the terms", async () => {
    const namespaceIriOverride = "https://override.namespace.org/";
    const testTermClass = `${namespaceIriOverride}testTermClass`;
    const dataset = rdf
      .dataset()
      .addAll(vocabMetadata)
      .addAll([
        rdf.quad(NAMESPACE_IRI, DCTERMS.description, DEFAULT_DESCRIPTION),
        rdf.quad(rdf.namedNode(testTermClass), RDF.type, RDFS.Class),
      ]);

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      inputResources: ["does not matter"],
      nameAndPrefixOverride: "does not matter",
      namespaceIriOverride,
      descriptionFallback: "Overridden namespace needs a description too...",
    });

    const result = await handler.buildTemplateInput();
    expect(result.namespaceIri).toEqual(namespaceIriOverride);
  });

  it("should override the namespace of the terms if the heuristic namespace determination fails.", async () => {
    const namespaceIriOverride = NAMESPACE;
    const testTermClass = `${NAMESPACE}testTermClass`;

    const otherNamespace = "https://another.long.namespace.org/";
    const longestTerm = `${otherNamespace}thisIsAVeryLongTermThatBreaksOurHeuristic`;

    const dataset = rdf
      .dataset()
      // Don't add the VANN.preferredNamespacePrefix, so that we invoke our
      // heuristic to guess it instead.
      // .addAll(vocabMetadata)
      .addAll([rdf.quad(rdf.namedNode(testTermClass), RDF.type, RDFS.Class)])
      .addAll([
        rdf.quad(
          rdf.namedNode(longestTerm),
          RDF.type,
          `${otherNamespace}someClass`,
        ),
      ]);

    const handler = new DatasetHandler(dataset, rdf.dataset(), {
      // We need to inject a vocab description, even though we didn't add
      // ontology triples, since we want to invoke our heuristic to determine
      // the vocab IRI, and we don't want to blow up on that description
      // check.
      descriptionFallback: DEFAULT_DESCRIPTION.value,
      inputResources: ["does not matter"],
      namespaceIriOverride,
      nameAndPrefixOverride: "does not matter",
    });

    const result = await handler.buildTemplateInput();
    expect(result.namespaceIri).toEqual(namespaceIriOverride);
  });

  describe("Handle SHACL prefix declarations", () => {
    it("should pick up namespace details from vocab SHACL declaration", () => {
      const NS = "https://some.namespace.com/";
      const NS_IRI = rdf.namedNode(NS);
      const PREFIX_DELCARATION =
        "https://some.namespace.com/vocab_prefix_declaration/";
      const PREFIX_DELCARATION_IRI = rdf.namedNode(PREFIX_DELCARATION);
      const TEST_PREFIX = "test_prefix";

      const vocab = rdf
        .dataset()
        .addAll([
          rdf.quad(NS_IRI, RDF.type, OWL.Ontology),
          rdf.quad(NS_IRI, SHACL.declare, PREFIX_DELCARATION_IRI),
          rdf.quad(PREFIX_DELCARATION_IRI, RDF.type, SHACL.PrefixDeclaration),
          rdf.quad(PREFIX_DELCARATION_IRI, SHACL.namespace, NS_IRI),
          rdf.quad(
            PREFIX_DELCARATION_IRI,
            SHACL.prefix,
            rdf.literal(TEST_PREFIX),
          ),
        ]);

      const handler = new DatasetHandler(vocab, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const namespaceDetails = handler.lookupNamespaceDetails(NS);
      expect(namespaceDetails.namespacePrefix).toEqual(TEST_PREFIX);
    });
  });

  describe("storing local copy of vocab", () => {
    it("should store local copy", async () => {
      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, DCTERMS.description, DEFAULT_DESCRIPTION))
        .add(rdf.quad(NAMESPACE_TEST_TERM, RDFS.subClassOf, SKOS.Concept));

      const testLocalCopyDirectory = path.join(
        ".",
        "test",
        "Generated",
        "UNIT_TEST",
        "LocalCopyOfVocab",
        "testStoringVocab",
      );
      rimraf.sync(testLocalCopyDirectory);

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
        storeLocalCopyOfVocabDirectory: testLocalCopyDirectory,
      });

      await handler.buildTemplateInput();

      const matches = fs.readdirSync(testLocalCopyDirectory).filter(
        (filename) =>
          // Here we are testing for the file, but also the hash of its
          // contents...
          filename.startsWith(`rdf-ext-`) &&
          filename.endsWith(`--745960813__https---rdf-extension.com-.ttl`),
      );
      expect(matches.length).toBe(1);
    });
  });

  describe("transform term names that would be invalid in programming languages", () => {
    it("should prefix leading digit", async () => {
      const testTerm = "0To60Mph";
      const testTermProperty = rdf.namedNode(`${NAMESPACE}${testTerm}`);

      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, DCTERMS.description, DEFAULT_DESCRIPTION))
        .add(rdf.quad(testTermProperty, RDF.type, RDF.Property));

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
      });

      const result = await handler.buildTemplateInput();
      expect(result.properties.length).toEqual(1);
      expect(result.properties[0].nameEscapedForLanguage).toEqual(
        `_${testTerm}`,
      );
    });
  });

  describe("Best Practice compliance report", () => {
    it("should generate Best Practice compliance report if configured", async () => {
      const testTerm = "0To60Mph";
      const testTermProperty = rdf.namedNode(`${NAMESPACE}${testTerm}`);

      const dataset = rdf
        .dataset()
        .addAll(vocabMetadata)
        .add(rdf.quad(NAMESPACE_IRI, DCTERMS.description, DEFAULT_DESCRIPTION))
        .add(
          rdf.quad(
            rdf.namedNode(`${NAMESPACE}testTerm`),
            RDF.type,
            RDF.Property,
          ),
        );

      const handler = new DatasetHandler(dataset, rdf.dataset(), {
        inputResources: ["does not matter"],
        reportBestPracticeCompliance: true,
      });

      const result = await handler.buildTemplateInput();
      expect(result.complianceReport).not.toBeUndefined();
      expect(result.complianceReport.totalTermCount).toEqual(1);
    });
  });

  describe("first dataset value", () => {
    it("should return default if no quads", () => {
      const testDefaultValue = "test default value";
      expect(
        DatasetHandler.firstDatasetValue(rdf.dataset(), "ga", testDefaultValue),
      ).toEqual(testDefaultValue);
    });

    it("should return value with no language tag", () => {
      const realValue = "real value";
      const testDefaultValue = "test default value";
      expect(
        DatasetHandler.firstDatasetValue(
          rdf
            .dataset()
            .add(rdf.quad(OWL.Class, RDFS.label, rdf.literal(realValue))),
          undefined,
          testDefaultValue,
        ),
      ).toEqual(realValue);
    });

    it("should return value with language tag", () => {
      const realValue = "luach fíor, as Gaeilge";
      const testDefaultValue = "test default value";
      expect(
        DatasetHandler.firstDatasetValue(
          rdf
            .dataset()
            .add(rdf.quad(OWL.Class, RDFS.label, rdf.literal(realValue, "ga"))),
          "ga",
          testDefaultValue,
        ),
      ).toEqual(realValue);
    });
  });
});
