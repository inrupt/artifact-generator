require("mock-local-storage");

const rdfFetch = require("@rdfjs/fetch-lite");

jest.mock("@rdfjs/fetch-lite");

const fs = require("fs");
const del = require("del");
const Resource = require("./Resource");

const {
  RDF_NAMESPACE,
  RDFS_NAMESPACE,
  OWL_NAMESPACE,
} = require("./CommonTerms");

const ArtifactGenerator = require("./generator/ArtifactGenerator");
const GeneratorConfiguration = require("./config/GeneratorConfiguration");
const { getArtifactDirectorySourceCode } = require("./Util");

describe("End-to-end tests", () => {
  describe("Build node module artifacts", () => {
    it("should fail if no ontology file", async () => {
      const outputDirectory = "test/Generated/UNIT_TEST/EndToEnd/no-ontology";
      del.sync([`${outputDirectory}/*`]);
      const errorFilename = "./test/resources/vocab/does.not.exist.ttl";

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: [errorFilename],
          outputDirectory,
          noPrompt: true,
        }),
      );

      await expect(artifactGenerator.generate()).rejects.toThrow(
        "Failed to generate",
        errorFilename,
      );
    });

    it("should fail if ontology file invalid", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/invalid-ontology";
      del.sync([`${outputDirectory}/*`]);
      const errorFilename = "./test/resources/vocab/invalid-turtle.ttl";
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: [errorFilename],
          outputDirectory,
          noPrompt: true,
        }),
      );

      await expect(artifactGenerator.generate()).rejects.toThrow(
        "Failed",
        "line 4",
        errorFilename,
      );
    });

    it("should fail if ontology file has term from different namespace", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/different-namespace";
      del.sync([`${outputDirectory}/*`]);
      const errorFilename = "./test/resources/vocab/mismatched-namespaces.ttl";

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: [errorFilename],
          outputDirectory,
          noPrompt: true,
        }),
      );

      await expect(artifactGenerator.generate()).rejects.toThrow(
        "sampleTerm",
        "https://inrupt.net/vocab/different-IRI#",
        "https://inrupt.net/vocab/not-matching-preferred-namespace-IRI#",
        errorFilename,
      );
    });

    it("should create from an ontology file", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/create-ontology/";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
          descriptionFallback: "Vocab needs a description.",
          outputDirectory,
          artifactVersion: "1.0.0",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          license: { name: "MIT" },
          moduleNamePrefix: "@inrupt/generated-vocab-",
          noPrompt: true,
        }),
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavaScript}/index.js`)).toBe(true);
      expect(
        fs.readFileSync(`${outputDirectoryJavaScript}/index.js`).toString(),
      ).toBe(
        fs
          .readFileSync("test/resources/expectedOutput/single/index.js")
          .toString(),
      );

      // Generated code contains timestamp (which will change every time we
      // generate!), so skip the first comment.
      const output = fs
        .readFileSync(`${outputDirectoryJavaScript}/GeneratedVocab/SCHEMA.js`)
        .toString();
      const expected = fs
        .readFileSync(
          "test/resources/expectedOutput/single/GeneratedVocab/SCHEMA.js",
        )
        .toString();
      expect(
        output.substring(output.indexOf(" */")).replace(/[\n\r]/g, ""),
      ).toBe(
        expected.substring(expected.indexOf(" */")).replace(/[\n\r]/g, ""),
      );

      expect(fs.existsSync(`${outputDirectoryJavaScript}/package.json`)).toBe(
        true,
      );
      expect(
        fs.readFileSync(`${outputDirectoryJavaScript}/package.json`).toString(),
      ).toBe(
        fs
          .readFileSync("test/resources/expectedOutput/single/package.json")
          .toString(),
      );
    });

    it("should create from an ontology file using the rdflib", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/dependency-rdflib/";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          vocabListFile: "./test/resources/yamlConfig/vocab-rdflib.yml",
          outputDirectory,
          supportBundling: true,
          noPrompt: true,
        }),
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavaScript}/index.js`)).toBe(true);

      // The package.json should be generated from the proper template (with the rdflib dependency).
      expect(
        fs.readFileSync(`${outputDirectoryJavaScript}/package.json`).toString(),
      ).toEqual(expect.stringContaining("99.999.9999"));

      // Generated code contains timestamp (which will change every time we
      // generate!), so skip the first comment.
      const output = fs
        .readFileSync(
          `${outputDirectoryJavaScript}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`,
        )
        .toString();
      expect(output).toEqual(
        expect.stringContaining('const $rdf = require("rdflib")'),
      );
    });

    it("should create from an ontology file using the native RDF4J (and not Vocab Term)", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/dependency-just-rdf4j/";
      const outputDirectoryJava = `${outputDirectory}${getArtifactDirectorySourceCode()}/Java`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          artifactVersion: "1.0.0",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          vocabListFile:
            "./test/resources/yamlConfig/vocab-rdf-library-java-rdf4j.yml",
          outputDirectory,
          supportBundling: true,
          noPrompt: true,
        }),
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJava}/pom.xml`)).toBe(true);
      expect(fs.readFileSync(`${outputDirectoryJava}/pom.xml`).toString()).toBe(
        fs
          .readFileSync(
            "test/resources/expectedOutput/dependency-just-rdf4j/pom.xml",
          )
          .toString(),
      );

      // Generated code contains timestamp (which will change every time we
      // generate!), so skip the first comment.
      const output = fs
        .readFileSync(
          `${outputDirectoryJava}/src/main/java/com/inrupt/generated/vocab/lit/test/SCHEMA_INRUPT_EXT.java`,
        )
        .toString();
      const expected = fs
        .readFileSync(
          "test/resources/expectedOutput/dependency-just-rdf4j/src/main/java/com/inrupt/generated/vocab/lit/test/SCHEMA_INRUPT_EXT.java",
        )
        .toString();
      expect(output.substring(output.indexOf(" */"))).toBe(
        expected.substring(expected.indexOf(" */")),
      );
    });

    it("should create from an ontology file using Rdf-Data-Factory (and not Vocab Term)", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/dependency-just-rdf-data-factory/";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          vocabListFile:
            "./test/resources/yamlConfig/vocab-rdf-library-javascript-rdf-data-factory.yml",
          outputDirectory,
          supportBundling: true,
          noPrompt: true,
        }),
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavaScript}/index.js`)).toBe(true);

      // The package.json should be generated from the proper template (with the rdflib dependency).
      const packageDotJson = fs
        .readFileSync(`${outputDirectoryJavaScript}/package.json`)
        .toString();

      expect(packageDotJson).toEqual(
        expect.stringContaining('"rdf-data-factory": "'),
      );

      expect(packageDotJson).toEqual(expect.stringContaining("^9.8.7"));

      // Generated code contains timestamp (which will change every time we
      // generate!), so skip the first comment.
      const output = fs
        .readFileSync(
          `${outputDirectoryJavaScript}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`,
        )
        .toString();
      expect(output).toEqual(expect.stringContaining('Person: _NS("Person"),'));
    });

    it("should create from an ontology link", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/create-ontology-link/";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
          outputDirectory,
          artifactVersion: "1.0.0",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          moduleNamePrefix: "@inrupt/generated-vocab-",
          noPrompt: true,
          descriptionFallback: "Needs a description...",
          namespaceIriOverride: "https://schema.org/",
        }),
      );

      await artifactGenerator.generate();

      expect(
        fs.existsSync(`${outputDirectoryJavaScript}/GeneratedVocab/SCHEMA.js`),
      ).toBe(true);

      const generated = fs
        .readFileSync(`${outputDirectoryJavaScript}/GeneratedVocab/SCHEMA.js`)
        .toString();

      expect(generated).toEqual(
        expect.stringContaining('Person: _NS("Person"),'),
      );

      expect(fs.existsSync(`${outputDirectoryJavaScript}/package.json`)).toBe(
        true,
      );
      expect(
        fs.readFileSync(`${outputDirectoryJavaScript}/package.json`).toString(),
      ).toEqual(
        expect.stringContaining('"name": "@inrupt/generated-vocab-schema"'),
      );
    });

    it("should be able to fully extend an ontology with multiple input files", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/multiple-inputs";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: [
            "./test/resources/vocab/schema-snippet.ttl",
            "./test/resources/vocab/schema-inrupt-ext.ttl",
          ],
          outputDirectory,
          artifactVersion: "1.0.0",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          license: { name: "MIT" },
          moduleNamePrefix: "@inrupt/generated-vocab-",
          noPrompt: true,
          descriptionFallback: "Needs a description...",
          namespaceIriOverride: "https://schema.org/",
        }),
      );

      await artifactGenerator.generate();

      // Generated code contains timestamp (which will change every time we
      // generate!), so skip the first comment.
      const output = fs
        .readFileSync(
          `${outputDirectoryJavaScript}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`,
        )
        .toString();

      const expected = fs
        .readFileSync(
          "test/resources/expectedOutput/full-ext/GeneratedVocab/SCHEMA.js",
        )
        .toString();

      expect(
        output.substring(output.indexOf(" */")).replace(/[\n\r]/g, ""),
      ).toBe(
        expected.substring(expected.indexOf(" */")).replace(/[\n\r]/g, ""),
      );

      expect(fs.existsSync(`${outputDirectoryJavaScript}/package.json`)).toBe(
        true,
      );
      expect(
        fs.readFileSync(`${outputDirectoryJavaScript}/package.json`).toString(),
      ).toBe(
        fs
          .readFileSync("test/resources/expectedOutput/full-ext/package.json")
          .toString(),
      );
    });

    it("should be able to fully extend an ontology with multiple input files and URL links", async () => {
      const rdfFetchMock = {
        dataset: () => {
          return Resource.loadTurtleFileIntoDatasetPromise(
            "./test/resources/vocab/Person.ttl",
          );
        },
        headers: {
          get: function () {
            return "media type doesn't matter";
          },
        },
      };
      rdfFetch.mockImplementation(() => {
        return Promise.resolve(rdfFetchMock);
      });

      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/multiple-urls/";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: [
            "https://schema.org/Person.ttl",
            "./test/resources/vocab/schema-inrupt-ext.ttl",
          ],
          outputDirectory,
          artifactVersion: "1.0.0",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          license: { name: "MIT" },
          moduleNamePrefix: "@inrupt/generated-vocab-",
          noPrompt: true,
          descriptionFallback: "Needs a description...",
          namespaceIriOverride: "https://schema.org/",
        }),
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavaScript}/index.js`)).toBe(true);

      const indexOutput = fs
        .readFileSync(
          `${outputDirectoryJavaScript}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`,
        )
        .toString();

      expect(indexOutput).toEqual(
        expect.stringContaining('Person: _NS("Person"),'),
      );
      expect(indexOutput).toEqual(
        expect.stringContaining('address: _NS("address"),'),
      );
      expect(indexOutput).toEqual(
        expect.stringContaining('additionalName: _NS("additionalName"),'),
      );
    });

    it("should be able to extend an ontology but only creates triples from extension file", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/extension-file/";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
          outputDirectory,
          termSelectionResource: "./test/resources/vocab/schema-inrupt-ext.ttl",
          artifactVersion: "1.0.0",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          license: { name: "MIT" },
          moduleNamePrefix: "@inrupt/generated-vocab-",
          noPrompt: true,
          descriptionFallback: "Needs a description...",
          namespaceIriOverride: "https://schema.org/",
        }),
      );

      await artifactGenerator.generate();

      const indexOutput = fs
        .readFileSync(
          `${outputDirectoryJavaScript}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`,
        )
        .toString();

      expect(indexOutput).toEqual(
        expect.stringContaining('Person: _NS("Person"),'),
      );
      expect(indexOutput).toEqual(
        expect.stringContaining('familyName: _NS("familyName"),'),
      );
      expect(indexOutput).toEqual(
        expect.stringContaining('givenName: _NS("givenName"),'),
      );
    });

    it("should be able to extend an ontology but only create triples from extension URL links", async () => {
      const rdfFetchMock = {
        dataset: () => {
          return Resource.loadTurtleFileIntoDatasetPromise(
            "./test/resources/vocab/schema-inrupt-ext.ttl",
          );
        },
        headers: {
          get: function () {
            return "media type doesn't matter";
          },
        },
      };
      rdfFetch.mockImplementation(() => {
        return Promise.resolve(rdfFetchMock);
      });

      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/extension-urls/";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
          outputDirectory,
          termSelectionResource: "https://does-not-matter-mocked-anyway.com",
          artifactVersion: "1.0.0",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          moduleNamePrefix: "@inrupt/generated-vocab-",
          noPrompt: true,
          descriptionFallback: "Needs a description...",
          namespaceIriOverride: "https://schema.org/",
        }),
      );

      await artifactGenerator.generate();

      const indexOutput = fs
        .readFileSync(
          `${outputDirectoryJavaScript}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`,
        )
        .toString();

      expect(indexOutput).toEqual(
        expect.stringContaining('Person: _NS("Person"),'),
      );
      expect(indexOutput).toEqual(
        expect.stringContaining('familyName: _NS("familyName"),'),
      );
      expect(indexOutput).toEqual(
        expect.stringContaining('givenName: _NS("givenName"),'),
      );

      expect(indexOutput).toEqual(expect.not.stringContaining("address: "));
    });

    it("should take in a version for the output module", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/module-version/";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
          outputDirectory,
          termSelectionResource: "./test/resources/vocab/schema-inrupt-ext.ttl",
          artifactVersion: "1.0.5",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          license: { name: "MIT" },
          moduleNamePrefix: "@inrupt/generated-vocab-",
          noPrompt: true,
          descriptionFallback: "Needs a description...",
          namespaceIriOverride: "https://schema.org/",
        }),
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavaScript}/package.json`)).toBe(
        true,
      );
      expect(
        fs.readFileSync(`${outputDirectoryJavaScript}/package.json`).toString(),
      ).toEqual(expect.stringContaining('"version": "1.0.5"'));
    });

    it("should handle creating generated directory if it does not exist already", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/dest-directory-not-exist/";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
          outputDirectory,
          artifactVersion: "1.0.5",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          license: { name: "MIT" },
          moduleNamePrefix: "@inrupt/generated-vocab-",
          noPrompt: true,
          descriptionFallback: "Needs a description...",
          namespaceIriOverride: "https://schema.org/",
        }),
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavaScript}/index.js`)).toBe(true);
      expect(fs.existsSync(`${outputDirectoryJavaScript}/package.json`)).toBe(
        true,
      );
    });

    it("module names should by default start with @inrupt/generated-vocab-*", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/module-default-name/";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);
      let artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
          outputDirectory,
          artifactVersion: "1.0.5",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          license: { name: "MIT" },
          moduleNamePrefix: "@inrupt/generated-vocab-",
          noPrompt: true,
          descriptionFallback: "Needs a description...",
          namespaceIriOverride: "https://schema.org/",
        }),
      );

      await artifactGenerator.generate();

      expect(
        fs.readFileSync(`${outputDirectoryJavaScript}/package.json`).toString(),
      ).toEqual(
        expect.stringContaining('"name": "@inrupt/generated-vocab-schema",'),
      );

      del.sync([`${outputDirectory}/*`]);

      artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: ["./test/resources/vocab/schema-inrupt-ext.ttl"],
          outputDirectory,
          artifactVersion: "1.0.5",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          license: { name: "MIT" },
          moduleNamePrefix: "@inrupt/generated-vocab-",
          noPrompt: true,
          descriptionFallback: "Needs a description...",
          namespaceIriOverride: "https://schema.org/",
        }),
      );

      await artifactGenerator.generate();

      expect(
        fs.readFileSync(`${outputDirectoryJavaScript}/package.json`).toString(),
      ).toEqual(
        expect.stringContaining(
          '"name": "@inrupt/generated-vocab-schema-inrupt-ext",',
        ),
      );
    });

    it("should add a description inside the package.json", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/package-description/";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
          outputDirectory,
          termSelectionResource: "./test/resources/vocab/schema-inrupt-ext.ttl",
          artifactVersion: "1.0.5",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          license: { name: "MIT" },
          moduleNamePrefix: "@inrupt/generated-vocab-",
          noPrompt: true,
          descriptionFallback: "Needs a description...",
          namespaceIriOverride: "https://schema.org/",
        }),
      );

      await artifactGenerator.generate();

      expect(
        fs.readFileSync(`${outputDirectoryJavaScript}/package.json`).toString(),
      ).toEqual(
        expect.stringContaining(
          '"description": "Bundle of [1] vocabularies that includes the following:\\n\\n - schema_inrupt_ext: Inrupt extension to Schema.org terms.',
        ),
      );
    });

    it("should add authors inside the package.json", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/authors-in-package/";
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
          outputDirectory,
          termSelectionResource: "./test/resources/vocab/schema-inrupt-ext.ttl",
          artifactVersion: "1.0.5",
          artifactNamePrefix: "",
          artifactNameSuffix: "",
          moduleNamePrefix: "@inrupt/generated-vocab-",
          noPrompt: true,
          descriptionFallback: "Needs a description...",
          namespaceIriOverride: "https://schema.org/",
        }),
      );

      await artifactGenerator.generate();

      expect(
        fs.readFileSync(`${outputDirectoryJavaScript}/package.json`).toString(),
      ).toEqual(
        expect.stringContaining(
          "schema_inrupt_ext: Inrupt extension to Schema.org terms.",
        ),
      );
    });
  });

  describe("Build Java artifacts", () => {
    it("should create from an ontology file - Java artifact", async () => {
      const outputDirectory = "test/Generated/UNIT_TEST/EndToEnd/generate-java";
      const outputDirectoryJava = `${outputDirectory}${getArtifactDirectorySourceCode()}/Java`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          vocabListFile: "./test/resources/vocab/vocab-list.yml",
          outputDirectory,
          noPrompt: true,
        }),
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJava}/pom.xml`)).toBe(true);

      expect(fs.readFileSync(`${outputDirectoryJava}/pom.xml`).toString()).toBe(
        fs
          .readFileSync("test/resources/expectedOutput/java-rdf4j/pom.xml")
          .toString(),
      );

      // Generated code contains timestamp (which will change every time we
      // generate!), so skip the first comment.
      const output = fs
        .readFileSync(
          `${outputDirectoryJava}/src/main/java/com/inrupt/testing/SCHEMA_INRUPT_EXT.java`,
        )
        .toString();
      const expected = fs
        .readFileSync(
          "test/resources/expectedOutput/java-rdf4j/src/main/java/com/inrupt/testing/SCHEMA_INRUPT_EXT.java",
        )
        .toString();
      expect(output.substring(output.indexOf(" */"))).toBe(
        expected.substring(expected.indexOf(" */")),
      );
    });
  });

  describe("Specific YAML configurations", () => {
    it("should pick up the strictness of the VocabTerm from the YAML", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/EndToEnd/generate-strict/";
      const outputDirectoryJS = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          vocabListFile: "./test/resources/yamlConfig/vocab-strict.yml",
          // The output directory must be set, because a default value will be
          // set by yargs normally.
          outputDirectory,
          noPrompt: true,
        }),
      );

      await artifactGenerator.generate();

      const outputSchemaExtension = fs
        .readFileSync(
          `${outputDirectoryJS}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`,
        )
        .toString();

      expect(outputSchemaExtension).toEqual(
        expect.stringContaining("new _VocabTerm("),
      );

      // Should also generate a pure snippet of Schema.org, with its own
      // prefix.
      const outputSchemaSnippet = fs
        .readFileSync(`${outputDirectoryJS}/GeneratedVocab/SNIPPET.js`)
        .toString();

      expect(outputSchemaSnippet).toEqual(
        expect.stringContaining("new _VocabTerm("),
      );
    });
  });

  describe("Term metadata", () => {
    it("should provide multiple 'seeAlso' values", async () => {
      const outputDirectory = "test/Generated/UNIT_TEST/EndToEnd/seeAlso/";
      const outputDirectoryJS = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          vocabListFile: "./test/resources/yamlConfig/vocab-strict.yml",
          // The output directory must be set, because a default value will be
          // set by yargs normally.
          outputDirectory,
          noPrompt: true,
        }),
      );

      await artifactGenerator.generate();

      const output = fs
        .readFileSync(`${outputDirectoryJS}/GeneratedVocab/TEST_SEEALSO.js`)
        .toString();

      expect(output).toEqual(expect.stringContaining(".addSeeAlso("));
      expect(output).toEqual(expect.stringContaining(RDF_NAMESPACE));
      expect(output).toEqual(expect.stringContaining(RDFS_NAMESPACE));
    });

    it("should provide all 'isDefinedBy' values", async () => {
      const outputDirectory = "test/Generated/UNIT_TEST/EndToEnd/isDefinedBy/";
      const outputDirectoryJS = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;
      del.sync([`${outputDirectory}/*`]);

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ["generate"],
          vocabListFile: "./test/resources/yamlConfig/vocab-strict.yml",
          // The output directory must be set, because a default value will be
          // set by yargs normally.
          outputDirectory,
          noPrompt: true,
        }),
      );

      await artifactGenerator.generate();

      const output = fs
        .readFileSync(`${outputDirectoryJS}/GeneratedVocab/TEST_ISDEFINEDBY.js`)
        .toString();

      expect(output).toEqual(expect.stringContaining(".addIsDefinedBy("));
      expect(output).toEqual(expect.stringContaining(OWL_NAMESPACE));
      expect(output).toEqual(expect.stringContaining(RDFS_NAMESPACE));
    });
  });
});
