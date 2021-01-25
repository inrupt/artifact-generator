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

const vocabGenerator = new VocabGenerator({
  inputResources: [],
  artifactVersion: "1.0.0",
  moduleNamePrefix: "generated-vocab-",
});

const dataset = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA_DOT_ORG.Person, RDF.type, RDFS.Class),
    rdf.quad(SCHEMA_DOT_ORG.Person, RDFS.label, rdf.literal("Person", "en")),
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      RDFS.comment,
      rdf.literal("Person dead or alive", "en")
    ),

    rdf.quad(SCHEMA_DOT_ORG.givenName, RDF.type, RDF.Property),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.label,
      rdf.literal("givenName", "")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.comment,
      rdf.literal("A given name is the first name of a person.", "en")
    ),

    rdf.quad(SCHEMA_DOT_ORG.familyName, RDF.type, RDF.Property),
    rdf.quad(
      SCHEMA_DOT_ORG.familyName,
      RDFS.label,
      rdf.literal("familyName", "fr")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.familyName,
      RDFS.comment,
      rdf.literal("A family name is the last name of a person.", "en")
    ),
  ]);

const datasetExtension = rdf
  .dataset()
  .addAll([
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Person-fr", "fr")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Person-de", "de")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Person-es", "es")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      RDFS.comment,
      rdf.literal("Person dead or alive fr", "fr")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      RDFS.comment,
      rdf.literal("Person dead or alive de", "de")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      RDFS.comment,
      rdf.literal("Person dead or alive es", "es")
    ),

    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Given Name", "en")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Given Name-fr", "fr")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Given Name-de", "de")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Given Name-es", "es")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.comment,
      rdf.literal("Given name of a person fr", "fr")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.comment,
      rdf.literal("Given name of a person de", "de")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.comment,
      rdf.literal("Given name of a person es", "es")
    ),
  ]);

const extSubject = rdf.namedNode("http://rdf-extension.com");
const owlOntologyDataset = rdf.dataset().addAll([
  rdf.quad(extSubject, RDF.type, OWL.Ontology),
  rdf.quad(extSubject, RDFS.label, rdf.literal("Extension label")),
  rdf.quad(extSubject, DCTERMS.creator, rdf.literal("Jarlath Holleran")),
  rdf.quad(
    extSubject,
    DCTERMS.description,
    rdf.literal("Extension comment with special ' character!")
  ),
  rdf.quad(
    extSubject,
    VANN.preferredNamespacePrefix,
    rdf.literal("ext-prefix")
  ),
  rdf.quad(
    extSubject,
    VANN.preferredNamespaceUri,
    rdf.literal("http://rdf-extension.com")
  ),
  // This triple prevents the dataset from not defining any terms
  rdf.quad(
    rdf.namedNode("http://rdf-extension.com/dummyClass"),
    RDF.type,
    OWL.Class
  ),
]);

const emptyDataSet = rdf.dataset();

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
      "en"
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
      "en"
    ),
  ]);

const overrideLabelTerms = rdf
  .dataset()
  .addAll([
    rdf.quad(SCHEMA_DOT_ORG.Person, RDFS.label, rdf.literal("Override Person")),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.label,
      rdf.literal("Override Given Name")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.familyName,
      RDFS.label,
      rdf.literal("Override Family Name"),
      "en"
    ),
  ]);

const overrideCommentTerms = rdf
  .dataset()
  .addAll([
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      RDFS.comment,
      rdf.literal("Override comment for Person")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      RDFS.comment,
      rdf.literal("Override comment for Given Name")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.familyName,
      RDFS.comment,
      rdf.literal("Override comment for Family Name"),
      "en"
    ),
  ]);

const overrideAtlNameTerms = rdf
  .dataset()
  .addAll([
    rdf.quad(
      SCHEMA_DOT_ORG.Person,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Alt Person")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.givenName,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Alt Given Name")
    ),
    rdf.quad(
      SCHEMA_DOT_ORG.familyName,
      SCHEMA_DOT_ORG.alternateName,
      rdf.literal("Alt Family Name"),
      "en"
    ),
  ]);

const message = rdf.namedNode("http://schema.org/hello");

const literalDataset = rdf
  .dataset()
  .addAll([
    rdf.quad(message, RDF.type, RDFS.Literal),
    rdf.quad(message, RDFS.label, rdf.literal("Hello", "en")),
    rdf.quad(message, RDFS.label, rdf.literal("Hola", "es")),
    rdf.quad(message, RDFS.label, rdf.literal("Bonjour", "fr")),
    rdf.quad(message, RDFS.comment, rdf.literal("Hello there", "en")),
    rdf.quad(message, RDFS.comment, rdf.literal("Hola", "es")),
    rdf.quad(message, RDFS.comment, rdf.literal("Bonjour", "fr")),
    rdf.quad(message, SKOS.definition, rdf.literal("Welcome", "en")),
    rdf.quad(message, SKOS.definition, rdf.literal("Bienvenido", "es")),
    rdf.quad(message, SKOS.definition, rdf.literal("Bienvenue", "fr")),
    rdf.quad(message, RDFS.seeAlso, rdf.namedNode(OWL_NAMESPACE)),
    rdf.quad(message, SKOS.isDefinedBy, rdf.namedNode(OWL_NAMESPACE)),
  ]);

describe("Artifact generator unit tests", () => {
  beforeEach(() => {
    delete process.env.IRI_HINT_APPLICATION;
    delete process.env.DATA_SERVER_SOLID;
  });

  describe("Building the Template input", () => {
    it("should create a simple JSON object with all the fields", () => {
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([dataset, datasetExtension]),
        VocabGenerator.merge([datasetExtension])
      );
      expect(result.namespace).toBe("http://schema.org/");
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
        ])
      );

      expect(personLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Person-fr",
            valueEscapedForJavaScript: "Person-fr",
            valueEscapedForJava: "Person-fr",
            language: "fr",
          },
        ])
      );
      expect(personLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Person-de",
            valueEscapedForJavaScript: "Person-de",
            valueEscapedForJava: "Person-de",
            language: "de",
          },
        ])
      );
      expect(personLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Person-es",
            valueEscapedForJavaScript: "Person-es",
            valueEscapedForJava: "Person-es",
            language: "es",
          },
        ])
      );

      expect(result.properties[0].name).toBe("givenName");
      expect(result.properties[0].comment).toBe(
        "A given name is the first name of a person."
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
        ])
      );
      expect(givenNameLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Given Name-fr",
            valueEscapedForJavaScript: "Given Name-fr",
            valueEscapedForJava: "Given Name-fr",
            language: "fr",
          },
        ])
      );
      expect(givenNameLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Given Name-de",
            valueEscapedForJavaScript: "Given Name-de",
            valueEscapedForJava: "Given Name-de",
            language: "de",
          },
        ])
      );
      expect(givenNameLabels).toEqual(
        expect.arrayContaining([
          {
            value: "Given Name-es",
            valueEscapedForJavaScript: "Given Name-es",
            valueEscapedForJava: "Given Name-es",
            language: "es",
          },
        ])
      );
    });

    it("Should merge A and B, and generate code from A and B", () => {
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([dataSetA, dataSetB]),
        VocabGenerator.merge([dataSetA, dataSetB])
      );

      expect(result.classes[0].name).toBe("Person");
      expect(result.properties[0].name).toBe("givenName");
    });

    it("Should merge A and B, and generate code from A (not B)", () => {
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([dataSetA, dataSetB]),
        VocabGenerator.merge([dataSetA])
      );

      expect(result.classes[0].name).toBe("Person");
      expect(result.properties.length).toBe(0);
    });

    it("Should merge A and B, and generate code from B (not A)", () => {
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([dataSetA, dataSetB]),
        VocabGenerator.merge([dataSetB])
      );

      expect(result.classes.length).toBe(0);
      expect(result.properties[0].name).toBe("givenName");
    });

    it("Should merge A B and C, and generate code from A and B (not C)", () => {
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([dataSetA, dataSetB, dataSetC]),
        VocabGenerator.merge([dataSetA, dataSetB])
      );

      expect(result.classes[0].name).toBe("Person");
      expect(result.properties[0].name).toBe("givenName");
      expect(result.properties.length).toBe(1);
    });

    it("Should handle empty datasets", () => {
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([emptyDataSet]),
        VocabGenerator.merge([emptyDataSet])
      );

      expect(result.namespace).toBe("");
      expect(result.artifactName).toBe("generated-vocab-");
      expect(result.vocabNameUpperCase).toBe("");
      expect(result.classes.length).toBe(0);
      expect(result.properties.length).toBe(0);
    });

    it("Should use the label value if no comment and no definition", () => {
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([dataSetA, dataSetB]),
        VocabGenerator.merge([dataSetB])
      );

      expect(result.properties[0].name).toBe("givenName");
      expect(result.properties.length).toBe(1);
      expect(result.properties[0].comment).toBe("Given Name");
    });

    it("Should use the definition value if no comment", () => {
      const result = vocabGenerator.buildTemplateInput(
        dataSetD,
        VocabGenerator.merge([emptyDataSet])
      );

      expect(result.properties[0].name).toBe("familyName");
      expect(result.properties.length).toBe(1);
      expect(result.properties[0].comment).toBe("Family Name");
    });

    it("Should take any comment for the class or property if english or default cant be found", () => {
      const dataSetFrenchOnlyComment = rdf
        .dataset()
        .addAll([
          rdf.quad(SCHEMA_DOT_ORG.givenName, RDF.type, RDF.Property),
          rdf.quad(
            SCHEMA_DOT_ORG.givenName,
            RDFS.comment,
            rdf.literal("Given Name comment in french", "fr")
          ),
        ]);

      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([dataSetA, dataSetFrenchOnlyComment]),
        VocabGenerator.merge([dataSetFrenchOnlyComment])
      );

      expect(result.properties[0].name).toBe("givenName");
      expect(result.properties.length).toBe(1);
      expect(result.properties[0].comment).toBe("Given Name comment in french");
    });

    it("Should return empty comment if nothing found at all", () => {
      const noDescriptivePredicates = rdf
        .dataset()
        .add(rdf.quad(SCHEMA_DOT_ORG.givenName, RDF.type, RDF.Property));

      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([dataSetA, noDescriptivePredicates]),
        VocabGenerator.merge([noDescriptivePredicates])
      );

      expect(result.properties[0].name).toBe("givenName");
      expect(result.properties.length).toBe(1);
      expect(result.properties[0].comment).toBe("");
    });

    it("Should allow the prefix for the name of the module can be configured", () => {
      const generator = new VocabGenerator({
        inputResources: [],
        artifactVersion: "1.0.0",
        moduleNamePrefix: "my-company-prefix-",
      });

      const result = generator.buildTemplateInput(
        VocabGenerator.merge([dataset]),
        VocabGenerator.merge([])
      );

      expect(result.artifactName).toBe("my-company-prefix-schema");
    });

    it("Should create label vocab terms for literals", () => {
      const generator = new VocabGenerator({
        inputResources: [],
        artifactVersion: "1.0.0",
        moduleNamePrefix: "my-company-prefix-",
      });

      const result = generator.buildTemplateInput(
        VocabGenerator.merge([literalDataset]),
        VocabGenerator.merge([])
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
        ])
      );

      expect(messageLiterals).toEqual(
        expect.arrayContaining([
          {
            value: "Hola",
            valueEscapedForJavaScript: "Hola",
            valueEscapedForJava: "Hola",
            language: "es",
          },
        ])
      );

      expect(messageLiterals).toEqual(
        expect.arrayContaining([
          {
            value: "Bonjour",
            valueEscapedForJavaScript: "Bonjour",
            valueEscapedForJava: "Bonjour",
            language: "fr",
          },
        ])
      );
    });

    it("Should create comments vocab terms for literals", () => {
      const generator = new VocabGenerator({
        inputResources: [],
        artifactVersion: "1.0.0",
        moduleNamePrefix: "my-company-prefix-",
      });

      const result = generator.buildTemplateInput(
        VocabGenerator.merge([literalDataset]),
        VocabGenerator.merge([])
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
        ])
      );

      expect(messageComments).toEqual(
        expect.arrayContaining([
          {
            value: "Hola",
            valueEscapedForJavaScript: "Hola",
            valueEscapedForJava: "Hola",
            language: "es",
          },
        ])
      );

      expect(messageComments).toEqual(
        expect.arrayContaining([
          {
            value: "Bonjour",
            valueEscapedForJavaScript: "Bonjour",
            valueEscapedForJava: "Bonjour",
            language: "fr",
          },
        ])
      );
    });

    it("Should create defination vocab terms for literals", () => {
      const generator = new VocabGenerator({
        inputResources: [],
        artifactVersion: "1.0.0",
        moduleNamePrefix: "my-company-prefix-",
      });

      const result = generator.buildTemplateInput(
        VocabGenerator.merge([literalDataset]),
        VocabGenerator.merge([])
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
        ])
      );

      expect(messageDefinitions).toEqual(
        expect.arrayContaining([
          {
            value: "Bienvenido",
            valueEscapedForJavaScript: "Bienvenido",
            valueEscapedForJava: "Bienvenido",
            language: "es",
          },
        ])
      );

      expect(messageDefinitions).toEqual(
        expect.arrayContaining([
          {
            value: "Bienvenue",
            valueEscapedForJavaScript: "Bienvenue",
            valueEscapedForJava: "Bienvenue",
            language: "fr",
          },
        ])
      );
    });
  });

  describe("Vocab terms from extension dataset", () => {
    it("should override label terms of the main datasets", () => {
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([
          dataSetA,
          dataSetB,
          dataSetC,
          overrideLabelTerms,
        ]),
        VocabGenerator.merge([overrideLabelTerms])
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

    it("should override comment terms of the main datasets", () => {
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([
          dataSetA,
          dataSetB,
          dataSetC,
          overrideCommentTerms,
        ]),
        VocabGenerator.merge([overrideCommentTerms])
      );

      const person = result.classes[0];

      expect(person.name).toBe("Person");
      expect(person.comments.length).toBe(1);
      expect(person.comments[0].value).toBe("Override comment for Person");

      const givenName = result.properties[0];

      expect(givenName.name).toBe("givenName");
      expect(givenName.comments.length).toBe(1);
      expect(givenName.comments[0].value).toBe(
        "Override comment for Given Name"
      );

      const familyName = result.properties[1];

      expect(familyName.name).toBe("familyName");
      expect(familyName.comments.length).toBe(1);
      expect(familyName.comments[0].value).toBe(
        "Override comment for Family Name"
      );
    });

    it("should override label with alternativeNames from the vocab terms", () => {
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([
          dataSetA,
          dataSetB,
          dataSetC,
          overrideAtlNameTerms,
        ]),
        VocabGenerator.merge([overrideAtlNameTerms])
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

    it("Should create definition vocab terms for literals from extensions", () => {
      const generator = new VocabGenerator({
        inputResources: [],
        artifactVersion: "1.0.0",
        moduleNamePrefix: "my-company-prefix-",
      });

      const result = generator.buildTemplateInput(
        VocabGenerator.merge([dataset, literalDataset]),
        VocabGenerator.merge([literalDataset])
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
        ])
      );

      expect(messageDefinitions).toEqual(
        expect.arrayContaining([
          {
            value: "Bienvenido",
            valueEscapedForJavaScript: "Bienvenido",
            valueEscapedForJava: "Bienvenido",
            language: "es",
          },
        ])
      );

      expect(messageDefinitions).toEqual(
        expect.arrayContaining([
          {
            value: "Bienvenue",
            valueEscapedForJavaScript: "Bienvenue",
            valueEscapedForJava: "Bienvenue",
            language: "fr",
          },
        ])
      );
    });

    it("should take description from the rdfs:comment of an owl:Ontology term", () => {
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([dataset, owlOntologyDataset]),
        VocabGenerator.merge([owlOntologyDataset])
      );

      expect(result.artifactName).toBe("generated-vocab-ext-prefix");
      expect(result.namespace).toBe("http://rdf-extension.com");
      expect(result.vocabNameUpperCase).toBe("EXT_PREFIX");
      expect(result.description).toBe(
        "Extension comment with special ' character!"
      );
    });

    it("should default description to empty string if rdfs:comment of an owl:Ontology term is not found", () => {
      const owlOntologyDatasetWithNoComment = rdf.dataset().addAll([
        rdf.quad(extSubject, RDF.type, OWL.Ontology),
        rdf.quad(extSubject, RDFS.label, rdf.literal("Extension label")),
        rdf.quad(
          extSubject,
          VANN.preferredNamespacePrefix,
          rdf.literal("ext-prefix")
        ),
        rdf.quad(
          extSubject,
          VANN.preferredNamespaceUri,
          rdf.literal("http://rdf-extension.com")
        ),
        // This triple prevents the dataset from not defining any terms
        rdf.quad(
          rdf.namedNode("http://rdf-extension.com/dummyClass"),
          RDF.type,
          OWL.Class
        ),
      ]);

      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([dataset, owlOntologyDatasetWithNoComment]),
        VocabGenerator.merge([owlOntologyDatasetWithNoComment])
      );

      expect(result.artifactName).toBe("generated-vocab-ext-prefix");
      expect(result.namespace).toBe("http://rdf-extension.com");
      expect(result.vocabNameUpperCase).toBe("EXT_PREFIX");
      expect(result.description).toBeUndefined();
      expect(result.descriptionFallback).toBeUndefined();
    });

    it("should read authors from owl:Ontology terms", () => {
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([dataset, owlOntologyDataset]),
        VocabGenerator.merge([owlOntologyDataset])
      );

      expect(result.authorSet.has("Jarlath Holleran"));
    });

    it("should default to lit-js@inrupt.com if authors in not contained in owl:Ontology terms", () => {
      const owlOntologyDatasetWithNoAuthor = rdf.dataset().addAll([
        rdf.quad(extSubject, RDF.type, OWL.Ontology),
        rdf.quad(extSubject, RDFS.label, rdf.literal("Extension label")),
        rdf.quad(extSubject, RDFS.comment, rdf.literal("Extension comment")),
        rdf.quad(
          extSubject,
          VANN.preferredNamespacePrefix,
          rdf.literal("ext-prefix")
        ),
        rdf.quad(
          extSubject,
          VANN.preferredNamespaceUri,
          rdf.literal("http://rdf-extension.com")
        ),
        // This triple prevents the dataset from not defining any terms
        rdf.quad(
          rdf.namedNode("http://rdf-extension.com/dummyClass"),
          RDF.type,
          OWL.Class
        ),
      ]);
      const result = vocabGenerator.buildTemplateInput(
        VocabGenerator.merge([dataset, owlOntologyDatasetWithNoAuthor]),
        VocabGenerator.merge([owlOntologyDatasetWithNoAuthor])
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
          "previouslyGenerated"
        ),
      }
    );
    const outputDir = path.join(
      "test",
      "Generated",
      "UNIT_TEST",
      "VocabGenerator",
      "previouslyGenerated",
      "GeneratedVocab"
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
      "This is a test file"
    );
  });

  it("should fail to generate if the associated vocabulary is unreachable and no previous file exists", async () => {
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
          "notPreviouslyGenerated"
        ),
      }
    );

    const outputDir = path.join(
      "test",
      "Generated",
      "UNIT_TEST",
      "VocabGenerator",
      "notPreviouslyGenerated",
      "GeneratedVocab"
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
    expect(generator.generateFiles(vocabGenerationData)).rejects.toThrow(
      "unreachable (or empty of recognisable terms), and no previously generated file is available"
    );
  });
});
