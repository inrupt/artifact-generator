require("mock-local-storage");

const fs = require("fs");
const del = require("del");
const path = require("path");

const VocabGenerator = require("./generator/VocabGenerator");
const { getArtifactDirectorySourceCode } = require("./Util");

describe("Supported Data Type", () => {
  it("should test the special-case handling for the OWL vocabulary", async () => {
    const outputDirectory =
      "test/Generated/UNIT_TEST/SupportedDataType/owl-test";
    const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        generatorName: "TestGenerator",
        artifactGeneratorVersion: "^7.8.9",
        generatedTimestamp: "1999/12/31 23:59",

        inputResources: ["./test/resources/vocab/special-case-owl-snippet.ttl"],
        outputDirectory,
        artifactVersion: "1.0.0",
        moduleNamePrefix: "generated-vocab-",
        generatedVocabs: [],
        authorSet: new Set(),
      },
      {
        programmingLanguage: "JavaScript",
        artifactDirectoryName: "JavaScript",
        // We assume normalization has resolved this template location.
        sourceCodeTemplate: path.join(
          "template",
          "solidCommonVocabDependent",
          "javascript",
          "vocab.hbs",
        ),
        sourceFileExtension: "js",
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavaScript,
      },
    );

    await generator.generateVocab();

    const indexOutput = fs
      .readFileSync(`${outputDirectoryJavaScript}/GeneratedVocab/OWL.js`)
      .toString();

    expect(indexOutput).toEqual(
      expect.stringContaining('NAMESPACE: "http://www.w3.org/2002/07/owl#"'),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("AllDifferent: new _VocabTerm("),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`AllDifferent`)"),
    );
  });

  it("should test the special-case handling for the HTTP vocabulary", async () => {
    const outputDirectory =
      "test/Generated/UNIT_TEST/SupportedDataType/http-test";
    const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        generatorName: "TestGenerator",
        artifactGeneratorVersion: "^7.8.9",
        generatedTimestamp: "1999/12/31 23:59",

        inputResources: [
          "./test/resources/vocab/special-case-http-snippet.ttl",
        ],
        outputDirectory,
        artifactVersion: "1.0.0",
        moduleNamePrefix: "generated-vocab-",
        nameAndPrefixOverride: "http",

        generatedVocabs: [],
        authorSet: new Set(),
      },
      {
        programmingLanguage: "JavaScript",
        artifactDirectoryName: "JavaScript",
        // We assume normalization has resolved this template location.
        sourceCodeTemplate: path.join(
          "template",
          "solidCommonVocabDependent",
          "javascript",
          "vocab.hbs",
        ),
        sourceFileExtension: "js",
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavaScript,
      },
    );

    await generator.generateVocab();

    const indexOutput = fs
      .readFileSync(`${outputDirectoryJavaScript}/GeneratedVocab/HTTP.js`)
      .toString();

    // We expect to get the namespace IRI from a vocab term, since the vocab
    // itself doesn't explicitly provide one via VANN or SHACL:declare, hence
    // we see the trailing hash when the 'a owl:Ontology' triple doesn't have
    // that hash.
    expect(indexOutput).toEqual(
      expect.stringContaining('NAMESPACE: "http://www.w3.org/2011/http#"'),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("Connection: new _VocabTerm("),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining('.addLabel(`Connection`, "en")'),
    );
  });

  it("should fail with invalid IRI", async () => {
    const outputDirectory =
      "test/Generated/UNIT_TEST/SupportedDataType/invalid-iri";
    const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        inputResources: [
          "./test/resources/vocab/supported-data-types-invalid-constant-iri.ttl",
        ],
        outputDirectory,
      },
      {
        programmingLanguage: "JavaScript",
        artifactDirectoryName: "JavaScript",
        // We assume normalization has resolved this template location.
        sourceCodeTemplate: path.join(
          "template",
          "solidCommonVocabDependent",
          "javascript",
          "vocab.hbs",
        ),
        sourceFileExtension: "js",
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavaScript,
      },
    );

    await expect(generator.generateVocab()).rejects.toThrow("not a valid IRI!");
  });

  it("should fail with too many constant IRI values", async () => {
    const outputDirectory =
      "test/Generated/UNIT_TEST/SupportedDataType/too-many-constant-iri-values";
    const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        inputResources: [
          "./test/resources/vocab/supported-data-types-too-many-constant-iri-values.ttl",
        ],
        outputDirectory,
      },
      {
        programmingLanguage: "JavaScript",
        artifactDirectoryName: "JavaScript",
        // We assume normalization has resolved this template location.
        sourceCodeTemplate: path.join(
          "template",
          "solidCommonVocabDependent",
          "javascript",
          "vocab.hbs",
        ),
        sourceFileExtension: "js",
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavaScript,
      },
    );

    await expect(generator.generateVocab()).rejects.toThrow(
      "constantIriTooMany",
    );
  });

  it("should fail with too many constant string values", async () => {
    const outputDirectory =
      "test/Generated/UNIT_TEST/SupportedDataType/too-many-constant-string-values";
    const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        inputResources: [
          "./test/resources/vocab/supported-data-types-too-many-constant-string-values.ttl",
        ],
        outputDirectory,
      },
      {
        programmingLanguage: "JavaScript",
        artifactDirectoryName: "JavaScript",
        // We assume normalization has resolved this template location.
        sourceCodeTemplate: path.join(
          "template",
          "solidCommonVocabDependent",
          "javascript",
          "vocab.hbs",
        ),
        sourceFileExtension: "js",
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavaScript,
      },
    );

    await expect(generator.generateVocab()).rejects.toThrow(
      "constantStringTooMany",
    );
  });

  it("should fail if many constant string values of different languages", async () => {
    const outputDirectory =
      "test/Generated/UNIT_TEST/SupportedDataType/constant-string-values-with-different-languages";
    const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        inputResources: [
          "./test/resources/vocab/supported-data-types-many-constant-string-values-but-different-languages.ttl",
        ],
        outputDirectory,
      },
      {
        programmingLanguage: "JavaScript",
        artifactDirectoryName: "JavaScript",
        // We assume normalization has resolved this template location.
        sourceCodeTemplate: path.join(
          "template",
          "solidCommonVocabDependent",
          "javascript",
          "vocab.hbs",
        ),
        sourceFileExtension: "js",
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavaScript,
      },
    );

    await expect(generator.generateVocab()).rejects.toThrow(
      "constantStringDifferentLanguages",
    );
  });

  it("should be able to generate vocabs for all the supported class data types", async () => {
    const outputDirectory =
      "test/Generated/UNIT_TEST/SupportedDataType/data-types";
    const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        generatorName: "TestGenerator",
        artifactGeneratorVersion: "^7.8.9",
        generatedTimestamp: "1999/12/31 23:59",

        inputResources: ["./test/resources/vocab/supported-data-types.ttl"],
        outputDirectory,
        artifactVersion: "1.0.0",
        moduleNamePrefix: "generated-vocab-",

        generatedVocabs: [],
        authorSet: new Set(),
      },
      {
        programmingLanguage: "JavaScript",
        artifactDirectoryName: "JavaScript",
        // We assume normalization has resolved this template location.
        sourceCodeTemplate: path.join(
          "template",
          "solidCommonVocabDependent",
          "javascript",
          "vocab.hbs",
        ),
        sourceFileExtension: "js",
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavaScript,
      },
    );

    await generator.generateVocab();

    const indexOutput = fs
      .readFileSync(`${outputDirectoryJavaScript}/GeneratedVocab/TEST.js`)
      .toString();

    expect(indexOutput).toEqual(
      expect.stringContaining("class1: new _VocabTerm("),
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`A rdfs class`)"),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("class2: new _VocabTerm("),
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`An owl class`)"),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("class3: new _VocabTerm("),
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`A skos concept class`)"),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("class4: new _VocabTerm("),
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(
        ".addLabelNoLanguage(`A schema payment status type class`)",
      ),
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining("class5: new _VocabTerm("),
    );
    expect(indexOutput).toEqual(
      expect.not.stringContaining(".addLabelNoLanguage(`Not supported class`)"),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property1: new _VocabTerm("),
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`A rdf property`)"),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property2: new _VocabTerm("),
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(
        ".addLabelNoLanguage(`A rdfs data type property`)",
      ),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property3: new _VocabTerm("),
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`An owl object property`)"),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property4: new _VocabTerm("),
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(
        ".addLabelNoLanguage(`An owl named individual property`)",
      ),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property5: new _VocabTerm("),
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(
        ".addLabelNoLanguage(`An owl annotation property`)",
      ),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property6: new _VocabTerm("),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining(
        ".addLabelNoLanguage(`An owl datatype property`)",
      ),
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining("property7: new _VocabTerm("),
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining(
        ".addLabelNoLanguage(`Not supported property`)",
      ),
    );
    // });
    //
    // it('should be able to generate vocabs for all the supported literal data types', async () => {
    //   var indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();

    expect(indexOutput).toEqual(
      expect.stringContaining("literal1: new _VocabTerm("),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`A rdfs literal`)"),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("literal2: new _VocabTerm("),
    );

    expect(indexOutput).toEqual(
      expect.stringContaining('.addMessage(`Welcome`, "en")'),
    );
    expect(indexOutput).toEqual(
      expect.stringContaining('.addMessage(`Bienvenido`, "es")'),
    );
    expect(indexOutput).toEqual(
      expect.stringContaining('.addMessage(`Bienvenue`, "fr")'),
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining("literal3: new _VocabTerm("),
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining(
        ".addLabelNoLanguage(`Not supported literal`)",
      ),
    );
  });
});
