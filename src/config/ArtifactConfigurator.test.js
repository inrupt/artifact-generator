jest.mock("inquirer");
const inquirer = require("inquirer");

const path = require("path");

require("mock-local-storage");
const ArtifactConfigurator = require("./ArtifactConfigurator");
const {
  JavaArtifactConfigurator,
  LANGUAGE: JAVA,
} = require("./artifact/JavaArtifactConfigurator");
const {
  NodeArtifactConfigurator,
  LANGUAGE: JAVASCRIPT,
} = require("./artifact/NodeArtifactConfigurator");

const DUMMY_JAVA_ARTIFACT = {
  artifactVersion: "0.0.1",
  solidCommonVocabVersion: "0.1.0-SNAPSHOT",
  javaPackageName: "com.example.dummy.packagename",
};

const DUMMY_JS_ARTIFACT = {
  artifactVersion: "1.0.1",
  npmModuleScope: "@example",
};

const DUMMY_MAVEN_ARTIFACT = {
  ...DUMMY_JAVA_ARTIFACT,
  groupId: "org.some.groupId",
  publishCommand: "mvn install",
  template: path.join(
    __dirname,
    "..",
    "template",
    "solidCommonVocabDependent",
    "java",
    "rdf4j",
    "pom.hbs",
  ),
};

const UNSUPPORTED_CONFIG_PROMPT = jest.fn().mockReturnValue(
  Promise.resolve({
    ...DUMMY_MAVEN_ARTIFACT,
    packagingToInit: ["someSystem"],
  }),
);

describe("ArtifactConfig Generator", () => {
  it("should throw when calling prompt from base class", () => {
    expect(new ArtifactConfigurator().prompt()).rejects.toThrow(
      "Unspecified artifact generator",
    );
  });

  it("should use the values provided by the user", async () => {
    inquirer.prompt.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(DUMMY_JAVA_ARTIFACT)),
    );
    const artifact = await new JavaArtifactConfigurator().prompt();
    expect(artifact.javaPackageName).toEqual(
      DUMMY_JAVA_ARTIFACT.javaPackageName,
    );
  });

  it("should use default values provided by the implementations", async () => {
    inquirer.prompt.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(DUMMY_JAVA_ARTIFACT)),
    );
    const javaArtifact = new JavaArtifactConfigurator();
    await javaArtifact.prompt();
    expect(javaArtifact.language).toEqual(JAVA);
    expect(javaArtifact.config.artifactVersion).toEqual(
      DUMMY_JAVA_ARTIFACT.artifactVersion,
    );
    inquirer.prompt.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(DUMMY_JS_ARTIFACT)),
    );

    const jsArtifact = new NodeArtifactConfigurator();
    await jsArtifact.prompt();
    expect(jsArtifact.language).toEqual(JAVASCRIPT);
    expect(jsArtifact.config.artifactVersion).toEqual(
      DUMMY_JS_ARTIFACT.artifactVersion,
    );
  });
});

module.exports.UNSUPPORTED_CONFIG_PROMPT = UNSUPPORTED_CONFIG_PROMPT;
