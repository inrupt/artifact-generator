require("mock-local-storage");

const fs = require("fs");
const path = require("path");
const del = require("del");

jest.mock("inquirer");

const inquirer = require("inquirer");

const ArtifactGenerator = require("./ArtifactGenerator");
const GeneratorConfiguration = require("../config/GeneratorConfiguration");
const {
  getArtifactDirectoryRoot,
  getArtifactDirectorySourceCode,
  DEFAULT_DIRECTORY_ROOT,
} = require("../Util");
const Resource = require("../Resource");

const MOCKED_ARTIFACT_NAME = "testArtifact";
const MOCKED_LIT_VOCAB_TERM_VERSION = "0.0.1";

const MOCKED_USER_INPUT = {
  artifactName: MOCKED_ARTIFACT_NAME,
  solidCommonVocabVersion: MOCKED_LIT_VOCAB_TERM_VERSION,
};

beforeEach(() => {
  inquirer.prompt.mockImplementation(
    jest.fn().mockReturnValue(Promise.resolve(MOCKED_USER_INPUT)),
  );
});

describe("Artifact Generator unit tests", () => {
  it("should provide a default output directory", () => {
    const artifactGenerator = new ArtifactGenerator({ configuration: {} });
    expect(artifactGenerator.artifactData.outputDirectory).toEqual(".");
  });

  describe("Processing vocab list file.", () => {
    function verifyVocabList(outputDirectory) {
      const outputDirectoryRoot = `${outputDirectory}${getArtifactDirectoryRoot()}`;
      expect(fs.existsSync(`${outputDirectoryRoot}/README.md`)).toBe(true);

      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;

      expect(fs.existsSync(`${outputDirectoryJavaScript}/index.js`)).toBe(true);
      expect(fs.existsSync(`${outputDirectoryJavaScript}/package.json`)).toBe(
        true,
      );

      expect(
        fs.existsSync(
          `${outputDirectoryJavaScript}/GeneratedVocab/OVERRIDE_NAME.js`,
        ),
      ).toBe(true);
      expect(
        fs.existsSync(
          `${outputDirectoryJavaScript}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`,
        ),
      ).toBe(true);

      const indexOutput = fs
        .readFileSync(`${outputDirectoryJavaScript}/index.js`)
        .toString();
      expect(indexOutput).toEqual(
        expect.stringContaining(
          `module.exports.SCHEMA_INRUPT_EXT = require("./GeneratedVocab/SCHEMA_INRUPT_EXT")`,
        ),
      );

      const packageOutput = fs
        .readFileSync(`${outputDirectoryJavaScript}/package.json`)
        .toString();
      expect(packageOutput).toEqual(
        expect.stringContaining(
          '"name": "@inrupt/generated-vocab-common-TEST",',
        ),
      );
      expect(packageOutput).toEqual(
        expect.stringContaining('"version": "10.11.12"'),
      );

      const outputDirectoryJava = `${outputDirectory}${getArtifactDirectorySourceCode()}/Java`;
      const pomOutput = fs
        .readFileSync(`${outputDirectoryJava}/pom.xml`)
        .toString();
      expect(pomOutput).toEqual(
        expect.stringContaining("<version>3.2.1-SNAPSHOT</version>"),
      );
    }

    it("should generate artifact from vocab list file", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/vocab-list-file";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        _: "generate",
        vocabListFile: "./test/resources/vocab/vocab-list.yml",
        outputDirectory,
        noPrompt: true,
      });
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      verifyVocabList(outputDirectory);
    });

    it("should generate associated files from version control", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/vocab-versioning";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        _: "generate",
        vocabListFile: "./test/resources/versioning/vocab-list.yml",
        outputDirectory,
        noPrompt: true,
      });
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      expect(
        fs.existsSync(path.join(outputDirectory, "Generated", ".gitignore")),
      ).toBe(true);
    });
  });

  describe("Processing command line vocab.", () => {
    it("should generate artifact without bundling", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/no-bundling";
      del.sync([`${outputDirectory}/*`]);
      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
        outputDirectory,
        artifactVersion: "1.0.0",
        artifactNamePrefix: "",
        artifactNameSuffix: "",
        moduleNamePrefix: "@inrupt/generated-vocab-",
        noPrompt: true,
        supportBundling: false,
        descriptionFallback: "Needs a description...",
        namespaceIriOverride: "https://schema.org/",
      });

      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;

      expect(fs.existsSync(`${outputDirectoryJavaScript}/config`)).toBe(false);
      expect(fs.existsSync(`${outputDirectoryJavaScript}/wrapper.js`)).toBe(
        true,
      );
      const packageOutput = fs
        .readFileSync(`${outputDirectoryJavaScript}/package.json`)
        .toString();
      expect(packageOutput.indexOf('"devDependencies",')).toEqual(-1);
    });

    it("should not ask for user input if no information is missing", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/no-bundling";

      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
        outputDirectory,
        artifactName: "someName",
        solidCommonVocabVersion: "^1.4.0",
        descriptionFallback: "Needs a description...",
        namespaceIriOverride: "https://schema.org/",
      });

      const artifactGenerator = new ArtifactGenerator(config);
      await artifactGenerator.generate();

      expect(artifactGenerator.artifactData.artifactName).toEqual("someName");
      expect(artifactGenerator.artifactData.solidCommonVocabVersion).toEqual(
        "^1.4.0",
      );
      expect(artifactGenerator.artifactData.artifactName).not.toEqual(
        MOCKED_ARTIFACT_NAME,
      );
      expect(
        artifactGenerator.artifactData.solidCommonVocabVersion,
      ).not.toEqual(MOCKED_LIT_VOCAB_TERM_VERSION);
    });

    it("should generate artifact with bundling", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/bundling";
      del.sync([`${outputDirectory}/*`]);
      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
        outputDirectory,
        artifactVersion: "1.0.0",
        artifactNamePrefix: "",
        artifactNameSuffix: "",

        supportBundling: true,
        babelCoreVersion: "^1.2.3",
        rollupVersion: "^4.5.6",
        rollupBabelPluginVersion: "^7.8.9",
        rollupCommonjsPluginVersion: "^10.11.12",
        rollupNodeResolveVersion: "^13.14.15",

        moduleNamePrefix: "@inrupt/generated-vocab-",
        noPrompt: true,
        descriptionFallback: "Needs a description...",
        namespaceIriOverride: "https://schema.org/",
      });
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      const outputDirectoryJavaScript = `${outputDirectory}${getArtifactDirectorySourceCode()}/JavaScript`;

      expect(fs.existsSync(`${outputDirectoryJavaScript}/config`)).toBe(true);
      expect(fs.existsSync(`${outputDirectoryJavaScript}/wrapper.js`)).toBe(
        false,
      );
      const packageOutput = fs
        .readFileSync(`${outputDirectoryJavaScript}/package.json`)
        .toString();
      expect(packageOutput.indexOf('"devDependencies":')).toBeGreaterThan(-1);
    });

    it("should not generate artifacts if the target directory is up-to-date", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/if-necessary";
      const generatedFile = path.join(
        outputDirectory,
        getArtifactDirectorySourceCode(),
        "JavaScript",
        "package.json",
      );
      del.sync([`${outputDirectory}/*`]);
      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
        outputDirectory,
        artifactVersion: "1.0.0",
        artifactNamePrefix: "",
        artifactNameSuffix: "",
        moduleNamePrefix: "@inrupt/generated-vocab-",
        noPrompt: true,
        descriptionFallback: "Needs a description...",
        namespaceIriOverride: "https://schema.org/",
      });
      const artifactGenerator = new ArtifactGenerator(config);

      // Initially, the directory is empty, so this generation should create
      // target source files.
      await artifactGenerator.generate();
      expect(fs.existsSync(generatedFile)).toBe(true);
      const initialGenerationTime = fs.statSync(generatedFile).mtimeMs;

      // The artifacts are up-to-date, so the generation should be prevented.
      await artifactGenerator.generate();
      expect(fs.statSync(generatedFile).mtimeMs).toEqual(initialGenerationTime);
    });

    it("should regenerate if input modified", async () => {
      const outputDirectory = path.join(
        ".",
        "test",
        "Generated",
        "UNIT_TEST",
        "ArtifactGenerator",
        "modify-input",
      );
      const generatedFile = path.join(
        outputDirectory,
        getArtifactDirectorySourceCode(),
        "JavaScript",
        "package.json",
      );
      del.sync([`${outputDirectory}/*`]);
      fs.mkdirSync(outputDirectory, { recursive: true });

      // Copy our input to a generated location (so that we can update them
      // without source control system thinking an actual change occurred).
      const sourceDataDirectory = path.join(
        ".",
        "test",
        "resources",
        "expectedOutput",
        "skipGeneration",
      );
      const testFile = path.join(outputDirectory, "static-first.ttl");

      fs.copyFileSync(
        path.join(sourceDataDirectory, "static-first.ttl"),
        testFile,
      );

      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: [testFile],
        outputDirectory,
        artifactVersion: "1.0.0",
        artifactNamePrefix: "",
        artifactNameSuffix: "",
        moduleNamePrefix: "@inrupt/generated-vocab-",
        noPrompt: true,
      });

      const artifactGenerator = new ArtifactGenerator(config);

      // Initially, the directory is empty, so this generation should create
      // target source files.
      await artifactGenerator.generate();
      expect(fs.existsSync(generatedFile)).toBe(true);
      const initialGenerationTime = fs.statSync(generatedFile).mtimeMs;

      // Ensure there's at least 1ms before making changes.
      await new Promise((res) => setTimeout(res, 1));
      // Modify our input file.
      Resource.touchFile(testFile);

      // The input was updated, so output should have been re-generated.
      await artifactGenerator.generate();
      expect(fs.statSync(generatedFile).mtimeMs).toBeGreaterThan(
        initialGenerationTime,
      );
    });

    it("should regenerate if extension input modified", async () => {
      const outputDirectory = path.join(
        ".",
        "test",
        "Generated",
        "UNIT_TEST",
        "ArtifactGenerator",
        "modify-extension-input",
      );
      const generatedFilePackage = path.join(
        outputDirectory,
        getArtifactDirectorySourceCode(),
        "JavaScript",
        "package.json",
      );
      const generatedFileVocab = path.join(
        outputDirectory,
        getArtifactDirectorySourceCode(),
        "JavaScript",
        "GeneratedVocab",
        "TEST_VOCAB_1.js",
      );

      del.sync([`${outputDirectory}/*`]);
      fs.mkdirSync(outputDirectory, { recursive: true });

      // Copy our input to a generated location (so that we can update them
      // without source control system thinking an actual change occurred).
      const sourceDataDirectory = path.join(
        ".",
        "test",
        "resources",
        "expectedOutput",
        "skipGeneration",
      );

      const testConfigFile = path.join(
        outputDirectory,
        "vocab-list-static-with-extension.yml",
      );
      const testFile = path.join(outputDirectory, "static-first.ttl");
      const testFileExtension = path.join(
        outputDirectory,
        "static-first-extension.ttl",
      );

      fs.copyFileSync(
        path.join(sourceDataDirectory, "vocab-list-static-with-extension.yml"),
        testConfigFile,
      );
      fs.copyFileSync(
        path.join(sourceDataDirectory, "static-first.ttl"),
        testFile,
      );
      fs.copyFileSync(
        path.join(sourceDataDirectory, "static-first-extension.ttl"),
        testFileExtension,
      );

      const config = new GeneratorConfiguration({
        _: "generate",
        vocabListFile: testConfigFile,
        outputDirectory,
        noPrompt: true,
      });

      const artifactGenerator = new ArtifactGenerator(config);

      // Initially, the directory is empty, so this generation should create
      // target source files.
      await artifactGenerator.generate();
      expect(fs.existsSync(generatedFilePackage)).toBe(true);
      const initialGenerationTimePackage =
        fs.statSync(generatedFilePackage).mtimeMs;
      expect(fs.existsSync(generatedFileVocab)).toBe(true);
      const initialGenerationTimeVocab =
        fs.statSync(generatedFileVocab).mtimeMs;

      // Ensure there's at least 1ms before making changes.
      await new Promise((res) => setTimeout(res, 1));
      // Modify our extension file.
      Resource.touchFile(testFileExtension);

      // The input was updated, so output should have been re-generated.
      await artifactGenerator.generate();
      expect(fs.statSync(generatedFilePackage).mtimeMs).toBeGreaterThan(
        initialGenerationTimePackage,
      );
      expect(fs.statSync(generatedFileVocab).mtimeMs).toBeGreaterThan(
        initialGenerationTimeVocab,
      );
    });

    it("should regenerate *only* based on modified input, not all input", async () => {
      const outputDirectory = path.join(
        ".",
        "test",
        "Generated",
        "UNIT_TEST",
        "ArtifactGenerator",
        "modify-one-of-multiple-inputs",
      );
      const generatedFileFirst = path.join(
        outputDirectory,
        getArtifactDirectorySourceCode(),
        "JavaScript",
        "GeneratedVocab",
        "TEST_VOCAB_1.js",
      );
      const generatedFileSecond = path.join(
        outputDirectory,
        getArtifactDirectorySourceCode(),
        "JavaScript",
        "GeneratedVocab",
        "TEST_VOCAB_2.js",
      );
      del.sync([`${outputDirectory}/*`]);
      fs.mkdirSync(outputDirectory, { recursive: true });

      // Copy our input to a generated location (so that we can update them
      // without source control system thinking an actual change occurred).
      const sourceDataDirectory = path.join(
        ".",
        "test",
        "resources",
        "expectedOutput",
        "skipGeneration",
      );
      const testConfigFile = path.join(
        outputDirectory,
        "vocab-list-static.yml",
      );
      const testInputFirst = path.join(outputDirectory, "static-first.ttl");
      const testInputSecond = path.join(outputDirectory, "static-second.ttl");
      fs.copyFileSync(
        path.join(sourceDataDirectory, "vocab-list-static.yml"),
        testConfigFile,
      );
      fs.copyFileSync(
        path.join(sourceDataDirectory, "static-first.ttl"),
        testInputFirst,
      );
      fs.copyFileSync(
        path.join(sourceDataDirectory, "static-second.ttl"),
        testInputSecond,
      );

      const config = new GeneratorConfiguration({
        _: "generate",
        vocabListFile: testConfigFile,
        outputDirectory,
        noPrompt: true,
      });

      const artifactGenerator = new ArtifactGenerator(config);

      // Initially, the directory is empty, so this generation should create
      // target source files.
      await artifactGenerator.generate();
      expect(fs.existsSync(generatedFileFirst)).toBe(true);
      expect(fs.existsSync(generatedFileSecond)).toBe(true);
      const initialGenerationTimeFirst =
        fs.statSync(generatedFileFirst).mtimeMs;
      const initialGenerationTimeSecond =
        fs.statSync(generatedFileSecond).mtimeMs;

      // Ensure there's at least 1ms before making changes.
      await new Promise((res) => setTimeout(res, 1));
      // Modify just one of our input files.
      Resource.touchFile(testInputSecond);

      await artifactGenerator.generate();

      // Only one input was updated, so only the corresponding output should
      // have been re-generated.
      expect(fs.statSync(generatedFileSecond).mtimeMs).toBeGreaterThan(
        initialGenerationTimeSecond,
      );
      expect(fs.statSync(generatedFileFirst).mtimeMs).toEqual(
        initialGenerationTimeFirst,
      );

      // Ensure there's at least 1ms before making changes.
      await new Promise((res) => setTimeout(res, 1));
      // Modify the other input file.
      Resource.touchFile(testInputFirst);

      // Record the current time for the non-touched input file.
      const newGenerationTimeSecond = fs.statSync(generatedFileSecond).mtimeMs;

      await artifactGenerator.generate();

      // Only one input was updated, so only the corresponding output should
      // have been re-generated.
      expect(fs.statSync(generatedFileSecond).mtimeMs).toEqual(
        newGenerationTimeSecond,
      );
      expect(fs.statSync(generatedFileFirst).mtimeMs).toBeGreaterThan(
        initialGenerationTimeFirst,
      );
    });

    it("should regenerate all when config file modified", async () => {
      const outputDirectory = path.join(
        ".",
        "test",
        "Generated",
        "UNIT_TEST",
        "ArtifactGenerator",
        "modify-config-file",
      );
      const generatedFileFirst = path.join(
        outputDirectory,
        getArtifactDirectorySourceCode(),
        "JavaScript",
        "GeneratedVocab",
        "TEST_VOCAB_1.js",
      );
      const generatedFileSecond = path.join(
        outputDirectory,
        getArtifactDirectorySourceCode(),
        "JavaScript",
        "GeneratedVocab",
        "TEST_VOCAB_2.js",
      );
      del.sync([`${outputDirectory}/*`]);
      fs.mkdirSync(outputDirectory, { recursive: true });

      // Copy our input to a generated location (so that we can update them
      // without source control system thinking an actual change occurred).
      const sourceDataDirectory = path.join(
        ".",
        "test",
        "resources",
        "expectedOutput",
        "skipGeneration",
      );
      const testConfigFile = path.join(
        outputDirectory,
        "vocab-list-static.yml",
      );
      const testInputFirst = path.join(outputDirectory, "static-first.ttl");
      const testInputSecond = path.join(outputDirectory, "static-second.ttl");
      fs.copyFileSync(
        path.join(sourceDataDirectory, "vocab-list-static.yml"),
        testConfigFile,
      );
      fs.copyFileSync(
        path.join(sourceDataDirectory, "static-first.ttl"),
        testInputFirst,
      );
      fs.copyFileSync(
        path.join(sourceDataDirectory, "static-second.ttl"),
        testInputSecond,
      );

      const config = new GeneratorConfiguration({
        _: "generate",
        vocabListFile: testConfigFile,
        outputDirectory,
        noPrompt: true,
      });

      const artifactGenerator = new ArtifactGenerator(config);

      // Initially, the directory is empty, so this generation should create
      // target source files.
      await artifactGenerator.generate();
      expect(fs.existsSync(generatedFileFirst)).toBe(true);
      expect(fs.existsSync(generatedFileSecond)).toBe(true);
      const initialGenerationTimeFirst =
        fs.statSync(generatedFileFirst).mtimeMs;
      const initialGenerationTimeSecond =
        fs.statSync(generatedFileSecond).mtimeMs;

      // Ensure there's at least 1ms before making changes.
      await new Promise((res) => setTimeout(res, 1));
      // Modify just our configuration file.
      Resource.touchFile(testConfigFile);

      await artifactGenerator.generate();

      // Both vocabs should have been re-generated, even though neither changed
      // (only the config file changed).
      expect(fs.statSync(generatedFileFirst).mtimeMs).toBeGreaterThan(
        initialGenerationTimeFirst,
      );
      expect(fs.statSync(generatedFileSecond).mtimeMs).toBeGreaterThan(
        initialGenerationTimeSecond,
      );
    });

    it("should generate when forced, even if the target directory is up-to-date", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/if-necessary";
      const generatedFile = path.join(
        outputDirectory,
        getArtifactDirectorySourceCode(),
        "JavaScript",
        "package.json",
      );
      del.sync([`${outputDirectory}/*`]);
      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
        outputDirectory,
        artifactVersion: "1.0.0",
        artifactNamePrefix: "",
        artifactNameSuffix: "",
        moduleNamePrefix: "@inrupt/generated-vocab-",
        noPrompt: true,
        force: true,
        descriptionFallback: "Needs a description...",
        namespaceIriOverride: "https://schema.org/",
      });
      const artifactGenerator = new ArtifactGenerator(config);

      // Initially, the directory is empty, so this generation should create target source files
      await artifactGenerator.generate();
      expect(fs.existsSync(generatedFile)).toBe(true);
      const initialGenerationTime = fs.statSync(generatedFile).mtimeMs;

      // The artifacts are up-to-date, but the generation is forced anyway
      await artifactGenerator.generate();
      expect(fs.statSync(generatedFile).mtimeMs).not.toEqual(
        initialGenerationTime,
      );
    });

    it("should clear the target directory if the option is set", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/clear";
      del.sync([`${outputDirectory}/*`]);

      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
      }
      const canaryFileRoot = path.join(outputDirectory, "canaryRoot.txt");
      fs.writeFileSync(canaryFileRoot, "A canary file in the root directory");

      const generatedDir = path.join(outputDirectory, DEFAULT_DIRECTORY_ROOT);
      if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir);
      }
      const canaryFileGeneratedDir = path.join(
        generatedDir,
        "canaryInGeneratedDir.txt",
      );
      fs.writeFileSync(
        canaryFileGeneratedDir,
        "A canary file in the generated directory",
      );

      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
        outputDirectory,
        artifactVersion: "1.0.0",
        artifactNamePrefix: "",
        artifactNameSuffix: "",
        moduleNamePrefix: "@inrupt/generated-vocab-",
        noPrompt: true,
        clearOutputDirectory: true,
        descriptionFallback: "Needs a description...",
        namespaceIriOverride: "https://schema.org/",
      });
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      expect(fs.existsSync(canaryFileRoot)).toEqual(true);
      expect(fs.existsSync(canaryFileGeneratedDir)).toEqual(false);
    });
  });

  describe("Publishing artifacts", () => {
    it("should publish artifacts locally using templated command", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/publish/templatedCommand";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile:
          "./test/resources/packaging/vocab-list-dummy-commands.yml",
        outputDirectory,
        noPrompt: true,
        force: true, // We need to FORCE generation to ensure publication.
      });

      const artifactGenerator = new ArtifactGenerator(config);
      await artifactGenerator.generate().then(() => {
        artifactGenerator.runPublish("templatedCommand");
      });

      // This is just an idea (not implemented yet) - might be nice to allow
      // the command to be run to be templated, allowing us to be very specific
      // and dynamic about the commands we run.
      expect(
        fs.existsSync(
          // `${outputDirectory}/${getArtifactDirectorySourceCode()}/JavaScript/templated-@inrupt-test/test-prefix-generated-vocab-common-TEST@10.11.12`
          `${outputDirectory}/${getArtifactDirectorySourceCode()}/JavaScript/templated---@-file`,
        ),
      ).toBe(true);
    });

    it("should publish artifacts locally if the publication option is specified, and we regenerated", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/publish/optionSetLocal";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile:
          "./test/resources/packaging/vocab-list-dummy-commands.yml",
        outputDirectory,
        noPrompt: true,
        force: true, // We need to FORCE generation to ensure publication.
      });

      const artifactGenerator = new ArtifactGenerator(config);
      await artifactGenerator.generate().then(() => {
        artifactGenerator.runPublish("local");
      });

      // In the config file, the publication command has been replaced by a command creating a
      // file in the artifact root folder.
      expect(
        fs.existsSync(
          `${outputDirectory}${getArtifactDirectorySourceCode()}/Java/mvn-publishLocal`,
        ),
      ).toBe(true);
      expect(
        fs.existsSync(
          `${outputDirectory}${getArtifactDirectorySourceCode()}/Java/mvn-publishRemote`,
        ),
      ).toBe(false);
      expect(
        fs.existsSync(
          `${outputDirectory}/${getArtifactDirectorySourceCode()}/JavaScript/npm-publishLocal`,
        ),
      ).toBe(true);
      expect(
        fs.existsSync(
          `${outputDirectory}/${getArtifactDirectorySourceCode()}/JavaScript/npm-publishRemote`,
        ),
      ).toBe(false);
    });

    it("should not publish artifacts if generation was skipped", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/publish/regenerate";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        _: "generate",
        vocabListFile:
          "./test/resources/packaging/vocab-list-dummy-commands.yml",
        outputDirectory,
        noPrompt: true,
      });

      const artifactGenerator = new ArtifactGenerator(config);
      const result = await artifactGenerator.generate().then(() => {
        return artifactGenerator.runPublish("local");
      });
      expect(result.ranPublish).toEqual(true);

      // Now re-run the test, but expect publish to *not* be executed.
      const rerunConfig = new GeneratorConfiguration({
        _: "generate",
        vocabListFile:
          "./test/resources/packaging/vocab-list-dummy-commands.yml",
        outputDirectory,
        noPrompt: true,
      });

      const rerunArtifactGenerator = new ArtifactGenerator(rerunConfig);
      const rerunResult = await rerunArtifactGenerator.generate().then(() => {
        return rerunArtifactGenerator.runPublish("local");
      });
      expect(rerunResult.ranPublish).toBeUndefined();
    });

    it("should not attempt re-unpublish if failing command is not 'npm unpublish'", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/publish/retryOnlyIfUnpublish";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile:
          "./test/resources/packaging/vocab-list-invalid-non-unpublish-command.yml",
        outputDirectory,
        noPrompt: true,
        force: true, // We need to FORCE generation to ensure publication.
      });

      const artifactGenerator = new ArtifactGenerator(config);
      await artifactGenerator.generate();

      expect(() => artifactGenerator.runPublish("local")).toThrowError(
        "exec-command-guaranteed-to-fail-on-any-operating-system",
      );

      expect(
        fs.existsSync(
          `${outputDirectory}/${getArtifactDirectorySourceCode()}/JavaScript/npm-publishRemote`,
        ),
      ).toBe(false);
    });

    it("should attempt re-unpublish if first attempt fails", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/publish/retryUnpublishFails";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile:
          "./test/resources/packaging/vocab-list-unpublish-command.yml",
        outputDirectory,
        noPrompt: true,
        force: true, // We need to FORCE generation to ensure publication.
      });

      const artifactGenerator = new ArtifactGenerator(config);
      await artifactGenerator.generate();
      expect(() => artifactGenerator.runPublish("local")).not.toThrow();
    });
  });

  describe("Missing packaging info.", () => {
    it("should throw with missing packaging info", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/backwardCompatibility/";
      del.sync([`${outputDirectory}/*`]);

      const yamlFile =
        "./test/resources/backwardCompatibility/vocab-list_no-packaging.yml";
      const config = new GeneratorConfiguration({
        _: "generate",
        vocabListFile: yamlFile,
        outputDirectory,
        noPrompt: true,
      });

      const artifactGenerator = new ArtifactGenerator(config);
      await expect(artifactGenerator.generate()).rejects.toThrowError(yamlFile);
    });
  });

  describe("License file generation", () => {
    it("should generate a license file", async () => {
      const outputDirectory =
        "test/Generated/UNIT_TEST/ArtifactGenerator/vocab-list-file";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        _: "generate",
        vocabListFile: "./test/resources/yamlConfig/vocab-license.yml",
        outputDirectory,
        noPrompt: true,
      });
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      expect(
        fs.existsSync(path.join(outputDirectory, "TypeScript", "LICENSE")),
      );
    });
  });
});
