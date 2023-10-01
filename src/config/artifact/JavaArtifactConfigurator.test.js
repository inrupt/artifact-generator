jest.mock("inquirer");
const inquirer = require("inquirer");

require("mock-local-storage");
const path = require("path");

const { JavaArtifactConfigurator } = require("./JavaArtifactConfigurator");
const { UNSUPPORTED_CONFIG_PROMPT } = require("../ArtifactConfigurator.test");

const DUMMY_JAVA_ARTIFACT = {
  artifactVersion: "0.0.1",
  solidCommonVocabVersion: "0.1.0-SNAPSHOT",
  javaPackageName: "com.example.dummy.packagename",
};

const DUMMY_MAVEN_ARTIFACT = {
  groupId: "org.some.groupId",
  publishLocal: "mvn install",
  publishRemote: "mvn deploy",
  template: path.join("solidCommonVocabDependent", "java", "rdf4j", "pom.hbs"),
};

const DUMMY_RELEASE_REPO = {
  id: "nexus-releases",
  type: "repository",
  url: "https://nexus.example.org/repository/maven-releases/",
};

const DUMMY_SNAPSHOT_REPO = {
  id: "nexus-snapshot",
  type: "snapshotRepository",
  url: "https://nexus.example.org/repository/maven-snapshot/",
};

const MAVEN_CONFIG_PROMPT_NO_REPO = jest
  .fn()
  // Answering the questions on the Java artifact
  .mockReturnValueOnce(
    Promise.resolve({ ...DUMMY_JAVA_ARTIFACT, packagingToInit: ["maven"] }),
  )
  // Answering the questions on the Maven packaging
  .mockReturnValueOnce(Promise.resolve({ ...DUMMY_MAVEN_ARTIFACT }))
  .mockReturnValueOnce(
    Promise.resolve({
      template: path.join(
        "solidCommonVocabDependent",
        "java",
        "rdf4j",
        "pom.hbs",
      ),
    }),
  )
  .mockReturnValueOnce(Promise.resolve({ addRepository: false }));

const MAVEN_CONFIG_PROMPT_WITH_REPO = jest
  .fn()
  // Answering the questions on the Java artifact
  .mockReturnValueOnce(
    Promise.resolve({ ...DUMMY_JAVA_ARTIFACT, packagingToInit: ["maven"] }),
  )
  // Answering the questions on the Maven packaging
  .mockReturnValueOnce(Promise.resolve({ ...DUMMY_MAVEN_ARTIFACT }))
  .mockReturnValueOnce(
    Promise.resolve({
      template: path.join(
        "solidCommonVocabDependent",
        "java",
        "rdf4j",
        "pom.hbs",
      ),
    }),
  )
  .mockReturnValueOnce(Promise.resolve({ addRepository: true }))
  .mockReturnValueOnce(Promise.resolve(DUMMY_RELEASE_REPO))
  // Adding two repositories enables testing both conditions in the prompt loop:
  // - When entering the first repository
  // - When entering a repository in an already existing list
  .mockReturnValueOnce(Promise.resolve({ addRepository: true }))
  .mockReturnValueOnce(Promise.resolve(DUMMY_SNAPSHOT_REPO))
  .mockReturnValue(Promise.resolve({ addRepository: false }));

describe("Java ArtifactConfig Generator", () => {
  it("should use the values provided by the user", async () => {
    inquirer.prompt.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(DUMMY_JAVA_ARTIFACT)),
    );
    const artifact = await new JavaArtifactConfigurator().prompt();
    expect(artifact.javaPackageName).toEqual(
      DUMMY_JAVA_ARTIFACT.javaPackageName,
    );
  });

  it("should use the values provided by the user for maven artifacts", async () => {
    inquirer.prompt.mockImplementation(MAVEN_CONFIG_PROMPT_NO_REPO);
    const artifact = await new JavaArtifactConfigurator().prompt();
    expect(artifact.packaging[0].packagingTool).toEqual("maven");
    expect(artifact.packaging[0].groupId).toEqual(DUMMY_MAVEN_ARTIFACT.groupId);
    expect(artifact.packaging[0].publishCommand).toEqual(
      DUMMY_MAVEN_ARTIFACT.publishCommand,
    );
    expect(artifact.packaging[0].packagingTemplates[0].template).toEqual(
      DUMMY_MAVEN_ARTIFACT.template,
    );
    expect(artifact.packaging[0].packagingTemplates[0].fileName).toEqual(
      "pom.xml",
    );
  });

  it("should use the values provided by the user for maven repositories", async () => {
    inquirer.prompt.mockImplementation(MAVEN_CONFIG_PROMPT_WITH_REPO);
    const artifact = await new JavaArtifactConfigurator().prompt();
    expect(artifact.packaging[0].repository.length).toEqual(2);
    expect(artifact.packaging[0].repository[0]).toEqual({
      ...DUMMY_RELEASE_REPO,
    });
    expect(artifact.packaging[0].repository[1]).toEqual({
      ...DUMMY_SNAPSHOT_REPO,
    });
  });

  it("should throw when an unsupported packaging system is prompted", async () => {
    inquirer.prompt.mockImplementation(UNSUPPORTED_CONFIG_PROMPT);
    expect(new JavaArtifactConfigurator().prompt()).rejects.toThrow(
      "Unsupported packaging system",
      "someSystem",
    );
  });
});
