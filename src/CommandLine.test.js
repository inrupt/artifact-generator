jest.mock("inquirer");
jest.mock("child_process");

const inquirer = require("inquirer");
const childProcess = require("child_process");

const CommandLine = require("./CommandLine");

const defaultInputs = {
  artifactName: "@inrupt/generator-vocab-schema-ext",
  authorSet: new Set(["lit@inrupt.com"]),
  npmRegistry: "http://localhost:4873/",
};

describe("Command Line unit tests", () => {
  describe("WATCH command...", () => {
    expect(CommandLine.COMMAND_WATCH()).toBe("watch");
  });

  describe("VALIDATE command...", () => {
    expect(CommandLine.COMMAND_VALIDATE()).toBe("validate");
  });

  describe("NPM publishing...", () => {
    it("should find the latest published artifact from registry", () => {
      childProcess.execSync.mockImplementation(
        jest.fn().mockReturnValue("1.1.10"),
      );

      const result = CommandLine.findPublishedVersionOfModule({
        ...defaultInputs,
        runNpmPublish: true,
      });

      expect(result.publishedVersion).toBe("1.1.10");
      expect(result.version).toBe("1.1.10");
    });

    it("should not add to the result if artifact has not been published to the registry", () => {
      childProcess.execSync.mockImplementation(() => {
        throw new Error("Mocked test error");
      });

      const result = CommandLine.findPublishedVersionOfModule({
        ...defaultInputs,
        runNpmPublish: true,
      });

      expect(result.publishedVersion).toBeUndefined();
      expect(result.version).toBeUndefined();
    });

    it("should publish artifact to the registry if user confirms yes", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runNpmPublish: true }),
      );

      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result =
        await CommandLine.askForArtifactToBeNpmPublished(defaultInputs);

      expect(result.runNpmPublish).toBe(true);
      expect(result.ranNpmPublish).toBe(true);
    });

    it("should publish artifact to the registry if given explicit inputs", async () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = await CommandLine.askForArtifactToBeNpmPublished({
        ...defaultInputs,
        runNpmPublish: true,
      });

      expect(result.runNpmPublish).toBe(true);
      expect(result.ranNpmPublish).toBe(true);
    });

    it("should not publish artifact to the registry if user confirms no", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runNpmPublish: false }),
      );

      const result =
        await CommandLine.askForArtifactToBeNpmPublished(defaultInputs);

      expect(result.runNpmPublish).toBe(false);
      expect(result.ranNpmPublish).toBeUndefined();
    });

    it("should not publish artifact if user did not specify publish, and also set no prompting", async () => {
      const result = await CommandLine.askForArtifactToBeNpmPublished({
        ...defaultInputs,
        noPrompt: true,
      });

      expect(result.ranNpmPublish).toBeUndefined();
    });
  });

  describe("NPM installing...", () => {
    it("should run npm install", () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = CommandLine.runNpmInstall(defaultInputs);

      expect(result.ranNpmInstall).toBe(true);
    });

    it("should run npm install with bundling", () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = CommandLine.runNpmInstall({
        ...defaultInputs,
        supportBundling: true,
      });

      expect(result.ranNpmInstall).toBe(true);
    });

    it("should install artifact if user explicitly told to", async () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = await CommandLine.askForArtifactToBeNpmInstalled({
        ...defaultInputs,
        runNpmInstall: true,
      });

      expect(result.ranNpmInstall).toBe(true);
    });

    it("should install artifact if user confirms yes", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runNpmInstall: true }),
      );

      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result =
        await CommandLine.askForArtifactToBeNpmInstalled(defaultInputs);

      expect(result.ranNpmInstall).toBe(true);
    });

    it("should not install artifact if user confirms no", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runNpmInstall: false }),
      );

      const result =
        await CommandLine.askForArtifactToBeNpmInstalled(defaultInputs);

      expect(result.ranNpmInstall).toBeUndefined();
    });

    it("should not install artifact if user did not specify install, and also set no prompting", async () => {
      const result = await CommandLine.askForArtifactToBeNpmInstalled({
        ...defaultInputs,
        noPrompt: true,
      });

      expect(result.ranNpmInstall).toBeUndefined();
    });
  });

  describe("Maven installing...", () => {
    it("should install artifact with Maven if Java, but ignore non-Java artifacts", async () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = await CommandLine.runMavenInstall({
        ...defaultInputs,
        runMavenInstall: true,
        artifactToGenerate: [
          {
            programmingLanguage: "Java",
          },
          {
            programmingLanguage: "C#",
          },
        ],
      });

      expect(result.ranMavenInstall).toBe(true);
    });

    it("should ignore Maven install if no explicit flag set", async () => {
      const result = await CommandLine.runMavenInstall({
        ...defaultInputs,
        runMavenInstall: false,
      });

      expect(result.ranMavenInstall).toBe(undefined);
    });

    it("should ignore Maven install if no generation details", async () => {
      const result = await CommandLine.runMavenInstall({
        ...defaultInputs,
        runMavenInstall: true,
      });

      expect(result.ranMavenInstall).toBe(true);
    });
  });

  describe("Running Widoco...", () => {
    it("should produce empty documentation directory list if not running Widoco", () => {
      const config = CommandLine.runWidocoForAllVocabs({
        runWidoco: false,
      });

      expect(config.ranWidoco).toBe(false);
      expect(config.documentationDirectories).toHaveLength(0);
    });

    it("should ignore documentation if multiple input resources (not supported yet)", async () => {
      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        vocabList: [
          {
            inputResources: [
              "https://example.com/Dummy_http_vocab_1",
              "https://example.com/Dummy_http_vocab_2",
            ],
          },
        ],
        outputDirectory: "needs/a/parent/directory",
        runWidoco: true,
      });

      expect(result.ranWidoco).toBe(true);
      expect(result.documentationDirectories).toHaveLength(0);
    });

    it("should ignore documentation if term selection resource provided (not supported yet)", async () => {
      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        vocabList: [
          {
            inputResources: ["https://example.com/Dummy_http_vocab"],
            termSelectionResource:
              "https://example.com/Dummy_term_selection_resource",
          },
        ],
        outputDirectory: "needs/a/parent/directory",
        runWidoco: true,
      });

      expect(result.ranWidoco).toBe(true);
      expect(result.documentationDirectories).toHaveLength(0);
    });

    it("should produce documentation directory list", async () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const firstVocab = "dummy-vocab-first.ttl";
      const secondVocab = "dummy-vocab-second.ttl";
      const dummyDir = "/dummy-output-dir";

      const config = CommandLine.runWidocoForAllVocabs({
        outputDirectory: dummyDir,
        runWidoco: true,
        vocabList: [
          { inputResources: [firstVocab] },
          { inputResources: [secondVocab], widocoLanguages: "en-ga" },
        ],
      });

      expect(config.outputDirectory).toEqual(dummyDir);
      expect(config.documentationDirectories).toHaveLength(2);
      expect(config.documentationDirectories[0]).toContain(
        firstVocab.substring(0, firstVocab.lastIndexOf(".")),
      );
      expect(config.documentationDirectories[0]).not.toContain(".ttl");
      expect(config.documentationDirectories[1]).toContain(
        secondVocab.substring(0, secondVocab.lastIndexOf(".")),
      );
      expect(config.documentationDirectories[1]).not.toContain(".ttl");
    });

    it("should generate documentation if config says to", async () => {
      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        vocabList: [
          { inputResources: ["https://example.com/Dummy_http_vocab"] },
        ],
        outputDirectory: "needs/a/parent/directory",
        runWidoco: true,
      });

      expect(result.ranWidoco).toBe(true);
    });

    it("should generate documentation if user explicitly anwsers yes", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runWidoco: true }),
      );

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        vocabList: [
          { inputResources: ["https://example.com/Dummy_http_vocab"] },
        ],
        outputDirectory: "needs/a/parent/directory",
      });

      expect(result.ranWidoco).toBe(true);
    });

    it("should not generate documentation if user says not to", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runWidoco: false }),
      );

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        vocabList: [{ inputResources: ["Dummy_vocab_file"] }],
        outputDirectory: "needs/a/parent/directory",
        runWidoco: false,
      });

      expect(result.ranWidoco).toBe(false);
    });

    it("should generate documentation (from HTTP vocab) if user explicitly told to", async () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        vocabList: [{ inputResources: ["Dummy_vocab_file"] }],
        outputDirectory: "needs/a/parent/directory",
        runWidoco: true,
      });

      expect(result.ranWidoco).toBe(true);
    });

    it("should generate documentation if user confirms yes", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runWidoco: true }),
      );

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        vocabList: [{ inputResources: ["Dummy_vocab_file"] }],
        outputDirectory: "needs/a/parent/directory",
        runWidoco: true,
      });

      expect(result.ranWidoco).toBe(true);
    });

    it("should not generate documentation if user confirms no", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runWidoco: false }),
      );

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        vocabList: [{ inputResources: ["Dummy_vocab_file"] }],
        outputDirectory: "needs/a/parent/directory",
      });

      expect(result.ranWidoco).toBe(false);
    });

    it("should not generate documentation if user did not specify, and also set no prompting", async () => {
      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        noPrompt: true,
      });

      expect(result.ranWidoco).toBe(false);
    });
  });
});
