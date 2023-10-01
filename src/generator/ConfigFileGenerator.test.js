const fs = require("fs");
const path = require("path");

const inquirer = require("inquirer");
const {
  LANGUAGE: JAVA,
} = require("../config/artifact/JavaArtifactConfigurator");

jest.mock("inquirer");

const packageDotJson = require("../../package.json");

require("mock-local-storage");
const {
  ConfigFileGenerator,
  validateLanguageCheckboxes,
  validateRepositoryCheckboxes,
} = require("./ConfigFileGenerator");

// This line will have to change if one day we decide to support Ook (spoiler alert:
// it is unlikely https://en.wikipedia.org/wiki/Brainfuck#Derivatives).
const UNSUPPORTED_LANGUAGE = "Ook";

const OUTPUT_DIR = "test/Generated/UNIT_TEST/ConfigFileGenerator/";
const REFERENCE_YAML_PROMPTED =
  "./test/resources/expectedOutput/sample-vocab.yml";
const REFERENCE_YAML_DEFAULT =
  "./test/resources/expectedOutput/default-sample-vocab.yml";
const REFERENCE_YAML_GIT =
  "./test/resources/expectedOutput/sample-vocab-git.yml";
const REFERENCE_YAML_SVN =
  "./test/resources/expectedOutput/sample-vocab-svn.yml";

// Config components
const ARTIFACT_NAME = "myNewArtifact";
const PROMPTED_JAVA_ARTIFACT = {
  artifactVersion: "0.1.0",
  artifactNamePrefix: "",
  artifactNameSuffix: "",
  solidCommonVocabVersion: "0.1.0-SNAPSHOT",
  javaPackageName: "com.example.java.packagename",
};

const COMPLETE_JAVA_ARTIFACT = {
  languageKeywordsToUnderscore: ["class", "abstract", "default", "this"],
  templateInternal: path.join(
    "solidCommonVocabDependent",
    "java",
    "rdf4j",
    "vocab.hbs",
  ),
  sourceFileExtension: "java",
  artifactDirectoryName: "Java",
  programmingLanguage: "Java",
  ...PROMPTED_JAVA_ARTIFACT,
};

const COMPLETE_VOCAB = {
  inputResources: ["./test/resources/vocab/schema-snippet.ttl"],
  nameAndPrefixOverride: "schema",
  descriptionFallback: "An example vocabulary",
  termSelectionFile: "",
};

const COMPLETE_CONFIG = {
  artifactName: ARTIFACT_NAME,
  generatorName: "@inrupt/artifact-generator",
  artifactGeneratorVersion: packageDotJson.version,
  artifactToGenerate: [COMPLETE_JAVA_ARTIFACT],
  vocabList: [COMPLETE_VOCAB],
};

const REPOSITORY_URL_GIT = "https://repository.git";
const REPOSITORY_URL_SVN = "https://repository.svn";
const GITIGNORE_TEMPLATE = ".gitignore.hbs";

const REPOSITORY_GIT = {
  type: "git",
  url: REPOSITORY_URL_GIT,
  versioningTemplates: [
    {
      templateInternal: GITIGNORE_TEMPLATE,
      fileName: ".gitignore",
      template: path.join("template", GITIGNORE_TEMPLATE),
    },
  ],
};

const REPOSITORY_SVN = {
  type: "svn",
  url: REPOSITORY_URL_SVN,
  // By default, no files are associated to the SVN configuration
};

const COMPLETE_CONFIG_GIT = {
  ...COMPLETE_CONFIG,
  versioning: REPOSITORY_GIT,
};

const COMPLETE_CONFIG_SVN = {
  ...COMPLETE_CONFIG,
  versioning: REPOSITORY_SVN,
};

const SAMPLE_CONFIG = {
  artifactName: ARTIFACT_NAME,
  artifactToGenerate: [],
  vocabList: [],
};

const INVALID_CONFIG = {};

const MOCK_CONFIG_PROMPT = jest
  .fn()
  // General prompt
  .mockReturnValueOnce(Promise.resolve({ artifactName: ARTIFACT_NAME }))
  .mockReturnValueOnce(Promise.resolve({ repositoryType: [] }))
  .mockReturnValueOnce(Promise.resolve({ languages: ["Java"] }))
  .mockReturnValueOnce(Promise.resolve(PROMPTED_JAVA_ARTIFACT))
  .mockReturnValueOnce(Promise.resolve({ addVocab: true }))
  .mockReturnValueOnce(Promise.resolve(COMPLETE_VOCAB))
  .mockReturnValue(Promise.resolve({ addVocab: false }));

const MOCK_VOCAB_PROMPT = jest
  .fn()
  // The user wants to add a new vocab
  .mockReturnValueOnce(Promise.resolve({ addVocab: true }))
  .mockReturnValueOnce(Promise.resolve(COMPLETE_VOCAB))
  // The user wants to add another vocab
  .mockReturnValueOnce(Promise.resolve({ addVocab: true }))
  .mockReturnValue(Promise.resolve(COMPLETE_VOCAB));

const MOCK_REPO_PROMPT_GIT = jest
  .fn()
  // General prompt
  .mockReturnValueOnce(Promise.resolve({ artifactName: ARTIFACT_NAME }))
  .mockReturnValueOnce(Promise.resolve({ repositoryType: ["git"] }))
  .mockReturnValueOnce(Promise.resolve({ repositoryUrl: REPOSITORY_URL_GIT }))
  .mockReturnValueOnce(
    Promise.resolve({ gitignoreTemplate: GITIGNORE_TEMPLATE }),
  )
  .mockReturnValueOnce(Promise.resolve({ languages: ["Java"] }))
  .mockReturnValueOnce(Promise.resolve(PROMPTED_JAVA_ARTIFACT))
  .mockReturnValueOnce(Promise.resolve({ addVocab: true }))
  .mockReturnValueOnce(Promise.resolve(COMPLETE_VOCAB))
  .mockReturnValue(Promise.resolve({ addVocab: false }));

const MOCK_REPO_PROMPT_SVN = jest
  .fn()
  // General prompt
  .mockReturnValueOnce(Promise.resolve({ artifactName: ARTIFACT_NAME }))
  .mockReturnValueOnce(Promise.resolve({ repositoryType: ["svn"] }))
  .mockReturnValueOnce(Promise.resolve({ repositoryUrl: REPOSITORY_URL_SVN }))
  .mockReturnValueOnce(Promise.resolve({ languages: ["Java"] }))
  .mockReturnValueOnce(Promise.resolve(PROMPTED_JAVA_ARTIFACT))
  .mockReturnValueOnce(Promise.resolve({ addVocab: true }))
  .mockReturnValueOnce(Promise.resolve(COMPLETE_VOCAB))
  .mockReturnValue(Promise.resolve({ addVocab: false }));

describe("ConfigFile Generator", () => {
  it("should not validate empty configs", () => {
    expect(() => {
      ConfigFileGenerator.validateConfig(INVALID_CONFIG);
    }).toThrow("Invalid configuration");
    expect(() => {
      ConfigFileGenerator.validateConfig(SAMPLE_CONFIG);
    }).not.toThrow();
  });

  it("should fail when asking for a config generator of an unsupported language", () => {
    expect(() => {
      ConfigFileGenerator.buildConfigGenerator(UNSUPPORTED_LANGUAGE);
    }).toThrow(UNSUPPORTED_LANGUAGE, "Unsported language");
  });

  it("should fail when less than one language is checked", () => {
    expect(validateLanguageCheckboxes([])).toEqual(
      "You must choose at least one target language.",
    );
    expect(validateLanguageCheckboxes(["Java"])).toEqual(true);
  });

  it("should fail when trying to set an invalid config", () => {
    const configGenerator = new ConfigFileGenerator();
    expect(() => {
      configGenerator.setConfig(INVALID_CONFIG);
    }).toThrow("Invalid configuration");
  });

  it("should fail when using an invalid config at generation time", () => {
    const targetPath = path.join(OUTPUT_DIR, "vocab-list.yml");
    const configGenerator = new ConfigFileGenerator();
    configGenerator.config = INVALID_CONFIG;
    expect(() => {
      configGenerator.generateConfigFile(targetPath);
    }).toThrow("Invalid configuration");
  });

  it("should use the provided config", () => {
    const configGenerator = new ConfigFileGenerator();
    configGenerator.setConfig(SAMPLE_CONFIG);
    expect(configGenerator.config).toEqual(SAMPLE_CONFIG);
  });

  it("should generate a valid artifact according to the checkbox selection", async () => {
    inquirer.prompt.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(COMPLETE_JAVA_ARTIFACT)),
    );

    const artifacts = await ConfigFileGenerator.promptArtifacts([JAVA]);
    expect(artifacts[0].artifactVersion).toEqual(
      COMPLETE_JAVA_ARTIFACT.artifactVersion,
    );
  });

  it("should return as many vocabularies as the user prompted", async () => {
    inquirer.prompt.mockImplementation(MOCK_VOCAB_PROMPT);
    expect(ConfigFileGenerator.promptVocabularies()).resolves.toEqual([
      COMPLETE_VOCAB,
      COMPLETE_VOCAB,
    ]);
  });

  it("should collect config info from the user prompt", async () => {
    inquirer.prompt.mockImplementation(MOCK_CONFIG_PROMPT);
    const configGenerator = new ConfigFileGenerator();
    await configGenerator.collectConfigInfo();

    // Due to the dynamic nature of timestamps, we just need to force this one.
    COMPLETE_CONFIG.generatedTimestamp =
      configGenerator.config.generatedTimestamp;

    expect(configGenerator.config).toEqual(COMPLETE_CONFIG);
  });

  it("should generate a complete file when directly setting the config", () => {
    const targetPath = path.join(OUTPUT_DIR, "vocab-list-set.yml");
    const configGenerator = new ConfigFileGenerator();
    configGenerator.setConfig(COMPLETE_CONFIG);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    configGenerator.generateConfigFile(targetPath);
    expect(fs.existsSync(targetPath)).toEqual(true);
    expect(fs.readFileSync(targetPath).toString()).toContain(
      fs.readFileSync(REFERENCE_YAML_PROMPTED).toString(),
    );
  });

  it("should generate a default file even with an empty config", () => {
    const targetPath = path.join(OUTPUT_DIR, "vocab-list-empty.yml");
    const configGenerator = new ConfigFileGenerator({});
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    configGenerator.generateDefaultConfigFile(targetPath);
    expect(fs.existsSync(targetPath)).toEqual(true);
    expect(fs.readFileSync(targetPath).toString()).toContain(
      fs.readFileSync(REFERENCE_YAML_DEFAULT).toString(),
    );
  });

  it("should collect information from the user prompt (including git repository)", async () => {
    // The repository config from this test includes an 'versioningTemplates' field
    const targetPath = path.join(OUTPUT_DIR, "vocab-list-git.yml");
    inquirer.prompt.mockImplementation(MOCK_REPO_PROMPT_GIT);
    const configGenerator = new ConfigFileGenerator();
    await configGenerator.collectConfigInfo();

    // Due to the dynamic nature of timestamps, we just need to force this one.
    COMPLETE_CONFIG_GIT.generatedTimestamp =
      configGenerator.config.generatedTimestamp;
    expect(configGenerator.config).toEqual(COMPLETE_CONFIG_GIT);

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    configGenerator.generateConfigFile(targetPath);
    expect(fs.existsSync(targetPath)).toEqual(true);
    expect(fs.readFileSync(targetPath).toString()).toContain(
      fs.readFileSync(REFERENCE_YAML_GIT).toString(),
    );
  });

  it("should collect information from the user prompt (including svn repository)", async () => {
    const targetPath = path.join(OUTPUT_DIR, "vocab-list-svn.yml");
    // The repository config from this test does not include an 'versioningTemplates' field
    inquirer.prompt.mockImplementation(MOCK_REPO_PROMPT_SVN);
    const configGenerator = new ConfigFileGenerator();
    await configGenerator.collectConfigInfo();

    // Due to the dynamic nature of timestamps, we just need to force this one.
    COMPLETE_CONFIG_SVN.generatedTimestamp =
      configGenerator.config.generatedTimestamp;
    expect(configGenerator.config).toEqual(COMPLETE_CONFIG_SVN);

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    configGenerator.generateConfigFile(targetPath);
    expect(fs.existsSync(targetPath)).toEqual(true);
    expect(fs.readFileSync(targetPath).toString()).toContain(
      fs.readFileSync(REFERENCE_YAML_SVN).toString(),
    );
  });

  it("should accept one repository type at most", async () => {
    expect(validateRepositoryCheckboxes([])).toBe(true);
    expect(validateRepositoryCheckboxes(["git"])).toBe(true);
    expect(validateRepositoryCheckboxes(["git", "svn"])).toBe(
      "You must choose at most one repository type.",
    );
  });
});
