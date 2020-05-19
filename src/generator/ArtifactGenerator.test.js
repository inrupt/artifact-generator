require("mock-local-storage");

const fs = require("fs");
const path = require("path");
const del = require("del");

jest.mock("inquirer");
const inquirer = require("inquirer");

const ArtifactGenerator = require("./ArtifactGenerator");
const GeneratorConfiguration = require("../config/GeneratorConfiguration");
const { ARTIFACT_DIRECTORY_SOURCE_CODE } = require("./ArtifactGenerator");

const MOCKED_ARTIFACT_NAME = "testArtifact";
const MOCKED_LIT_VOCAB_TERM_VERSION = "0.0.1";

const MOCKED_USER_INPUT = {
  artifactName: MOCKED_ARTIFACT_NAME,
  litVocabTermVersion: MOCKED_LIT_VOCAB_TERM_VERSION
};

beforeEach(() => {
  inquirer.prompt.mockImplementation(
    jest.fn().mockReturnValue(Promise.resolve(MOCKED_USER_INPUT))
  );
});

describe("Artifact Generator", () => {
  describe("Processing vocab list file.", () => {
    function verifyVocabList(outputDirectory) {
      const outputDirectoryJavaScript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/JavaScript`;

      expect(fs.existsSync(`${outputDirectoryJavaScript}/index.js`)).toBe(true);
      expect(fs.existsSync(`${outputDirectoryJavaScript}/package.json`)).toBe(
        true
      );

      expect(
        fs.existsSync(
          `${outputDirectoryJavaScript}/GeneratedVocab/OVERRIDE_NAME.js`
        )
      ).toBe(true);
      expect(
        fs.existsSync(
          `${outputDirectoryJavaScript}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`
        )
      ).toBe(true);

      const indexOutput = fs
        .readFileSync(`${outputDirectoryJavaScript}/index.js`)
        .toString();
      expect(indexOutput).toEqual(
        expect.stringContaining(
          `module.exports.SCHEMA_INRUPT_EXT = require("./GeneratedVocab/SCHEMA_INRUPT_EXT")`
        )
      );

      const packageOutput = fs
        .readFileSync(`${outputDirectoryJavaScript}/package.json`)
        .toString();
      expect(packageOutput).toEqual(
        expect.stringContaining('"name": "@lit/generated-vocab-common-TEST",')
      );
      expect(packageOutput).toEqual(
        expect.stringContaining('"version": "10.11.12"')
      );

      const outputDirectoryJava = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java`;
      const pomOutput = fs
        .readFileSync(`${outputDirectoryJava}/pom.xml`)
        .toString();
      expect(pomOutput).toEqual(
        expect.stringContaining("<version>3.2.1-SNAPSHOT</version>")
      );
    }

    it("should generate artifact from vocab list file", async () => {
      const outputDirectory =
        "test/Generated/ArtifactGenerator/vocab-list-file";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile: "./test/resources/vocabs/vocab-list.yml",
        outputDirectory,
        noprompt: true
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      verifyVocabList(outputDirectory);
    });

    it("should generate associated files from version control", async () => {
      const outputDirectory =
        "test/Generated/ArtifactGenerator/vocab-versioning";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile: "./test/resources/versioning/vocab-list.yml",
        outputDirectory,
        noprompt: true
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      expect(
        fs.existsSync(path.join(outputDirectory, "Generated", ".gitignore"))
      ).toBe(true);
    });
  });

  describe("Processing command line vocab.", () => {
    it("Should generate artifact without bundling", async () => {
      const outputDirectory = "test/Generated/ArtifactGenerator/no-bundling";
      del.sync([`${outputDirectory}/*`]);
      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: ["./test/resources/vocabs/schema-snippet.ttl"],
        outputDirectory,
        artifactVersion: "1.0.0",
        litVocabTermVersion: "^1.0.10",
        moduleNamePrefix: "@lit/generated-vocab-",
        noprompt: true,
        supportBundling: false
      });
      config.completeInitialConfiguration();

      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      const outputDirectoryJavaScript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/JavaScript`;

      expect(fs.existsSync(`${outputDirectoryJavaScript}/config`)).toBe(false);
      const packageOutput = fs
        .readFileSync(`${outputDirectoryJavaScript}/package.json`)
        .toString();
      expect(packageOutput.indexOf('"devDependencies",')).toEqual(-1);
    });

    it("should not ask for user input when no information is missing", async () => {
      const outputDirectory = "test/Generated/ArtifactGenerator/no-bundling";

      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: ["./test/resources/vocabs/schema-snippet.ttl"],
        outputDirectory,
        artifactName: "someName",
        litVocabTermVersion: "^1.0.10"
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();

      expect(artifactGenerator.artifactData.artifactName).toEqual("someName");
      expect(artifactGenerator.artifactData.litVocabTermVersion).toEqual(
        "^1.0.10"
      );
      expect(artifactGenerator.artifactData.artifactName).not.toEqual(
        MOCKED_ARTIFACT_NAME
      );
      expect(artifactGenerator.artifactData.litVocabTermVersion).not.toEqual(
        MOCKED_LIT_VOCAB_TERM_VERSION
      );
    });

    it("should ask for user input when version information missing", async () => {
      const outputDirectory = "test/Generated/ArtifactGenerator/no-bundling";
      // There are side-effects from test to test in the mocked functions, so we only count the new calls
      const before = inquirer.prompt.mock.calls.length;
      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: ["./test/resources/vocabs/schema-snippet.ttl"],
        outputDirectory,
        force: true
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      expect(inquirer.prompt.mock.calls.length - before).toEqual(1);
      expect(
        artifactGenerator.artifactData.artifactToGenerate[0].litVocabTermVersion
      ).toEqual(MOCKED_LIT_VOCAB_TERM_VERSION);
    });

    it("Should generate artifact with bundling", async () => {
      const outputDirectory = "test/Generated/ArtifactGenerator/bundling";
      del.sync([`${outputDirectory}/*`]);
      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: ["./test/resources/vocabs/schema-snippet.ttl"],
        outputDirectory,
        artifactVersion: "1.0.0",
        litVocabTermVersion: "^0.1.0",
        moduleNamePrefix: "@lit/generated-vocab-",
        noprompt: true,
        supportBundling: true
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      const outputDirectoryJavaScript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/JavaScript`;

      expect(fs.existsSync(`${outputDirectoryJavaScript}/config`)).toBe(true);
      const packageOutput = fs
        .readFileSync(`${outputDirectoryJavaScript}/package.json`)
        .toString();
      expect(packageOutput.indexOf('"devDependencies":')).toBeGreaterThan(-1);
    });

    it("Should not generate artifacts if they target directory is up-to-date", async () => {
      const outputDirectory = "./test/Generated/ArtifactGenerator/if-necessary";
      const generatedFile = path.join(
        outputDirectory,
        ARTIFACT_DIRECTORY_SOURCE_CODE,
        "JavaScript",
        "package.json"
      );
      del.sync([`${outputDirectory}/*`]);
      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: ["./test/resources/vocabs/schema-snippet.ttl"],
        outputDirectory,
        artifactVersion: "1.0.0",
        litVocabTermVersion: "^0.1.0",
        moduleNamePrefix: "@lit/generated-vocab-",
        noprompt: true
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      // Initially, the directory is empty, so this generation should create target source files
      await artifactGenerator.generate();
      expect(fs.existsSync(generatedFile)).toBe(true);
      const initialGenerationTime = fs.statSync(generatedFile).mtimeMs;

      // The artifacts are up-to-date, so the generation should be prevented
      await artifactGenerator.generate();
      expect(fs.statSync(generatedFile).mtimeMs).toEqual(initialGenerationTime);
    });

    it("Should generate when forced, even if the target directory is up-to-date", async () => {
      const outputDirectory = "./test/Generated/ArtifactGenerator/if-necessary";
      const generatedFile = path.join(
        outputDirectory,
        ARTIFACT_DIRECTORY_SOURCE_CODE,
        "JavaScript",
        "package.json"
      );
      del.sync([`${outputDirectory}/*`]);
      const config = new GeneratorConfiguration({
        _: "generate",
        inputResources: ["./test/resources/vocabs/schema-snippet.ttl"],
        outputDirectory,
        artifactVersion: "1.0.0",
        litVocabTermVersion: "^0.1.0",
        moduleNamePrefix: "@lit/generated-vocab-",
        noprompt: true,
        force: true
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      // Initially, the directory is empty, so this generation should create target source files
      await artifactGenerator.generate();
      expect(fs.existsSync(generatedFile)).toBe(true);
      const initialGenerationTime = fs.statSync(generatedFile).mtimeMs;

      // The artifacts are up-to-date, but the generation is forced anyway
      await artifactGenerator.generate();
      expect(fs.statSync(generatedFile).mtimeMs).not.toEqual(
        initialGenerationTime
      );
    });
  });

  describe("Publishing artifacts.", () => {
    it("should publish artifacts locally if the publication option is specified", async () => {
      const outputDirectory =
        "test/Generated/ArtifactGenerator/publish/optionSetLocal";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile:
          "./test/resources/packaging/vocab-list-dummy-commands.yml",
        outputDirectory,
        noprompt: true
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);
      await artifactGenerator.generate().then(() => {
        artifactGenerator.runPublish("local");
      });
      // In the config file, the publication command has been replaced by a command creating a file in the artifact root folder
      expect(
        fs.existsSync(
          `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java/mvn-publishLocal`
        )
      ).toBe(true);
      expect(
        fs.existsSync(
          `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java/mvn-publishRemote`
        )
      ).toBe(false);
      expect(
        fs.existsSync(
          `${outputDirectory}/${ARTIFACT_DIRECTORY_SOURCE_CODE}/JavaScript/npm-publishLocal`
        )
      ).toBe(true);
      expect(
        fs.existsSync(
          `${outputDirectory}/${ARTIFACT_DIRECTORY_SOURCE_CODE}/JavaScript/npm-publishRemote`
        )
      ).toBe(false);
    });

    it("should publish artifacts remotely if the publication option is specified", async () => {
      const outputDirectory =
        "test/Generated/ArtifactGenerator/publish/optionSetRemote";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile:
          "./test/resources/packaging/vocab-list-dummy-commands.yml",
        outputDirectory,
        noprompt: true
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);
      await artifactGenerator.generate().then(() => {
        artifactGenerator.runPublish("remote");
      });
      // In the config file, the publication command has been replaced by a command creating a file in the artifact root folder

      expect(
        fs.existsSync(
          `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java/mvn-publishRemote`
        )
      ).toBe(true);
      expect(
        fs.existsSync(
          `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java/mvn-publishLocal`
        )
      ).toBe(false);
      expect(
        fs.existsSync(
          `${outputDirectory}/${ARTIFACT_DIRECTORY_SOURCE_CODE}/JavaScript/npm-publishLocal`
        )
      ).toBe(false);
      expect(
        fs.existsSync(
          `${outputDirectory}/${ARTIFACT_DIRECTORY_SOURCE_CODE}/JavaScript/npm-publishRemote`
        )
      ).toBe(true);
    });
  });

  describe("Backward compatibility features.", () => {
    it("should generate default packaging options if none are specified in the YAML file", async () => {
      const outputDirectory =
        "test/Generated/ArtifactGenerator/backwardCompatibility/";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile:
          "./test/resources/backwardCompatibility/vocab-list_no-packaging.yml",
        outputDirectory,
        noprompt: true
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);
      await artifactGenerator.generate().then(() => {
        artifactGenerator.runPublish(true);
      });
      // In the config file, the publication command has been replaced by a command creating a file in the artifact root folder
      expect(
        fs.existsSync(
          `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java/pom.xml`
        )
      ).toBe(true);
      expect(
        fs.existsSync(
          `${outputDirectory}/${ARTIFACT_DIRECTORY_SOURCE_CODE}/JavaScript/package.json`
        )
      ).toBe(true);
    });
  });

  describe("License file generation", () => {
    it("should generate a license file", async () => {
      const outputDirectory =
        "test/Generated/ArtifactGenerator/vocab-list-file";
      del.sync([`${outputDirectory}/*`]);

      const config = new GeneratorConfiguration({
        vocabListFile: "./test/resources/yamlConfig/vocab-license.yml",
        outputDirectory,
        noprompt: true
      });
      config.completeInitialConfiguration();
      const artifactGenerator = new ArtifactGenerator(config);

      await artifactGenerator.generate();
      expect(
        fs.existsSync(path.join(outputDirectory, "TypeScript", "LICENSE"))
      );
    });
  });
});
