require("mock-local-storage");

const rdf = require("rdf-ext");
const fs = require("fs");
const path = require("path");

const {
  RDF,
  RDFS,
  SCHEMA_DOT_ORG,
  OWL,
  OWL_NAMESPACE,
  VANN,
  DCTERMS,
  SKOS,
} = require("../CommonTerms");
const VocabGenerator = require("./VocabGenerator");
const { mergeDatasets } = require("../Util");

const testDataset = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA_DOT_ORG.Person, RDF.type, RDFS.Class),
    rdf.quad(SCHEMA_DOT_ORG.Person, RDFS.label, rdf.literal("Person", "en")),
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      RDFS.comment,
      rdf.literal("Person dead or alive", "en"),
    ),

    rdf.quad(SCHEMA_DOT_ORG.givenName, RDF.type, RDF.Property),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.label,
      rdf.literal("givenName", ""),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.comment,
      rdf.literal("A given name is the first name of a person.", "en"),
    ),

    rdf.quad(SCHEMA_DOT_ORG.familyName, RDF.type, RDF.Property),
    rdf.quad(
      SCHEMA_DOT_ORG.familyName,
      RDFS.label,
      rdf.literal("familyName", "fr"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.familyName,
      RDFS.comment,
      rdf.literal("A family name is the last name of a person.", "en"),
    ),
  ]);

const testDatasetExtension = rdf
  .dataset()
  .addAll([
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Person-fr", "fr"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Person-de", "de"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Person-es", "es"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      RDFS.comment,
      rdf.literal("Person dead or alive fr", "fr"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      RDFS.comment,
      rdf.literal("Person dead or alive de", "de"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      RDFS.comment,
      rdf.literal("Person dead or alive es", "es"),
    ),

    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Given Name", "en"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Given Name-fr", "fr"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Given Name-de", "de"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Given Name-es", "es"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.comment,
      rdf.literal("Given name of a person fr", "fr"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.comment,
      rdf.literal("Given name of a person de", "de"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.comment,
      rdf.literal("Given name of a person es", "es"),
    ),
  ]);

const extSubject = rdf.namedNode("http://rdf-extension.com/");
const owlOntologyDataset = rdf.dataset().addAll([
  rdf.quad(extSubject, RDF.type, OWL.Ontology),
  rdf.quad(extSubject, RDFS.label, rdf.literal("Extension label")),
  rdf.quad(extSubject, DCTERMS.creator, rdf.literal("Jarlath Holleran")),
  rdf.quad(
    extSubject,
    DCTERMS.description,
    rdf.literal("Extension comment with special ' character!"),
  ),
  rdf.quad(
    extSubject,
    VANN.preferredNamespacePrefix,
    rdf.literal("ext-prefix"),
  ),
  rdf.quad(
    extSubject,
    VANN.preferredNamespaceUri,
    rdf.literal("http://rdf-extension.com/"),
  ),
  // This triple prevents the dataset from not defining any terms
  rdf.quad(
    rdf.namedNode("http://rdf-extension.com/dummyClass"),
    RDF.type,
    OWL.Class,
  ),
]);

const dataSetA = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA_DOT_ORG.Person, RDF.type, RDFS.Class),
    rdf.quad(SCHEMA_DOT_ORG.Person, RDFS.label, rdf.literal("Person")),
  ]);

const dataSetB = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA_DOT_ORG.givenName, RDF.type, RDF.Property),
    rdf.quad(SCHEMA_DOT_ORG.givenName, RDFS.label, rdf.literal("Given Name")),
  ]);

const dataSetC = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA_DOT_ORG.familyName, RDF.type, RDF.Property),
    rdf.quad(
      SCHEMA_DOT_ORG.familyName,
      RDFS.label,
      rdf.literal("Family Name"),
      "en",
    ),
  ]);

const dataSetD = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA_DOT_ORG.familyName, RDF.type, RDF.Property),
    rdf.quad(
      SCHEMA_DOT_ORG.familyName,
      SKOS.definition,
      rdf.literal("Family Name"),
      "en",
    ),
  ]);

const overrideLabelTerms = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA_DOT_ORG.Person, RDFS.label, rdf.literal("Override Person")),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.label,
      rdf.literal("Override Given Name"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.familyName,
      RDFS.label,
      rdf.literal("Override Family Name"),
      "en",
    ),
  ]);

const overrideCommentTerms = rdf
  .dataset()
  .addAll([
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      RDFS.comment,
      rdf.literal("Override comment for Person"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.comment,
      rdf.literal("Override comment for Given Name"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.familyName,
      RDFS.comment,
      rdf.literal("Override comment for Family Name"),
      "en",
    ),
  ]);

const overrideAtlNameTerms = rdf
  .dataset()
  .addAll([
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Alt Person"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Alt Given Name"),
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.familyName,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Alt Family Name"),
      "en",
    ),
  ]);

const NAMESPACE = "https://schema.org/";
const NAMESPACE_IRI = rdf.namedNode(NAMESPACE);
const DEFAULT_DESCRIPTION = rdf.literal("Default vocab description...", "en");
const DEFAULT_PREFIX = rdf.literal("schema");

const vocabMetadata = rdf
  .dataset()
  .addAll([
    rdf.quad(NAMESPACE_IRI, RDF.type, OWL.Ontology),
    rdf.quad(NAMESPACE_IRI, DCTERMS.description, DEFAULT_DESCRIPTION),
    rdf.quad(NAMESPACE_IRI, VANN.preferredNamespaceUri, NAMESPACE_IRI),
    rdf.quad(NAMESPACE_IRI, VANN.preferredNamespacePrefix, DEFAULT_PREFIX),
  ]);

const messageTerm = rdf.namedNode(`${NAMESPACE}hello`);
const literalDataset = rdf
  .dataset()
  .addAll([
    rdf.quad(NAMESPACE_IRI, RDF.type, OWL.Ontology),
    rdf.quad(NAMESPACE_IRI, DCTERMS.description, DEFAULT_DESCRIPTION),
    rdf.quad(NAMESPACE_IRI, VANN.preferredNamespaceUri, NAMESPACE_IRI),
    rdf.quad(NAMESPACE_IRI, VANN.preferredNamespacePrefix, "vocab_gen"),
  ])
  .addAll([
    rdf.quad(messageTerm, RDF.type, RDFS.Literal),
    rdf.quad(messageTerm, RDFS.label, rdf.literal("Hello", "en")),
    rdf.quad(messageTerm, RDFS.label, rdf.literal("Hola", "es")),
    rdf.quad(messageTerm, RDFS.label, rdf.literal("Bonjour", "fr")),
    rdf.quad(messageTerm, RDFS.comment, rdf.literal("Hello there", "en")),
    rdf.quad(messageTerm, RDFS.comment, rdf.literal("Hola", "es")),
    rdf.quad(messageTerm, RDFS.comment, rdf.literal("Bonjour", "fr")),
    rdf.quad(messageTerm, SKOS.definition, rdf.literal("Welcome", "en")),
    rdf.quad(messageTerm, SKOS.definition, rdf.literal("Bienvenido", "es")),
    rdf.quad(messageTerm, SKOS.definition, rdf.literal("Bienvenue", "fr")),
    rdf.quad(messageTerm, RDFS.seeAlso, rdf.namedNode(OWL_NAMESPACE)),
    rdf.quad(messageTerm, SKOS.isDefinedBy, NAMESPACE_IRI),
  ]);

describe("Vocab generator unit tests", () => {
  beforeEach(() => {
    delete process.env.IRI_HINT_APPLICATION;
    delete process.env.DATA_SERVER_SOLID;
  });

  describe("Generating data", () => {
    const vocabGenerator = new VocabGenerator({
      inputResources: [],
      artifactVersion: "1.0.0",
      moduleNamePrefix: "generated-vocab-",
    });

    it("should report input and term selection resources in generation failures", async () => {
      vocabGenerator.artifactDetails = {
        programmingLanguage: "doesn't-matter",
        sourceCodeTemplate: "do-not-care",
      };
      await expect(vocabGenerator.generateVocab()).rejects.toThrow(
        "Namespace IRI could not be determined",
      );

      vocabGenerator.vocabData.termSelectionResource = "some-value-any-value";
      await expect(vocabGenerator.generateVocab()).rejects.toThrow(
        vocabGenerator.vocabData.termSelectionResource,
      );
    });
  });

  describe("Building the Template input", () => {
    const vocabGenerator = new VocabGenerator({
      inputResources: [],
      artifactVersion: "1.0.0",
      moduleNamePrefix: "generated-vocab-",
    });

    it("should create a simple JSON object with all the fields", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([vocabMetadata, testDataset]),
        testDatasetExtension,
      );
      expect(result.namespaceIri).toBe("https://schema.org/");
      expect(result.artifactName).toBe("generated-vocab-schema");
      expect(result.vocabNameUpperCase).toBe("SCHEMA");
      expect(result.classes[0].name).toBe("Person");
      expect(result.classes[0].comment).toBe("Person dead or alive");

      const personLabels = result.classes[0].labels;
      expect(personLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Person",
            valueEscapedForJavaScript: "Person",
            valueEscapedForJava: "Person",
            language: "en",
          },
        ]),
      );

      expect(personLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Person-fr",
            valueEscapedForJavaScript: "Person-fr",
            valueEscapedForJava: "Person-fr",
            language: "fr",
          },
        ]),
      );
      expect(personLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Person-de",
            valueEscapedForJavaScript: "Person-de",
            valueEscapedForJava: "Person-de",
            language: "de",
          },
        ]),
      );
      expect(personLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Person-es",
            valueEscapedForJavaScript: "Person-es",
            valueEscapedForJava: "Person-es",
            language: "es",
          },
        ]),
      );

      expect(result.properties[0].name).toBe("givenName");
      expect(result.properties[0].comment).toBe(
        "A given name is the first name of a person.",
      );
      const givenNameLabels = result.properties[0].labels;

      expect(givenNameLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Given Name",
            valueEscapedForJavaScript: "Given Name",
            valueEscapedForJava: "Given Name",
            language: "en",
          },
        ]),
      );
      expect(givenNameLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Given Name-fr",
            valueEscapedForJavaScript: "Given Name-fr",
            valueEscapedForJava: "Given Name-fr",
            language: "fr",
          },
        ]),
      );
      expect(givenNameLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Given Name-de",
            valueEscapedForJavaScript: "Given Name-de",
            valueEscapedForJava: "Given Name-de",
            language: "de",
          },
        ]),
      );
      expect(givenNameLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Given Name-es",
            valueEscapedForJavaScript: "Given Name-es",
            valueEscapedForJava: "Given Name-es",
            language: "es",
          },
        ]),
      );
    });

    it("should merge A and B, and generate code from A and B", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([vocabMetadata, dataSetA, dataSetB]),
        mergeDatasets([dataSetA, dataSetB]),
      );

      expect(result.classes[0].name).toBe("Person");
      expect(result.properties[0].name).toBe("givenName");
    });

    it("should merge A and B, and generate code from A (not B)", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([vocabMetadata, dataSetA, dataSetB]),
        dataSetA,
      );

      expect(result.classes[0].name).toBe("Person");
      expect(result.properties.length).toBe(0);
    });

    it("should merge A and B, and generate code from B (not A)", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([vocabMetadata, dataSetA, dataSetB]),
        dataSetB,
      );

      expect(result.classes.length).toBe(0);
      expect(result.properties[0].name).toBe("givenName");
    });

    it("should merge A B and C, and generate code from A and B (not C)", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([vocabMetadata, dataSetA, dataSetB, dataSetC]),
        mergeDatasets([dataSetA, dataSetB]),
      );

      expect(result.classes[0].name).toBe("Person");
      expect(result.properties[0].name).toBe("givenName");
      expect(result.properties.length).toBe(1);
    });

    it("should throw for empty datasets", async () => {
      const emptyDataSet = rdf.dataset();

      await expect(
        vocabGenerator.buildTemplateInput(
          mergeDatasets([vocabMetadata, emptyDataSet]),
          emptyDataSet,
        ),
      ).rejects.toThrow("does not contain any terms");
    });

    it("should use the label value if no comment and no definition", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([vocabMetadata, dataSetA, dataSetB]),
        dataSetB,
      );

      expect(result.properties[0].name).toBe("givenName");
      expect(result.properties.length).toBe(1);
      expect(result.properties[0].comment).toBe("Given Name");
    });

    it("should use the definition value if no comment", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([vocabMetadata, dataSetD]),
        rdf.dataset(),
      );

      expect(result.properties[0].name).toBe("familyName");
      expect(result.properties.length).toBe(1);
      expect(result.properties[0].comment).toBe("Family Name");
    });

    it("should take any comment for the class or property if english or default cant be found", async () => {
      const dataSetFrenchOnlyComment = rdf
        .dataset()
        .addAll([
          rdf.quad(SCHEMA_DOT_ORG.givenName, RDF.type, RDF.Property),
          rdf.quad(
            SCHEMA_DOT_ORG.givenName,
            RDFS.comment,
            rdf.literal("Given Name comment in french", "fr"),
          ),
        ]);

      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([vocabMetadata, dataSetA, dataSetFrenchOnlyComment]),
        dataSetFrenchOnlyComment,
      );

      expect(result.properties[0].name).toBe("givenName");
      expect(result.properties.length).toBe(1);
      expect(result.properties[0].comment).toBe("Given Name comment in french");
    });

    it("should return empty comment if nothing found at all", async () => {
      const noDescriptivePredicates = rdf
        .dataset()
        .add(rdf.quad(SCHEMA_DOT_ORG.givenName, RDF.type, RDF.Property));

      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([vocabMetadata, dataSetA, noDescriptivePredicates]),
        noDescriptivePredicates,
      );

      expect(result.properties[0].name).toBe("givenName");
      expect(result.properties.length).toBe(1);
      expect(result.properties[0].comment).toBe("");
    });

    it("should allow the prefix for the name of the module can be configured", async () => {
      const overridePrefixGenerator = new VocabGenerator({
        inputResources: [],
        artifactVersion: "1.0.0",
        moduleNamePrefix: "my-company-prefix-",
      });

      const result = await overridePrefixGenerator.buildTemplateInput(
        mergeDatasets([vocabMetadata, testDataset]),
        rdf.dataset(),
      );

      expect(result.artifactName).toBe("my-company-prefix-schema");
    });

    it("should create label vocab terms for literals", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([literalDataset]),
        rdf.dataset(),
      );

      const messageLiterals = result.literals[0].labels;

      expect(messageLiterals).toEqual(
        expect.arrayContaining([
          {
            value: "Hello",
            valueEscapedForJavaScript: "Hello",
            valueEscapedForJava: "Hello",
            language: "en",
          },
        ]),
      );

      expect(messageLiterals).toEqual(
        expect.arrayContaining([
          {
            value: "Hola",
            valueEscapedForJavaScript: "Hola",
            valueEscapedForJava: "Hola",
            language: "es",
          },
        ]),
      );

      expect(messageLiterals).toEqual(
        expect.arrayContaining([
          {
            value: "Bonjour",
            valueEscapedForJavaScript: "Bonjour",
            valueEscapedForJava: "Bonjour",
            language: "fr",
          },
        ]),
      );
    });

    it("should create comments vocab terms for literals", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([literalDataset]),
        rdf.dataset(),
      );

      const messageComments = result.literals[0].comments;

      expect(messageComments).toEqual(
        expect.arrayContaining([
          {
            value: "Hello there",
            valueEscapedForJavaScript: "Hello there",
            valueEscapedForJava: "Hello there",
            language: "en",
          },
        ]),
      );

      expect(messageComments).toEqual(
        expect.arrayContaining([
          {
            value: "Hola",
            valueEscapedForJavaScript: "Hola",
            valueEscapedForJava: "Hola",
            language: "es",
          },
        ]),
      );

      expect(messageComments).toEqual(
        expect.arrayContaining([
          {
            value: "Bonjour",
            valueEscapedForJavaScript: "Bonjour",
            valueEscapedForJava: "Bonjour",
            language: "fr",
          },
        ]),
      );
    });

    it("should create defination vocab terms for literals", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([literalDataset]),
        rdf.dataset(),
      );

      const messageDefinitions = result.literals[0].definitions;

      expect(messageDefinitions).toEqual(
        expect.arrayContaining([
          {
            value: "Welcome",
            valueEscapedForJavaScript: "Welcome",
            valueEscapedForJava: "Welcome",
            language: "en",
          },
        ]),
      );

      expect(messageDefinitions).toEqual(
        expect.arrayContaining([
          {
            value: "Bienvenido",
            valueEscapedForJavaScript: "Bienvenido",
            valueEscapedForJava: "Bienvenido",
            language: "es",
          },
        ]),
      );

      expect(messageDefinitions).toEqual(
        expect.arrayContaining([
          {
            value: "Bienvenue",
            valueEscapedForJavaScript: "Bienvenue",
            valueEscapedForJava: "Bienvenue",
            language: "fr",
          },
        ]),
      );
    });
  });

  describe("Vocab terms from extension dataset", () => {
    const vocabGenerator = new VocabGenerator({
      inputResources: [],
      artifactVersion: "1.0.0",
      moduleNamePrefix: "generated-vocab-",
    });

    it("should override label terms of the main datasets", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([
          vocabMetadata,
          dataSetA,
          dataSetB,
          dataSetC,
          overrideLabelTerms,
        ]),
        overrideLabelTerms,
      );

      const person = result.classes[0];

      expect(person.name).toBe("Person");
      expect(person.labels.length).toBe(1);
      expect(person.labels[0].value).toBe("Override Person");

      const givenName = result.properties[0];

      expect(givenName.name).toBe("givenName");
      expect(givenName.labels.length).toBe(1);
      expect(givenName.labels[0].value).toBe("Override Given Name");

      const familyName = result.properties[1];

      expect(familyName.name).toBe("familyName");
      expect(familyName.labels.length).toBe(1);
      expect(familyName.labels[0].value).toBe("Override Family Name");
    });

    it("should override comment terms of the main datasets", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([
          vocabMetadata,
          dataSetA,
          dataSetB,
          dataSetC,
          overrideCommentTerms,
        ]),
        overrideCommentTerms,
      );

      const person = result.classes[0];

      expect(person.name).toBe("Person");
      expect(person.comments.length).toBe(1);
      expect(person.comments[0].value).toBe("Override comment for Person");

      const givenName = result.properties[0];

      expect(givenName.name).toBe("givenName");
      expect(givenName.comments.length).toBe(1);
      expect(givenName.comments[0].value).toBe(
        "Override comment for Given Name",
      );

      const familyName = result.properties[1];

      expect(familyName.name).toBe("familyName");
      expect(familyName.comments.length).toBe(1);
      expect(familyName.comments[0].value).toBe(
        "Override comment for Family Name",
      );
    });

    it("should override label with alternativeNames from the vocab terms", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([
          vocabMetadata,
          dataSetA,
          dataSetB,
          dataSetC,
          overrideAtlNameTerms,
        ]),
        overrideAtlNameTerms,
      );

      const person = result.classes[0];

      expect(person.name).toBe("Person");
      expect(person.labels.length).toBe(1);
      expect(person.labels[0].value).toBe("Alt Person");

      const givenName = result.properties[0];

      expect(givenName.name).toBe("givenName");
      expect(givenName.labels.length).toBe(1);
      expect(givenName.labels[0].value).toBe("Alt Given Name");

      const familyName = result.properties[1];

      expect(familyName.name).toBe("familyName");
      expect(familyName.labels.length).toBe(1);
      expect(familyName.labels[0].value).toBe("Alt Family Name");
    });

    it("should create definition vocab terms for literals from extensions", async () => {
      const generator = new VocabGenerator({
        inputResources: [],
        artifactVersion: "1.0.0",
        moduleNamePrefix: "my-company-prefix-",
      });

      const result = await generator.buildTemplateInput(
        mergeDatasets([testDataset, literalDataset]),
        literalDataset,
      );

      const messageDefinitions = result.literals[0].definitions;

      expect(messageDefinitions).toEqual(
        expect.arrayContaining([
          {
            value: "Welcome",
            valueEscapedForJavaScript: "Welcome",
            valueEscapedForJava: "Welcome",
            language: "en",
          },
        ]),
      );

      expect(messageDefinitions).toEqual(
        expect.arrayContaining([
          {
            value: "Bienvenido",
            valueEscapedForJavaScript: "Bienvenido",
            valueEscapedForJava: "Bienvenido",
            language: "es",
          },
        ]),
      );

      expect(messageDefinitions).toEqual(
        expect.arrayContaining([
          {
            value: "Bienvenue",
            valueEscapedForJavaScript: "Bienvenue",
            valueEscapedForJava: "Bienvenue",
            language: "fr",
          },
        ]),
      );
    });

    it("should take description from the rdfs:comment of an owl:Ontology term", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([testDataset, owlOntologyDataset]),
        owlOntologyDataset,
      );

      expect(result.artifactName).toBe("generated-vocab-ext-prefix");
      expect(result.namespaceIri).toBe("http://rdf-extension.com/");
      expect(result.vocabNameUpperCase).toBe("EXT_PREFIX");
      expect(result.description).toBe(
        "Extension comment with special ' character!",
      );
    });

    it("should throw if description of an owl:Ontology term is not found", async () => {
      const owlOntologyDatasetWithNoDescription = rdf
        .dataset()
        .addAll([
          rdf.quad(extSubject, RDF.type, OWL.Ontology),
          rdf.quad(
            extSubject,
            VANN.preferredNamespacePrefix,
            rdf.literal("test_prefix"),
          ),
        ]);

      await expect(
        vocabGenerator.buildTemplateInput(
          mergeDatasets([testDataset, owlOntologyDatasetWithNoDescription]),
          owlOntologyDatasetWithNoDescription,
        ),
      ).rejects.toThrow(`Cannot find a description`);
    });

    it("should read authors from owl:Ontology terms", async () => {
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([testDataset, owlOntologyDataset]),
        owlOntologyDataset,
      );

      expect(result.authorSet.has("Jarlath Holleran"));
    });

    it("should default to lit-js@inrupt.com if authors in not contained in owl:Ontology terms", async () => {
      const owlOntologyDatasetWithNoAuthor = rdf.dataset().addAll([
        rdf.quad(extSubject, RDF.type, OWL.Ontology),
        rdf.quad(extSubject, RDFS.label, rdf.literal("Extension label")),
        rdf.quad(extSubject, RDFS.comment, rdf.literal("Extension comment")),
        rdf.quad(
          extSubject,
          VANN.preferredNamespacePrefix,
          rdf.literal("ext-prefix"),
        ),
        rdf.quad(
          extSubject,
          VANN.preferredNamespaceUri,
          rdf.literal("http://rdf-extension.com/"),
        ),
        // This triple prevents the dataset from not defining any terms
        rdf.quad(
          rdf.namedNode("http://rdf-extension.com/dummyClass"),
          RDF.type,
          OWL.Class,
        ),
      ]);
      const result = await vocabGenerator.buildTemplateInput(
        mergeDatasets([testDataset, owlOntologyDatasetWithNoAuthor]),
        owlOntologyDatasetWithNoAuthor,
      );

      expect(result.authorSet.has("@inrupt/artifact-generator-js"));
    });
  });
});

describe("Managing remote vocabularies failures", () => {
  it("should not override an existing file if the associated vocabulary is unreachable", async () => {
    const generator = new VocabGenerator(
      {
        inputResources: ["http://some.online.resource"],
        artifactVersion: "1.0.0",
        moduleNamePrefix: "my-company-prefix-",
      },
      {
        sourceFileExtension: "js",
        outputDirectoryForArtifact: path.join(
          "test",
          "Generated",
          "UNIT_TEST",
          "VocabGenerator",
          "previouslyGenerated",
        ),
      },
    );
    const outputDir = path.join(
      "test",
      "Generated",
      "UNIT_TEST",
      "VocabGenerator",
      "previouslyGenerated",
      "GeneratedVocab",
    );
    const targetFile = path.join(outputDir, "TEST.js");
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(targetFile, "This is a test file");

    // If the vocabulary cannot be parsed, the following object is returned
    const vocabGenerationData = {
      classes: [],
      properties: [],
      literals: [],
      constantStrings: [],
      constantIris: [],
      vocabNameUpperCase: "TEST",
    };
    await generator.generateFiles(vocabGenerationData);
    expect(fs.readFileSync(targetFile).toString()).toEqual(
      "This is a test file",
    );
  });

  it("should fail to generate if the associated vocabulary is unreachable and no previous file exists", () => {
    const generator = new VocabGenerator(
      {
        inputResources: ["http://some.online.resource"],
        artifactVersion: "1.0.0",
        moduleNamePrefix: "my-company-prefix-",
      },
      {
        sourceFileExtension: "js",
        outputDirectoryForArtifact: path.join(
          "test",
          "Generated",
          "UNIT_TEST",
          "VocabGenerator",
          "notPreviouslyGenerated",
        ),
      },
    );

    const outputDir = path.join(
      "test",
      "Generated",
      "UNIT_TEST",
      "VocabGenerator",
      "notPreviouslyGenerated",
      "GeneratedVocab",
    );
    fs.mkdirSync(outputDir, { recursive: true });

    // If the vocabulary cannot be parsed, the following object is returned
    const vocabGenerationData = {
      classes: [],
      properties: [],
      literals: [],
      constantStrings: [],
      constantIris: [],
      vocabNameUpperCase: "TEST",
    };
    expect(() => generator.generateFiles(vocabGenerationData)).toThrow(
      "unreachable or is empty of recognisable terms",
    );
  });
});
