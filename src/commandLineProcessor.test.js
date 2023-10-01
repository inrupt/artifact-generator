const fs = require("fs");

const debugModule = require("debug");
const { processCommandLine, configureLog } = require("./commandLineProcessor");

describe("Command line argument handling", () => {
  it("should default to logging all", () => {
    debugModule.enable("artifact-generator:*");
    configureLog({});
    const previouslyEnabled = debugModule.disable();
    configureLog({});
    expect(previouslyEnabled).toContain("artifact-generator:*");
  });

  it("should succeed validation", async () => {
    const filename = "test/resources/yamlConfig/namespace-override.yml";
    const validArguments = ["validate", "--vocabListFile", filename];

    const response = await processCommandLine(false, validArguments);
    expect(response._).toHaveLength(1);
    expect(response.vocabListFile).toEqual(filename);

    // Call again to exercise our debug namespace being picked up this 2nd
    // time around (first call should have enabled it).
    processCommandLine(false, validArguments);
  });

  it("should fail validation", async () => {
    const nonExistFile = "should-not-exist.yml";
    const invalidArguments = ["validate", "--vocabListFile", nonExistFile];
    await expect(processCommandLine(false, invalidArguments)).rejects.toThrow(
      nonExistFile,
    );
  });

  it("should succeed initialization", () => {
    const outputDirectory =
      "test/Generated/UNIT_TEST/commandLineProcessor/init";
    const validArguments = [
      "init",
      "--outputDirectory",
      outputDirectory,
      "--noPrompt",
    ];

    const filename = `${outputDirectory}/sample-vocab.yml`;
    try {
      fs.unlinkSync(filename);
    } catch (error) {
      // Ignore file-not-found errors!
    }
    const response = processCommandLine(false, validArguments);
    expect(response._).toHaveLength(1);
    expect(fs.existsSync(filename)).toBe(true);
  });

  it("should succeed watching one resource", async () => {
    const filename = "test/resources/yamlConfig/vocab-valid.yml";
    const validArguments = ["watch", "--vocabListFile", filename, "--force"];

    const result = await processCommandLine(false, validArguments);
    expect(result.unwatchFunction).toBeDefined();
    result.unwatchFunction();
  });

  it("should succeed watching multiple resource configuration files", async () => {
    const filename = "test/resources/watcher/vocab-list-watch*.yml";
    const validArguments = ["watch", "--vocabListFile", filename, "--force"];

    const result = await processCommandLine(false, validArguments);
    expect(result.globMatchTotal).toBe(2);
    expect(result.unwatchFunction).toBeDefined();
    result.unwatchFunction();
  });

  it("should fail watch", async () => {
    const nonExistFile = "should-not-exist.yml";
    const invalidArguments = [
      "watch",
      "--vocabListFile",
      nonExistFile,
      "--noPrompt",
    ];

    // Deliberately provide non-existent file...
    await expect(processCommandLine(false, invalidArguments)).rejects.toThrow(
      nonExistFile,
    );
  });

  it("should succeed generation", async () => {
    const filename = "test/resources/yamlConfig/vocab-valid.yml";
    const validArguments = [
      "generate",
      "--vocabListFile",
      filename,
      "--noPrompt",
      "--force",
    ];

    const response = await processCommandLine(false, validArguments);
    expect(response._).toHaveLength(1);
    expect(response.vocabListFile).toEqual(filename);
  });

  it("should fail generation if no input files", () => {
    const invalidArguments = ["generate", "--noPrompt"];
    expect(() => processCommandLine(false, invalidArguments)).toThrow(
      "You must provide input",
    );
  });

  it("should fail generation if input not found", async () => {
    const nonExistFile = "should-not-exist.yml";
    const invalidArguments = [
      "generate",
      "--vocabListFile",
      nonExistFile,
      "--noPrompt",
    ];
    await expect(processCommandLine(false, invalidArguments)).rejects.toThrow(
      "Generation process failed",
    );
  });

  it("should run in quiet mode", async () => {
    const filename = "test/resources/yamlConfig/namespace-override.yml";
    const response = await processCommandLine(false, [
      "validate",
      "--vocabListFile",
      filename,
      "--quiet",
      "--noPrompt",
    ]);
    expect(response._).toHaveLength(1);
    expect(response.vocabListFile).toEqual(filename);
  });

  it("should throw if no command", () => {
    expect(() =>
      processCommandLine(false, ["--vocabListFile", "some-dummy-file.yml"]),
    ).toThrow("one command is expected");
  });

  it("should throw if command is a number", () => {
    expect(() =>
      processCommandLine(false, [
        "666",
        "--vocabListFile",
        "some-dummy-file.yml",
      ]),
    ).toThrow("but we got the number [666]");
  });

  it("should throw if invalid command", () => {
    expect(() =>
      processCommandLine(false, [
        "Unknown-command",
        "--vocabListFile",
        "some-dummy-file.yml",
      ]),
    ).toThrow("Unknown command");
  });
});
