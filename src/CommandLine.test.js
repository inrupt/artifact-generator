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
    it("Should find the latest published artifact from registry", () => {
      childProcess.execSync.mockImplementation(
        jest.fn().mockReturnValue("1.1.10")
      );

      const result = CommandLine.findPublishedVersionOfModule({
        ...defaultInputs,
        runNpmPublish: true,
      });

      expect(result.publishedVersion).toBe("1.1.10");
      expect(result.version).toBe("1.1.10");
    });

    it("Should not add to the result if artifact has not been published to the registry", () => {
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

    it("Should publish artifact to the registry if user confirms yes", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runNpmPublish: true })
      );

      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = await CommandLine.askForArtifactToBeNpmPublished(
        defaultInputs
      );

      expect(result.runNpmPublish).toBe(true);
      expect(result.ranNpmPublish).toBe(true);
    });

    it("Should publish artifact to the registry if given explicit inputs", async () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = await CommandLine.askForArtifactToBeNpmPublished({
        ...defaultInputs,
        runNpmPublish: true,
      });

      expect(result.runNpmPublish).toBe(true);
      expect(result.ranNpmPublish).toBe(true);
    });

    it("Should not publish artifact to the registry if user confirms no", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runNpmPublish: false })
      );

      const result = await CommandLine.askForArtifactToBeNpmPublished(
        defaultInputs
      );

      expect(result.runNpmPublish).toBe(false);
      expect(result.ranNpmPublish).toBeUndefined();
    });

    it("Should not publish artifact if user did not specify publish, and also set no prompting", async () => {
      const result = await CommandLine.askForArtifactToBeNpmPublished({
        ...defaultInputs,
        noprompt: true,
      });

      expect(result.ranNpmPublish).toBeUndefined();
    });
  });

  describe("NPM version bumping...", () => {
    it("Should run npm version", () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = CommandLine.runNpmVersion(defaultInputs);

      expect(result.ranNpmVersion).toBe(true);
    });

    it("Should bump artifact version if explicitly told to", async () => {
      childProcess.execSync.mockImplementation(
        jest.fn().mockReturnValue("1.2.10")
      );

      const result = await CommandLine.askForArtifactToBeNpmVersionBumped({
        ...defaultInputs,
        publishedVersion: "1.1.10",
        bumpVersion: "minor",
      });

      expect(result.publishedVersion).toBe("1.1.10");
      expect(result.bumpVersion).toBe("minor");
      expect(result.bumpedVersion).toBe("1.2.10");
      expect(result.ranNpmVersion).toBe(true);
    });

    it("Should ask for the artifact version bump type (major, minor, patch)", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ bumpVersion: "patch" })
      );

      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = await CommandLine.askForArtifactToBeNpmVersionBumped({
        ...defaultInputs,
        publishedVersion: "1.1.10",
      });

      expect(result.bumpVersion).toBe("patch");
      expect(result.ranNpmVersion).toBe(true);
    });

    it('Should not run update version command if the user answers "no" when ask for the artifact version bump type', async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ bumpVersion: "no" })
      );

      const result = await CommandLine.askForArtifactToBeNpmVersionBumped({
        ...defaultInputs,
        publishedVersion: "1.1.10",
      });

      expect(result.bumpVersion).toBe("no");
    });

    it("Should not prompt for artifact version bump type if the module has not been published", async () => {
      defaultInputs.publishedVersion = undefined;

      const result = await CommandLine.askForArtifactToBeNpmVersionBumped(
        defaultInputs
      );

      expect(result.publishedVersion).toBeUndefined();
    });
  });

  describe("NPM installing...", () => {
    it("Should run npm install", () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = CommandLine.runNpmInstall(defaultInputs);

      expect(result.ranNpmInstall).toBe(true);
    });

    it("Should run npm install with bundling", () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = CommandLine.runNpmInstall({
        ...defaultInputs,
        supportBundling: true,
      });

      expect(result.ranNpmInstall).toBe(true);
    });

    it("Should install artifact if user explicitly told to", async () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = await CommandLine.askForArtifactToBeNpmInstalled({
        ...defaultInputs,
        runNpmInstall: true,
      });

      expect(result.ranNpmInstall).toBe(true);
    });

    it("Should install artifact if user confirms yes", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runNpmInstall: true })
      );

      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = await CommandLine.askForArtifactToBeNpmInstalled(
        defaultInputs
      );

      expect(result.ranNpmInstall).toBe(true);
    });

    it("Should not install artifact if user confirms no", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runNpmInstall: false })
      );

      const result = await CommandLine.askForArtifactToBeNpmInstalled(
        defaultInputs
      );

      expect(result.ranNpmInstall).toBeUndefined();
    });

    it("Should not install artifact if user did not specify install, and also set no prompting", async () => {
      const result = await CommandLine.askForArtifactToBeNpmInstalled({
        ...defaultInputs,
        noprompt: true,
      });

      expect(result.ranNpmInstall).toBeUndefined();
    });
  });

  describe("Maven installing...", () => {
    it("Should install artifact with Maven if Java, but ignore non-Java artifacts", async () => {
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

    it("Should ignore Maven install if no explicit flag set", async () => {
      const result = await CommandLine.runMavenInstall({
        ...defaultInputs,
        runMavenInstall: false,
      });

      expect(result.ranMavenInstall).toBe(undefined);
    });

    it("Should ignore Maven install if no generation details", async () => {
      const result = await CommandLine.runMavenInstall({
        ...defaultInputs,
        runMavenInstall: true,
      });

      expect(result.ranMavenInstall).toBe(true);
    });
  });

  describe("Running Widoco...", () => {
    it("Should run Widoco", () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = CommandLine.runWidoco({
        ...defaultInputs,
        inputResources: ["Dummy_vocab_file"],
        outputDirectory: "needs/a/parent/directory",
      });

      expect(result.ranWidoco).toBe(true);
    });

    it("Should generate documentation if user explicitly told to", async () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        inputResources: ["Dummy_vocab_file"],
        outputDirectory: "needs/a/parent/directory",
        runWidoco: true,
      });

      expect(result.ranWidoco).toBe(true);
    });

    it("Should generate documentation (from HTTP vocab) if user explicitly told to", async () => {
      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        inputResources: ["http://Dummy_vocab_file"],
        outputDirectory: "needs/a/parent/directory",
        runWidoco: true,
      });

      expect(result.ranWidoco).toBe(true);
    });

    it("Should generate documentation if user confirms yes", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runWidoco: true })
      );

      childProcess.execSync.mockImplementation(jest.fn().mockReturnValue(""));

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        inputResources: ["Dummy_vocab_file"],
        outputDirectory: "needs/a/parent/directory",
      });

      expect(result.ranWidoco).toBe(true);
    });

    it("Should not generate documentation if user confirms no", async () => {
      inquirer.prompt.mockImplementation(
        jest.fn().mockReturnValue({ runWidoco: false })
      );

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        inputResources: ["Dummy_vocab_file"],
        outputDirectory: "needs/a/parent/directory",
      });

      expect(result.ranWidoco).toBeUndefined();
    });

    it("Should not generate documentation if user did not specify, and also set no prompting", async () => {
      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        noprompt: true,
      });

      expect(result.ranWidoco).toBeUndefined();
    });
  });
});
