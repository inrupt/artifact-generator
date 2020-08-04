require("mock-local-storage");

const fs = require("fs");
const debug = require("debug")("lit-artifact-generator:VocabGenerator");

const App = require("./App");

// These values are not expected to be specified in vocab list files - they
// are expected to be provided as runtime arguments.
const VERSION_SOLID_COMMON_VOCAB = "^0.0.1";
const NPM_REGISTRY = "http://localhost:4873";
const RUN_NPM_INSTALL = false;
const SUPPORT_BUNDLING = true;
const RUN_PACKAGING = ["mavenLocal", "npmLocal"];

const ConfigAll = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated",
  vocabListFile: "../solid-common-vocab-rdf/**/*.yml",
  vocabListFileIgnore: "../solid-common-vocab-rdf/bin/**",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: RUN_PACKAGING,
};

const ConfigRdfCommon = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated",
  vocabListFile:
    "../solid-common-vocab-rdf/common-rdf/Common/Vocab-List-Common-Rdf.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: RUN_PACKAGING,
};

const ConfigLitCommon = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated",
  vocabListFile:
    "../solid-common-vocab-rdf/lit-rdf/Common/Vocab-List-Lit-Common.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: RUN_PACKAGING,
};

const ConfigInruptCommon = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated",
  vocabListFile:
    "../solid-common-vocab-rdf/inrupt-rdf/Common/Vocab-List-Inrupt-Common.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: RUN_PACKAGING,
};

const ConfigInruptUiCommon = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated",
  vocabListFile:
    "../solid-common-vocab-rdf/inrupt-rdf/UiComponent/Vocab-List-Inrupt-UiComponent.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: RUN_PACKAGING,
};

const ConfigInruptService = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated",
  vocabListFile:
    "../solid-common-vocab-rdf/inrupt-rdf/Service/Vocab-List-Inrupt-Service.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: RUN_PACKAGING,
};

const ConfigSolidCommon = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated",
  vocabListFile:
    "../solid-common-vocab-rdf/solid-rdf/Common/Vocab-List-Solid-Common.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: RUN_PACKAGING,
};

const ConfigSolidComponent = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated",
  inputResources: [
    "../solid-common-vocab-rdf/solid-rdf/Component/SolidComponent.ttl",
  ],
  solidCommonVocabVersion: VERSION_SOLID_COMMON_VOCAB,
  artifactVersion: "0.1.0",
  moduleNamePrefix: "@inrupt/",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  runWidoco: true,
  publish: RUN_PACKAGING,
};

const ConfigSolidGeneratorUi = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated",
  inputResources: [
    "../solid-common-vocab-rdf/solid-rdf/GeneratorUi/SolidGeneratorUi.ttl",
  ],
  solidCommonVocabVersion: VERSION_SOLID_COMMON_VOCAB,
  artifactVersion: "0.1.0",
  moduleNamePrefix: "@inrupt/",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  runWidoco: true,
  publish: RUN_PACKAGING,
};

describe("Suite for generating common vocabularies (marked as [skip] to prevent non-manual execution", () => {
  // it("Generate ALL vocabs recursively", async () => {
  it.skip("Generate ALL vocabs recursively", async () => {
    jest.setTimeout(240000);
    await generateVocabArtifact(ConfigAll);
  });

  // it("Generate ALL vocabs", async () => {
  it.skip("Generate ALL vocabs", async () => {
    jest.setTimeout(120000);
    await generateVocabArtifact(ConfigRdfCommon);
    await generateVocabArtifact(ConfigLitCommon);

    await generateVocabArtifact(ConfigSolidCommon);

    // Just note - these configurations generate from single RDF vocab files
    // (i.e. not via YAML config files), so they'll only generate JavaScript
    // (i.e. the command-line default).
    await generateVocabArtifact(ConfigSolidComponent);
    await generateVocabArtifact(ConfigSolidGeneratorUi);

    await generateVocabArtifact(ConfigInruptCommon);
    await generateVocabArtifact(ConfigInruptUiCommon);
    await generateVocabArtifact(ConfigInruptService);
  });

  // it("Common vocabs", async () => {
  it.skip("Common vocabs", async () => {
    jest.setTimeout(30000);
    await generateVocabArtifact(ConfigLitCommon);
  });

  // it('Solid vocabs', async () => {
  it.skip("Solid vocabs", async () => {
    jest.setTimeout(30000);
    await generateVocabArtifact(ConfigSolidCommon);
    await generateVocabArtifact(ConfigSolidGeneratorUi);
    await generateVocabArtifact(ConfigSolidComponent);
  });

  // it("Inrupt vocab", async () => {
  it.skip("Inrupt vocabs", async () => {
    jest.setTimeout(30000);
    await generateVocabArtifact(ConfigInruptCommon);
    await generateVocabArtifact(ConfigInruptUiCommon);
    await generateVocabArtifact(ConfigInruptService);
  });

  // it("Common RDF vocabs", async () => {
  it.skip("Common RDF vocabs", async () => {
    jest.setTimeout(60000);
    await generateVocabArtifact(ConfigRdfCommon);
  });

  it.skip("Test Demo App", async () => {
    // it('Test Demo App', async () => {
    await generateVocabArtifact({
      inputResources: ["./test/resources/vocabs/schema-inrupt-ext.ttl"],
      nameAndPrefixOverride: "test",
      // inputResources: [
      //   "https://raw.githubusercontent.com/UKGovLD/publishing-statistical-data/master/specs/src/main/vocab/cube.ttl"
      // ],
      // nameAndPrefixOverride: "cube",

      // inputResources: ['http://www.w3.org/2006/vcard/ns#'],
      // nameAndPrefixOverride: 'vcard',

      // inputResources: ['http://www.w3.org/2002/07/owl#'],
      // nameAndPrefixOverride: 'owl',

      // inputResources: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
      // nameAndPrefixOverride: 'RDF',

      // inputResources: ['http://dublincore.org/2012/06/14/dcterms.ttl'],
      // nameAndPrefixOverride: 'DCTERMS',

      // inputResources: ['https://www.w3.org/ns/activitystreams-owl'],
      // nameAndPrefixOverride: 'as',

      // inputResources: ['http://www.w3.org/2007/ont/httph#'],
      // nameAndPrefixOverride: 'httph',

      // inputResources: ['http://www.w3.org/2011/http-headers#'],
      // nameAndPrefixOverride: 'http-headers',

      outputDirectory: "./test/Generated",
      artifactVersion: "1.0.0",
      solidCommonVocabVersion: VERSION_SOLID_COMMON_VOCAB,
      moduleNamePrefix: "@inrupt/generated-vocab-",
      npmRegistry: NPM_REGISTRY,
      runNpmInstall: false, //RUN_NPM_INSTALL,
      supportBundling: false, //SUPPORT_BUNDLING,
      runWidoco: false,
      publish: "", //RUN_PACKAGING
    });
  });
});

async function generateVocabArtifact(argv) {
  const app = new App({ ...argv, noprompt: true });
  const result = await app.run();

  const directoryForJavaScriptArtifact = result.artifactToGenerate.filter(
    (artifact) => {
      const language = artifact.programmingLanguage.toLowerCase();
      return language === "typescript" || language === "javascript";
    }
  )[0].outputDirectoryForArtifact;

  debug(
    `Expecting 'package.json' in this directory: [${directoryForJavaScriptArtifact}/package.json]...`
  );
  expect(fs.existsSync(`${directoryForJavaScriptArtifact}/package.json`)).toBe(
    true
  );

  if (result.runNpmInstall) {
    expect(
      fs.existsSync(`${directoryForJavaScriptArtifact}/package-lock.json`)
    ).toBe(true);
  }

  if (result.runWidoco) {
    // Check if our documentation is in the root output directory (not the
    // artifact directory!).
    expect(result.documentationDirectory).toMatch(/Widoco/);
    expect(
      fs.existsSync(`${result.documentationDirectory}/index-en.html`)
    ).toBe(true);
  }

  debug(`Generation process successful!\n`);
}
