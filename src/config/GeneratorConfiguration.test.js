require("mock-local-storage");

jest.mock("inquirer");
const inquirer = require("inquirer");
const path = require("path");
const fs = require("fs");

const packageDotJson = require("../../package.json");

const GeneratorConfiguration = require("./GeneratorConfiguration");
const {
  DEFAULT_CLI_ARTIFACT,
  CONFIG_SOURCE_COMMAND_LINE,
} = require("./GeneratorConfiguration");

const EXPECTED_VOCAB_LIST_FROM_YAML = [
  {
    descriptionFallback:
      "Snippet of Schema.org from Google, Microsoft, Yahoo and Yandex",
    inputResources: ["test/resources/vocab/schema-snippet.ttl"],
    termSelectionResource: "test/resources/vocab/schema-inrupt-ext.ttl",
  },
  {
    descriptionFallback: "Some dummy online vocabulary",
    nameAndPrefixOverride: "dummy",
    inputResources: ["http://some.vocabulary.online/dummy"],
  },
];

// This YAML file will always match the latest version of the generator
const VERSION_MATCHING_YAML = `
artifactName: generated-vocab-common-TEST
##
# This generator version will always mismatch the current artifact version.
##
artifactGeneratorVersion: ${packageDotJson.version}

artifactToGenerate:
  - programmingLanguage: Java
    artifactVersion: 3.2.1-SNAPSHOT
    javaPackageName: com.inrupt.testing
    solidCommonVocabVersion: "0.1.0-SNAPSHOT"
    artifactDirectoryName: Java
    templateInternal: solidCommonVocabDependent/java/rdf4j/vocab.hbs
    sourceFileExtension: java

vocabList:
  - descriptionFallback: Snippet of Schema.org from Google, Microsoft, Yahoo and Yandex
    inputResources:
      - ./schema-snippet.ttl
    termSelectionResource: schema-inrupt-ext.ttl
`;

const MOCKED_USER_INPUT = { artifactName: "someName" };

describe("Generator configuration", () => {
  describe("Processing vocab list file.", () => {
    // FAILURE CASES
    it("should fail with non-existent vocab list file", async () => {
      const nonExistFile = " nonsense file name";
      await expect(() => {
        GeneratorConfiguration.fromConfigFile(nonExistFile);
      }).toThrow("Failed to read configuration file");
    });

    it("should fail with invalid YAML vocab list file", async () => {
      const notYamlFile = "./test/resources/yamlConfig/vocab-list.txt";
      await expect(() => {
        GeneratorConfiguration.fromConfigFile(notYamlFile);
      }).toThrow("Failed to read configuration file");
    });

    it("should fail with missing artifactDirectoryName in YAML vocab list file", async () => {
      const notYamlFile =
        "./test/resources/yamlConfig/vocab-list-missing-artifactDirectoryName.yml";
      await expect(() => {
        GeneratorConfiguration.fromConfigFile(notYamlFile);
      }).toThrow("The target directory name ");
    });

    it("should throw an error trying to parse an empty YAML file", async () => {
      const configFile = "empty-config-file.yml";
      const configPath = `./test/resources/yamlConfig/${configFile}`;

      await expect(() => {
        GeneratorConfiguration.fromConfigFile(configPath);
      }).toThrow("Empty configuration file");
    });

    it("should throw an error trying to parse a syntactically incorrect YAML file", async () => {
      const configFile = "not-yaml.yml";
      const configPath = `./test/resources/yamlConfig/${configFile}`;

      await expect(() => {
        GeneratorConfiguration.fromConfigFile(configPath);
      }).toThrow(/^Failed to read configuration file/);
    });

    it("should throw an error trying to generate from an empty vocab list", async () => {
      const configFile = "empty-vocab-list.yml";
      const configPath = `./test/resources/yamlConfig/${configFile}`;

      // Test that the error message contains the expected explanation and file name
      await expect(() => {
        GeneratorConfiguration.fromConfigFile(configPath);
      }).toThrow(/No vocabularies found/);
    });

    it("should throw an error if vocab list input resources are not all simple strings", async () => {
      const configFile = "invalid-vocab-list.yml";
      const configPath = `./test/resources/yamlConfig/${configFile}`;

      // Test that the error message contains the expected explanation and file name
      await expect(() => {
        GeneratorConfiguration.fromConfigFile(configPath);
      }).toThrow("input resource position [2])");
    });

    it("should throw an error if vocab list entry has no input resources", async () => {
      const configFile = "invalid-vocab-list-no-input-resources.yml";
      const configPath = `./test/resources/yamlConfig/${configFile}`;

      // Test that the error message contains the expected explanation and file name
      await expect(() => {
        GeneratorConfiguration.fromConfigFile(configPath);
      }).toThrow("has no input resources (in vocab position [0])");
    });

    it("should throw an error trying to generate from an empty artifact list", async () => {
      const configFile = "no-artifacts.yml";
      const configPath = `./test/resources/yamlConfig/${configFile}`;

      // Test that the error message contains the expected explanation and file name
      await expect(() => {
        GeneratorConfiguration.fromConfigFile(configPath);
      }).toThrow(/No artifacts found/);
    });

    it("should fail if a packaging system does not provide any templates", async () => {
      const configPath = `./test/resources/packaging/vocab-list-no-packaging-templates.yml`;

      // Test that the error message contains the expected explanation and file name
      await expect(() => {
        GeneratorConfiguration.fromConfigFile(configPath);
      }).toThrow("No templates associated to packaging tool");
    });

    it("should fail if the YAML config does not provide an artifactName", () => {
      expect(() => {
        GeneratorConfiguration.fromConfigFile(
          "./test/resources/yamlConfig/vocab-list-no-name.yml",
        );
      }).toThrow("Missing 'artifactName' field");
    });

    it("should fail if the YAML config does not provide a artifactGeneratorVersion", () => {
      expect(() => {
        GeneratorConfiguration.fromConfigFile(
          "./test/resources/yamlConfig/vocab-list-no-version.yml",
        );
      }).toThrow("Missing 'artifactGeneratorVersion' field");
    });

    // SUCCESS CASE
    it("should generate collected configuration from vocab list file", async () => {
      const generatorConfiguration = new GeneratorConfiguration({
        _: ["generate"],
        vocabListFile: "./test/resources/vocab/vocab-list-including-online.yml",
        noPrompt: true,
      });

      expect(generatorConfiguration.configuration.noPrompt).toBe(true);
      expect(generatorConfiguration.configuration.vocabList).toEqual(
        EXPECTED_VOCAB_LIST_FROM_YAML,
      );
    });

    it("should produce warning because our Artifact Generator version mismatches the version in the specified config file", async () => {
      const generatorConfiguration = new GeneratorConfiguration({
        _: ["generate"],
        vocabListFile:
          "./test/resources/yamlConfig/vocab-list-version-mismatch.yml",
        noPrompt: true,
      });

      // We expect the Artifact Generator version number in the generated
      // artifacts to be our actual version number, and not the version number
      // that appears in the incoming config file.
      expect(
        generatorConfiguration.configuration.artifactGeneratorVersion,
      ).toEqual(packageDotJson.version);
    });

    it("should be ok if our Artifact Generator version matches the version number in the specified config file", async () => {
      const configDirectory = "./test/Generated/UNIT_TEST/YamlConfig";
      const configPath = `${configDirectory}/vocab-list-version-match.yml`;

      // We need to create a local config file with the correct (i.e. our
      // current Artifact Generator version number (which we read from our
      // own 'package.json' file!).
      fs.mkdirSync(configDirectory, { recursive: true });
      fs.writeFileSync(configPath, VERSION_MATCHING_YAML);

      const generatorConfiguration = new GeneratorConfiguration(
        {
          _: ["generate"],
          vocabListFile: configPath,
          noPrompt: true,
        },
        undefined,
      );

      expect(
        generatorConfiguration.configuration.artifactGeneratorVersion,
      ).toEqual(packageDotJson.version);
    });

    it("should normalize paths relative to the configuration file", async () => {
      const configPath = "./test/resources/normalization/";
      const generatorConfiguration = new GeneratorConfiguration({
        _: ["generate"],
        vocabListFile: path.join(configPath, "vocab-list.yml"),
        noPrompt: true,
      });

      const normalizedConfig = generatorConfiguration.configuration;

      // Templates paths should be normalized wrt the module root
      expect(normalizedConfig.artifactToGenerate[0].sourceCodeTemplate).toEqual(
        path.join(
          "template",
          "solidCommonVocabDependent",
          "java",
          "rdf4j",
          "vocab.hbs",
        ),
      );
      expect(
        normalizedConfig.artifactToGenerate[0].packaging[0]
          .packagingTemplates[0].template,
      ).toEqual(
        path.join(
          "template",
          "solidCommonVocabDependent",
          "java",
          "rdf4j",
          "pom.hbs",
        ),
      );

      expect(
        normalizedConfig.artifactToGenerate[0].packaging[0]
          .packagingTemplates[1].template,
      ).toEqual(path.join(configPath, "../../readme.hbs"));

      expect(normalizedConfig.artifactToGenerate[1].sourceCodeTemplate).toEqual(
        path.join(configPath, "../anotherTemplateDirectory/javascript.hbs"),
      );

      expect(generatorConfiguration.configuration.noPrompt).toBe(true);
    });
  });

  describe("Exercise normalizeConfigPaths", () => {
    it("should normalize config path", () => {
      const config = GeneratorConfiguration.normalizeConfigPaths(
        {
          versioning: {
            versioningTemplates: [
              {
                templateInternal: "templateXXXXInternal",
                templateCustom: "templateXXXCustom",
              },
            ],
          },
          artifactToGenerate: [],
        },
        CONFIG_SOURCE_COMMAND_LINE,
      );

      expect(config.versioning.versioningTemplates[0].template).toEqual(
        "template/templateXXXXInternal",
      );
    });
  });

  describe("Missing template values.", () => {
    it("should fail if missing programming language template", async () => {
      const configPath = "./test/resources/normalization/";

      const programmingLanguage = path.join(
        configPath,
        "missing-programming-language-template.yml",
      );

      expect(
        () =>
          new GeneratorConfiguration({
            _: ["generate"],
            vocabListFile: programmingLanguage,
            noPrompt: true,
          }),
      ).toThrow("but neither was provided", programmingLanguage);
    });

    it("should fail if missing packaging template", async () => {
      const configPath = "./test/resources/normalization/";

      const packaging = path.join(configPath, "missing-packaging-template.yml");
      expect(
        () =>
          new GeneratorConfiguration({
            _: ["generate"],
            vocabListFile: packaging,
            noPrompt: true,
          }),
      ).toThrow("but neither was provided", packaging);
    });

    it("should fail if missing versioning template", async () => {
      const configPath = "./test/resources/normalization/";

      const versioning = path.join(
        configPath,
        "missing-versioning-template.yml",
      );
      expect(
        () =>
          new GeneratorConfiguration({
            _: ["generate"],
            vocabListFile: versioning,
            noPrompt: true,
          }),
      ).toThrow("but neither was provided", versioning);
    });
  });

  describe("Processing command line.", () => {
    it("should fail with no parameters passed", async () => {
      await expect(() => {
        GeneratorConfiguration.fromCommandLine({});
      }).toThrow("Missing input resource");
    });

    it("should fail with non-existent input resource for generation", async () => {
      await expect(() => {
        GeneratorConfiguration.fromCommandLine({ _: ["generate"] });
      }).toThrow("Missing input resource");
    });

    // FAILURE CASE
    it("should fail with non-existent input resource for generation", async () => {
      const config = GeneratorConfiguration.fromCommandLine({
        _: ["generate"],
        inputResources: ["test/resources/vocab/schema-snippet.ttl"],
        vocabAcceptHeaderOverride: "text/turtle",
        vocabContentTypeHeaderOverride: "text/trig",
        vocabContentTypeHeaderFallback: "text/trig-star",
      });

      expect(config.vocabList[0].vocabAcceptHeaderOverride).toBe("text/turtle");
      expect(config.vocabList[0].vocabContentTypeHeaderOverride).toBe(
        "text/trig",
      );
      expect(config.vocabList[0].vocabContentTypeHeaderFallback).toBe(
        "text/trig-star",
      );
    });

    it("should accept a non-existent input resource for initialization", async () => {
      await expect(() => {
        GeneratorConfiguration.fromCommandLine({ _: ["init"] });
      }).not.toThrow("Missing input resource");
    });

    // SUCCESS CASE
    it("should generate collected configuration from command line", async () => {
      const argnamespaceIriOverride =
        "override namespace (should be an IRI really!)";
      const generatorConfiguration = new GeneratorConfiguration({
        _: ["generate"],
        inputResources: ["test/resources/vocab/schema-snippet.ttl"],
        moduleNamePrefix: "@inrupt/generated-vocab-",
        nameAndPrefixOverride: "dummy-test",
        namespaceIriOverride: argnamespaceIriOverride,
        ignoreNonVocabTerms: true,
        noPrompt: true,
      });

      expect(generatorConfiguration.configuration.noPrompt).toBe(true);

      expect(generatorConfiguration.configuration.vocabList).toEqual([
        {
          inputResources: ["test/resources/vocab/schema-snippet.ttl"],
          nameAndPrefixOverride: "dummy-test",
          namespaceIriOverride: argnamespaceIriOverride,
          ignoreNonVocabTerms: true,
        },
      ]);

      expect(generatorConfiguration.configuration.artifactToGenerate).toEqual(
        DEFAULT_CLI_ARTIFACT,
      );
    });

    it("should normalize absolute paths", async () => {
      const absolutePath = path.join(
        `${process.cwd()}`,
        "test/resources/vocab/schema-snippet.ttl",
      );
      const generatorConfiguration = new GeneratorConfiguration({
        _: ["generate"],
        inputResources: [absolutePath],
        moduleNamePrefix: "@inrupt/generated-vocab-",
        noPrompt: true,
      });
      expect(generatorConfiguration.configuration.vocabList).toEqual([
        {
          inputResources: ["test/resources/vocab/schema-snippet.ttl"],
        },
      ]);
    });

    it("should modify the default publication command if a registry is set", async () => {
      const registry = "http://my.registry.ninja";
      const generatorConfiguration = new GeneratorConfiguration({
        _: ["generate"],
        inputResources: ["test/resources/vocab/schema-snippet.ttl"],
        moduleNamePrefix: "@inrupt/generated-vocab-",
        noPrompt: true,
        npmRegistry: "http://my.registry.ninja",
      });

      expect(
        generatorConfiguration.configuration.artifactToGenerate[0].packaging[0]
          .publish[0].command,
      ).toEqual(
        `npm unpublish --force --registry ${registry} && npm install --registry ${registry} && npm publish --registry ${registry}`,
      );
    });
  });

  describe("License", () => {
    it("should collect the license text from header if provided", () => {
      const generatorConfiguration = GeneratorConfiguration.fromConfigFile(
        "test/resources/yamlConfig/vocab-license-header.yml",
      );
      expect(generatorConfiguration.license.header).toEqual(
        "// This is a mock license header.",
      );
    });

    it("should collect and normalize license path and target file name", () => {
      const generatorConfiguration = GeneratorConfiguration.fromConfigFile(
        "test/resources/yamlConfig/vocab-license.yml",
      );
      expect(generatorConfiguration.license.path).toEqual(
        "test/resources/license/license",
      );
      expect(generatorConfiguration.license.fileName).toEqual("LICENSE");
    });
  });

  // TODO: Should include more specific tests here (e.g. for files being
  //  modified), but currently more complex and higher-level generation tests
  //  cover all code branches (whereas really the tests here should fully cover
  //  the class under test).
  describe("Detecting changed resources", () => {
    it("should return term selection file only if changed before timestamp", async () => {
      const generatorConfiguration = new GeneratorConfiguration({
        vocabListFile: path.join(
          "test",
          "resources",
          "yamlConfig",
          "vocab-rdf-library-java-rdf4j.yml",
        ),
      });
      const termSelectionResource = path.join(
        "test",
        "resources",
        "vocab",
        "schema-inrupt-ext.ttl",
      );

      const timeTermSelectionChanged = fs.statSync(
        termSelectionResource,
      ).mtimeMs;
      const changedBefore =
        await generatorConfiguration.getInputResourcesChangedSince(
          timeTermSelectionChanged - 10,
        );
      expect(changedBefore).toContain(termSelectionResource);

      const changedAfter =
        await generatorConfiguration.getInputResourcesChangedSince(
          timeTermSelectionChanged + 10,
        );
      expect(changedAfter).not.toContain(termSelectionResource);
    });
  });
});
