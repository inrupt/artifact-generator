jest.mock("inquirer");
const inquirer = require("inquirer");
const path = require("path");

require("mock-local-storage");

const { NodeArtifactConfigurator } = require("./NodeArtifactConfigurator");
const { UNSUPPORTED_CONFIG_PROMPT } = require("../ArtifactConfigurator.test");

const DUMMY_JS_ARTIFACT = {
  artifactVersion: "0.0.1",
  solidCommonVocabVersion: "^1.4.0",
};

const DUMMY_NPM_MODULE = {
  npmModuleScope: "@test/scope",
  publishLocal: "npm install",
  publishRemote: "npm install",
  packageTemplate: path.join(
    "solidCommonVocabDependent",
    "javascript",
    "package.hbs",
  ),
  indexTemplate: path.join(
    "solidCommonVocabDependent",
    "javascript",
    "index.hbs",
  ),
};

const NPM_MODULE_CONFIG = jest
  .fn()
  // Answering the questions on the Java artifact
  .mockReturnValueOnce(
    Promise.resolve({ ...DUMMY_JS_ARTIFACT, packagingToInit: ["NPM"] }),
  )
  // Answering the questions on the Maven packaging
  .mockReturnValueOnce(Promise.resolve({ ...DUMMY_NPM_MODULE }))
  .mockReturnValueOnce(Promise.resolve({ ...DUMMY_NPM_MODULE }));

describe("JS ArtifactConfig Generator", () => {
  it("should use the values provided by the user", async () => {
    inquirer.prompt.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(DUMMY_JS_ARTIFACT)),
    );
    const artifact = await new NodeArtifactConfigurator().prompt();
    expect(artifact.artifactVersion).toEqual(DUMMY_JS_ARTIFACT.artifactVersion);
  });

  it("should use the values provided by the user for npm module", async () => {
    inquirer.prompt.mockImplementation(NPM_MODULE_CONFIG);
    const artifact = await new NodeArtifactConfigurator().prompt();
    expect(artifact.packaging[0].packagingTool).toEqual("NPM");
    expect(artifact.packaging[0].solidCommonVocabVersion).toEqual(
      DUMMY_NPM_MODULE.solidCommonVocabVersion,
    );
    expect(artifact.packaging[0].publishCommand).toEqual(
      DUMMY_NPM_MODULE.publishCommand,
    );
    expect(artifact.packaging[0].packagingTemplates[0].template).toEqual(
      DUMMY_NPM_MODULE.indexTemplate,
    );
    expect(artifact.packaging[0].packagingTemplates[0].fileName).toEqual(
      "index.js",
    );
  });

  it("should throw when an unsupported packaging system is prompted", async () => {
    inquirer.prompt.mockImplementation(UNSUPPORTED_CONFIG_PROMPT);
    expect(new NodeArtifactConfigurator().prompt()).rejects.toThrow(
      "Unsupported packaging system",
      "someSystem",
    );
  });
});
