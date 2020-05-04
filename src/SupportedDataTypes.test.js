require("mock-local-storage");

const fs = require("fs");
const del = require("del");
const path = require("path");

const VocabGenerator = require("./generator/VocabGenerator");
const {
  ARTIFACT_DIRECTORY_SOURCE_CODE
} = require("./generator/ArtifactGenerator");

describe("Supported Data Type", () => {
  it("should test the special-case handling for the OWL vocabulary", async () => {
    const outputDirectory = "test/Generated/SupportedDataType/owl-test";
    const outputDirectoryJavaScript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/JavaScript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        inputResources: [
          "./test/resources/vocabs/special-case-owl-snippet.ttl"
        ],
        outputDirectory,
        artifactVersion: "1.0.0",
        moduleNamePrefix: "lit-generated-vocab-",
        nameAndPrefixOverride: "owl",

        generatedVocabs: [],
        authorSet: new Set()
      },
      {
        programmingLanguage: "JavaScript",
        artifactDirectoryName: "JavaScript",
        // We assume normalization has resolved this template location.
        sourceCodeTemplate: path.join(
          "templates",
          "litVocabTermDependent",
          "javascript",
          "vocab.hbs"
        ),
        sourceFileExtension: "js",
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavaScript
      }
    );

    await generator.generate();

    const indexOutput = fs
      .readFileSync(`${outputDirectoryJavaScript}/GeneratedVocab/OWL.js`)
      .toString();

    expect(indexOutput).toEqual(
      expect.stringContaining('NAMESPACE: "http://www.w3.org/2002/07/owl#"')
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("AllDifferent: new LitVocabTerm(")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`AllDifferent`)")
    );
  });

  it("should test the special-case handling for the HTTP vocabulary", async () => {
    const outputDirectory = "test/Generated/SupportedDataType/http-test";
    const outputDirectoryJavaScript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/JavaScript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        inputResources: [
          "./test/resources/vocabs/special-case-http-snippet.ttl"
        ],
        outputDirectory,
        artifactVersion: "1.0.0",
        moduleNamePrefix: "lit-generated-vocab-",
        nameAndPrefixOverride: "http",

        generatedVocabs: [],
        authorSet: new Set()
      },
      {
        programmingLanguage: "JavaScript",
        artifactDirectoryName: "JavaScript",
        // We assume normalization has resolved this template location.
        sourceCodeTemplate: path.join(
          "templates",
          "litVocabTermDependent",
          "javascript",
          "vocab.hbs"
        ),
        sourceFileExtension: "js",
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavaScript
      }
    );

    await generator.generate();

    const indexOutput = fs
      .readFileSync(`${outputDirectoryJavaScript}/GeneratedVocab/HTTP.js`)
      .toString();

    expect(indexOutput).toEqual(
      expect.stringContaining('NAMESPACE: "http://www.w3.org/2011/http#"')
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("Connection: new LitVocabTerm(")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining('.addLabel(`Connection`, "en")')
    );
  });

  it("should be able to generate vocabs for all the supported class data types", async () => {
    const outputDirectory = "test/Generated/SupportedDataType/data-types";
    const outputDirectoryJavaScript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/JavaScript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        inputResources: ["./test/resources/vocabs/supported-data-types.ttl"],
        outputDirectory,
        artifactVersion: "1.0.0",
        moduleNamePrefix: "lit-generated-vocab-",

        generatedVocabs: [],
        authorSet: new Set()
      },
      {
        programmingLanguage: "JavaScript",
        artifactDirectoryName: "JavaScript",
        // We assume normalization has resolved this template location.
        sourceCodeTemplate: path.join(
          "templates",
          "litVocabTermDependent",
          "javascript",
          "vocab.hbs"
        ),
        sourceFileExtension: "js",
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavaScript
      }
    );

    await generator.generate();

    const indexOutput = fs
      .readFileSync(`${outputDirectoryJavaScript}/GeneratedVocab/LIT_GEN.js`)
      .toString();

    expect(indexOutput).toEqual(
      expect.stringContaining("class1: new LitVocabTerm(")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`A rdfs class`)")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("class2: new LitVocabTerm(")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`An owl class`)")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("class3: new LitVocabTerm(")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`A skos concept class`)")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("class4: new LitVocabTerm(")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(
        ".addLabelNoLanguage(`A schema payment status type class`)"
      )
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining("class5: new LitVocabTerm(")
    );
    expect(indexOutput).toEqual(
      expect.not.stringContaining(".addLabelNoLanguage(`Not supported class`)")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property1: new LitVocabTerm(")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`A rdf property`)")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property2: new LitVocabTerm(")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(
        ".addLabelNoLanguage(`A rdfs data type property`)"
      )
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property3: new LitVocabTerm(")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`An owl object property`)")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property4: new LitVocabTerm(")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(
        ".addLabelNoLanguage(`An owl named individual property`)"
      )
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property5: new LitVocabTerm(")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(
        ".addLabelNoLanguage(`An owl annotation property`)"
      )
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property6: new LitVocabTerm(")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`An owl datatype property`)")
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining("property7: new LitVocabTerm(")
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining(
        ".addLabelNoLanguage(`Not supported property`)"
      )
    );
    // });
    //
    // it('should be able to generate vocabs for all the supported literal data types', async () => {
    //   var indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();

    expect(indexOutput).toEqual(
      expect.stringContaining("literal1: new LitVocabTerm(")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabelNoLanguage(`A rdfs literal`)")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("literal2: new LitVocabTerm(")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining('.addMessage(`Welcome`, "en")')
    );
    expect(indexOutput).toEqual(
      expect.stringContaining('.addMessage(`Bienvenido`, "es")')
    );
    expect(indexOutput).toEqual(
      expect.stringContaining('.addMessage(`Bienvenue`, "fr")')
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining("literal3: new LitVocabTerm(")
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining(
        ".addLabelNoLanguage(`Not supported literal`)"
      )
    );
  });
});
