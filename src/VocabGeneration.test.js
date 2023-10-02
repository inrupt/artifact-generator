require("mock-local-storage");

const fs = require("fs");
const debug = require("debug")("artifact-generator:VocabGenerator");

const App = require("./App");
const { DEFAULT_PUBLISH_KEY } = require("./config/GeneratorConfiguration");

// These version numbers are only useful if attempting to build from a single
// RDF vocabulary, and not using a vocab list file (since the vocab list files
// would be expected to provide these values).
const VERSION_SOLID_COMMON_VOCAB = "^1.0.0";
const VERSION_RDFJS_IMPL = "^1.2.3";

// These values are not expected to be specified in vocab list files - they
// are expected to be provided as runtime command-line arguments.
const NPM_REGISTRY = "http://localhost:4873";
const RUN_NPM_INSTALL = false;
const SUPPORT_BUNDLING = true;
const PUBLISH_TO_REPO_LIST = ["mavenLocal", "npmLocal"];
const LOCAL_COPY_OF_VOCAB_DIRECTORY =
  "./test/Generated/LOCAL_COPY_OF_VOCAB_AS_TURTLE/";

const ConfigAll = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated/GENERATE_SOURCE/ALL",
  vocabListFile: "../solid-common-vocab-rdf/**/*.yml",
  vocabListFileIgnore: "../solid-common-vocab-rdf/bin/**",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: PUBLISH_TO_REPO_LIST,
  storeLocalCopyOfVocabDirectory: LOCAL_COPY_OF_VOCAB_DIRECTORY,
  reportBestPracticeCompliance: true,
};

const ConfigCommonRdf = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated/GENERATE_SOURCE/SINGLE/RdfCommon",
  vocabListFile: "../solid-common-vocab-rdf/common-rdf/vocab-common-rdf.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: PUBLISH_TO_REPO_LIST,
  storeLocalCopyOfVocabDirectory: LOCAL_COPY_OF_VOCAB_DIRECTORY,
  reportBestPracticeCompliance: true,
};

const ConfigCommonRdfNoExtensions = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory:
    "./test/Generated/GENERATE_SOURCE/SINGLE/RdfCommonNoExtension",
  vocabListFile:
    "../solid-common-vocab-rdf/common-rdf/vocab-common-rdf-no-extension.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  // This configuration is only a subset (i.e., no Inrupt extensions), so
  // because it's not the most comprehensive test, don't bother testing the
  // publication process for the generated artifacts.
  // publish: PUBLISH_TO_REPO_LIST,
  storeLocalCopyOfVocabDirectory: LOCAL_COPY_OF_VOCAB_DIRECTORY,
  reportBestPracticeCompliance: true,
};

const ConfigInruptAll = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated/GENERATE_SOURCE/SINGLE/Inrupt/All",
  vocabListFile: "../solid-common-vocab-rdf/inrupt-rdf/**/*.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: PUBLISH_TO_REPO_LIST,
  storeLocalCopyOfVocabDirectory: LOCAL_COPY_OF_VOCAB_DIRECTORY,
  reportBestPracticeCompliance: true,
};

const ConfigInruptCore = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated/GENERATE_SOURCE/SINGLE/Inrupt/Core",
  vocabListFile:
    "../solid-common-vocab-rdf/inrupt-rdf/Core/vocab-inrupt-core.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  // publish: PUBLISH_TO_REPO_LIST,
  storeLocalCopyOfVocabDirectory: LOCAL_COPY_OF_VOCAB_DIRECTORY,
  reportBestPracticeCompliance: true,
};

const ConfigInruptGlossary = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated/GENERATE_SOURCE/SINGLE/Inrupt/Glossary",
  vocabListFile:
    "../solid-common-vocab-rdf/inrupt-rdf/Glossary/vocab-inrupt-glossary.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: PUBLISH_TO_REPO_LIST,
  storeLocalCopyOfVocabDirectory: LOCAL_COPY_OF_VOCAB_DIRECTORY,
  reportBestPracticeCompliance: true,
};

const ConfigInruptUi = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated/GENERATE_SOURCE/SINGLE/Inrupt/Ui",
  vocabListFile: "../solid-common-vocab-rdf/inrupt-rdf/Ui/vocab-inrupt-ui.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: PUBLISH_TO_REPO_LIST,
  storeLocalCopyOfVocabDirectory: LOCAL_COPY_OF_VOCAB_DIRECTORY,
  reportBestPracticeCompliance: true,
};

const ConfigInruptService = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated/GENERATE_SOURCE/SINGLE/Inrupt/Service",
  vocabListFile:
    "../solid-common-vocab-rdf/inrupt-rdf/Service/vocab-inrupt-service.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: PUBLISH_TO_REPO_LIST,
  storeLocalCopyOfVocabDirectory: LOCAL_COPY_OF_VOCAB_DIRECTORY,
  reportBestPracticeCompliance: true,
};

const ConfigSolid = {
  _: "generate",
  force: true,
  clearOutputDirectory: true,
  outputDirectory: "./test/Generated/GENERATE_SOURCE/SINGLE/Solid/Common",
  vocabListFile: "../solid-common-vocab-rdf/solid-rdf/vocab-solid.yml",
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: PUBLISH_TO_REPO_LIST,
  storeLocalCopyOfVocabDirectory: LOCAL_COPY_OF_VOCAB_DIRECTORY,
  reportBestPracticeCompliance: true,
};

describe("Suite for generating common vocabularies (marked as [skip] to prevent non-manual execution)", () => {
  // it("Generate ALL vocabs", async () => {
  it.skip("Generate ALL vocabs", async () => {
    await generateVocabArtifact(ConfigAll);
  }, 6000000);

  // it("Generate ALL specific vocabs", async () => {
  it.skip("Generate ALL specific vocabs", async () => {
    await generateVocabArtifact(ConfigCommonRdf);

    await generateVocabArtifact(ConfigSolid);

    await generateVocabArtifact(ConfigInruptCore);
    await generateVocabArtifact(ConfigInruptUi);
    await generateVocabArtifact(ConfigInruptService);
  }, 1200000);

  // it("Common RDF vocabs", async () => {
  it.skip("Common RDF vocabs", async () => {
    await generateVocabArtifact(ConfigCommonRdf);
  }, 600000);

  // it("Common RDF vocabs (with no Inrupt extensions)", async () => {
  it.skip("Common RDF vocabs (with no Inrupt extensions)", async () => {
    await generateVocabArtifact(ConfigCommonRdfNoExtensions);
  }, 600000);

  // it("Solid vocabs", async () => {
  it.skip("Solid vocabs", async () => {
    await generateVocabArtifact(ConfigSolid);
  }, 1200000);

  // it("Inrupt All vocabs", async () => {
  it.skip("Inrupt All vocabs", async () => {
    await generateVocabArtifact(ConfigInruptAll);
  }, 1200000);

  // it("Inrupt specific vocabs", async () => {
  it.skip("Inrupt specific vocabs", async () => {
    await generateVocabArtifact(ConfigInruptCore);
    // await generateVocabArtifact(ConfigInruptUi);
    // await generateVocabArtifact(ConfigInruptService);
    // await generateVocabArtifact(ConfigInruptGlossary);
  }, 1200000);

  // it("tests a single vocab config file", async () => {
  it.skip("tests a single vocab config file", async () => {
    await generateVocabArtifact({
      vocabListFile: "./example/vocab/CopyOf-Vocab-List-Common.yml",

      _: "generate",
      force: true,
      clearOutputDirectory: true,
      outputDirectory: "./test/Generated/GENERATE_SOURCE/CUSTOM_CONFIG_FILE",
      // npmRegistry: NPM_REGISTRY,
      // runWidoco: false,
      // runNpmInstall: RUN_NPM_INSTALL,
      // supportBundling: SUPPORT_BUNDLING,
      // publish: [DEFAULT_PUBLISH_KEY],
      // storeLocalCopyOfVocabDirectory: LOCAL_COPY_OF_VOCAB_DIRECTORY,
    });
  }, 10000);

  /**
   * The ever-growing list of vocabs in this particular test has been handy
   * lots of times, as if I want to rerun the AG for just a single vocab, I
   * can just pop in here, uncomment it, and rerun this test.
   * It's handy 'cos almost all vocabs our there in the wild need something
   * overridden (e.g., vocabContentTypeHeaderOverride:,
   * or ignoreNonVocabTerms:, or namespaceIriOverride:), so having them recorded
   * here has been really handy sometimes.
   */
  // it("tests a single custom vocab", async () => {
  it.skip("tests a single custom vocab", async () => {
    await generateVocabArtifact({
      // inputResources: ["https://w3id.org/plasma#"],
      // inputResources: ["https://w3id.org/oac#"],

      inputResources: [
        "https://raw.githubusercontent.com/coolharsh55/plasma/main/plasma.ttl",
      ],

      // inputResources: ["http://rdf-vocabulary.ddialliance.org/xkos#"],

      // nameAndPrefixOverride: "oac",
      // descriptionFallback: "Beatriz's spec vocab",

      // inputResources: ["http://www.w3.org/ns/locn#"],
      // vocabAcceptHeaderOverride: "text/turtle",
      //
      // inputResources: [
      //   "https://raw.githubusercontent.com/ewilderj/doap/master/schema/doap.rdf",
      // ],
      // nameAndPrefixOverride: "doap",
      // vocabContentTypeHeaderOverride: "application/rdf+xml",
      // inputResources: ["http://purl.org/wf4ever/ro#"],
      // nameAndPrefixOverride: "ro",
      // inputResources: ["http://purl.org/wf4ever/wfprov#"],
      // nameAndPrefixOverride: "wfprov",
      // inputResources: ["http://purl.org/wf4ever/wfdesc#"],
      // nameAndPrefixOverride: "wfdesc",

      // inputResources: ["http://www.openarchives.org/ore/terms/"],
      // nameAndPrefixOverride: "ore",

      // inputResources: ["http://www.w3.org/ns/spec#"],
      // descriptionFallback: "Sarvens spec vocab",
      // namespaceIriOverride: "http://www.w3.org/ns/spec#",
      //
      // inputResources: ["http://build.fhir.org/fhir.ttl"],
      // nameAndPrefixOverride: "fhir",
      //
      // inputResources: ["http://purl.org/fair-ontology#"],
      // vocabularyIriOverride: "https://w3id.org/fair/principles/terms/",
      // namespaceIriOverride: "https://w3id.org/fair/principles/terms/",
      // nameAndPrefixOverride: "fair",
      // descriptionFallback: "whatever",

      // http://purl.org/np/RAscnEDxqhJys07l4mKeNsbkwG-C_5RL_17GQRLRGu5Uo
      // https://w3id.org/fair/principles/latest/FAIR-Vocabulary

      // inputResources: ["https://peta-pico.github.io/FAIR-nanopubs/principles/ontology.ttl"],
      // // inputResources: ["https://w3id.org/fair/principles/terms/FAIR-Vocabulary"],
      // // inputResources: ["https://w3id.org/fair/principles/latest/FAIR-Vocabulary"],
      // ignoreNonVocabTerms: true,

      // inputResources: ["https://w3id.org/security#"],
      // nameAndPrefixOverride: "sec",

      // inputResources: ["http://www.w3.org/ns/solid/oidc#"],

      // inputResources: ["http://xmlns.com/foaf/0.1/"],
      // nameAndPrefixOverride: "foaf",
      // descriptionFallback: "Friend Of A Friend",

      // inputResources: ["http://purl.org/dc/terms/"],
      // nameAndPrefixOverride: "dcterms",

      // inputResources: ["http://www.w3.org/ns/shacl#"],
      // nameAndPrefixOverride: "sh",

      // inputResources: ["https://saref.etsi.org/core/"],
      // ignoreNonVocabTerms: true,

      // inputResources: ["http://www.w3.org/ns/adms#"],

      // inputResources: ["http://www.omg.org/techprocess/ab/SpecificationMetadata/"],
      // nameAndPrefixOverride: "sm",
      // ignoreNonVocabTerms: true,
      //
      // inputResources: ["https://github.com/SEMICeu/Core-Person-Vocabulary/blob/master/releases/2.00/voc/core-person-ap.ttl"],
      // nameAndPrefixOverride: "person",
      // vocabAcceptHeaderOverride: "application/vnd.github.v3.raw",
      // vocabContentTypeHeaderOverride: "text/turtle",
      //
      // inputResources: ["http://www.w3.org/ns/adms#"],
      // inputResources: ["http://www.w3.org/ns/org#"],
      // inputResources: ["http://www.w3.org/ns/person#"],
      // nameAndPrefixOverride: "w3c_person",
      // inputResources: ["http://www.w3.org/ns/regorg#"],

      // inputResources: ["https://purl.org/oslo/ns/localgov#"],
      // vocabContentTypeHeaderOverride: "application/rdf+xml",
      // ignoreNonVocabTerms: true,

      // inputResources: [
      //   // "http://purl.org/oslo/ns/localgov/",
      //   "https://raw.githubusercontent.com/rafbuyle/oslo_xml_schemas/master/oslo-v1_1_0.rdf",
      // ],
      // nameAndPrefixOverride: "oslo",
      // vocabContentTypeHeaderOverride: "application/rdf+xml",
      // ignoreNonVocabTerms: true,

      // // SEMIC Core Person:
      // inputResources: ["https://semiceu.github.io/Core-Person-Vocabulary/releases/2.00/voc/core-person-ap.ttl"],
      // nameAndPrefixOverride: "semic_core_person",
      // // Defines terms like: http://www.w3.org/ns/person#Person
      // ignoreNonVocabTerms: true,
      // // Yes, this vocabulary (although named as an application profile) uses
      // // the 'incorrect' HTTP scheme.
      // namespaceIriOverride: "http://data.europa.eu/m8g/",

      // // OSLO extension to SEMIC Core Person:
      // inputResources: ["https://data.vlaanderen.be/ns/persoon"],
      // nameAndPrefixOverride: "oslo_person",
      // ignoreNonVocabTerms: true,
      // BUG: vann:preferredNamespaceURI seems to be missing trailing '#'!
      // namespaceIriOverride: "https://data.vlaanderen.be/ns/persoon#",

      // inputResources: ["https://spec.edmcouncil.org/auto/ontology/VC/VehicleCore/"],
      // nameAndPrefixOverride: "auto_vc",
      // inputResources: [
      //   "https://spec.edmcouncil.org/auto/ontology/VS/VehicleSignals/",
      // ],
      // nameAndPrefixOverride: "auto_vs",
      // vocabAcceptHeaderOverride: "text/turtle",
      // ignoreNonVocabTerms: true,

      // inputResources: ["https://w3id.org/dpv#"],
      // inputResources: ["http://www.w3.org/ns/dpv-pd#"],

      // inputResources: ["http://purl.org/ontology/bibo/"],
      // vocabContentTypeHeaderOverride: "application/rdf+xml",
      // nameAndPrefixOverride: "bibo",
      // ignoreNonVocabTerms: true,

      // inputResources: ["http://stko-kwg.geog.ucsb.edu/lod/ontology"],
      // nameAndPrefixOverride: "kwg-ont",
      // ignoreNonVocabTerms: true,
      //
      // inputResources: ["http://geovocab.org/spatial"],
      // nameAndPrefixOverride: "neogeo",

      // inputResources: ["https://www.geonames.org/ontology#"],
      // ignoreNonVocabTerms: true,
      //
      // inputResources: ["http://www.w3.org/ns/sosa/"],
      // ignoreNonVocabTerms: true,
      //
      // inputResources: ["http://www.w3.org/ns/ssn/"],
      // ignoreNonVocabTerms: true,
      //

      // inputResources: ["https://ontologies.semanticarts.com/o/gistCore12.0.0"],
      // inputResources: ["https://w3id.org/semanticarts/ontology/gistCore"],
      //
      // inputResources: ["http://www.w3.org/ns/locn"],

      // Typo in the Turtle (trailing full stop inside a BNode on line 22!
      // inputResources: ["http://purl.org/vocab/cpsv#"],

      //
      // inputResources: ["http://rdfs.org/sioc/ns#"],
      // nameAndPrefixOverride: "sioc",
      // ignoreNonVocabTerms: true,

      // inputResources: ["http://rdfs.org/resume-rdf/cv.rdfs#"],
      // vocabContentTypeHeaderOverride: "application/rdf+xml",
      // nameAndPrefixOverride: "cv",

      // rdfjsImplVersion: "^1.2.3",
      // solidCommonVocabVersion: "^4.5.6",
      // widocoLanguages: "en-es",
      // inputResources: [
      //   "/home/pmcb55/Work/Projects/Customer/XXXX/resources/Vocab/ThirdParty/CopyOfVocab/3rd-party-supplier.ttl",
      // ],
      // vocabListFile:
      //   "/home/pmcb55/Work/Projects/Customer/XXXX/resources/Vocab/vocab-bundle-all.yml",

      // inputResources: ["http://rdfs.org/resume-rdf/base.rdfs#"],
      // vocabContentTypeHeaderOverride: "application/rdf+xml",
      // nameAndPrefixOverride: "cv-base",

      // inputResources: ["http://usefulinc.com/ns/doap#"],
      // nameAndPrefixOverride: "doap",
      // vocabContentTypeHeaderFallback: "application/rdf+xml",

      // inputResources: ["https://w3id.org/survey-ontology#"],
      // nameAndPrefixOverride: "sur",
      // vocabAcceptHeaderOverride: "text/turtle",
      // ignoreNonVocabTerms: true,

      // inputResources: ["http://www.w3.org/2003/06/sw-vocab-status/ns#"],
      //
      // inputResources: ["http://www.w3.org/ns/earl#"],

      // inputResources: ["http://www.w3.org/ns/json-ld#"],
      // nameAndPrefixOverride: "jsonld",

      // inputResources: ["https://w3id.org/security#"],
      // nameAndPrefixOverride: "sec",
      //
      // inputResources: ["http://www.w3.org/2008/05/skos-xl#"],
      // nameAndPrefixOverride: "skos-xl",
      //
      //
      // inputResources: ["http://www.w3.org/ns/odrl/2/"],
      // namespaceIriOverride: "http://www.w3.org/ns/odrl/2/",
      // nameAndPrefixOverride: "odrl",
      // ignoreNonVocabTerms: true,

      // inputResources: ["https://www.w3.org/2018/credentials/v1"],
      // nameAndPrefixOverride: "vc",
      //
      // inputResources: ["http://www.w3.org/2006/time#"],
      // nameAndPrefixOverride: "time",

      // inputResources: [
      //   "/home/pmcb55/Work/Projects/LIT/solid-common-vocab-rdf/common-rdf/CopyOfVocab/inrupt-void.ttl",
      // ],
      //
      // inputResources: ["https://www.w3.org/ns/sparql-service-description#"],
      // nameAndPrefixOverride: "sd",
      //
      // inputResources: ["http://www.w3.org/2002/01/bookmark#"],
      // nameAndPrefixOverride: "bookmark",
      //
      // inputResources: ["http://www.w3.org/ns/dcat#"],
      // nameAndPrefixOverride: "dcat",
      // ignoreNonVocabTerms: true,

      // inputResources: ["http://www.w3.org/ns/hydra/core#"],

      // // Perhaps because this is not a standard yet, nothing is returned from
      // // the namespace IRI, so use this (referenced from the working draft itself) instead
      // inputResources: ["https://www.w3.org/TR/dx-prof-conneg/altr.ttl"],
      // nameAndPrefixOverride: "altr",
      // namespaceIriOverride: "http://www.w3.org/ns/dx/conneg/altr#",
      // ignoreNonVocabTerms: true,

      // inputResources: ["https://www.w3.org/ns/prov-o#"],
      // nameAndPrefixOverride: "prov-o",
      // namespaceIriOverride: "http://www.w3.org/ns/prov#",
      // vocabularyIriOverride: "http://www.w3.org/ns/prov-o#",
      // descriptionFallback:
      //   "Needs a description - see Common RDF YAML for why...",

      // inputResources: [
      //   "https://schema.org/version/latest/schemaorg-current-http.ttl",
      // ],
      // // termSelectionResource: "./test/resources/vocab/schema-inrupt-ext.ttl",
      // descriptionFallback: "Needs a description...",

      //
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

      _: "generate",
      force: true,
      clearOutputDirectory: true,
      outputDirectory: "./test/Generated/GENERATE_SOURCE/CUSTOM",
      artifactVersion: "1.0.0",
      moduleNamePrefix: "@inrupt/generated-custom-vocab-",
      npmRegistry: NPM_REGISTRY,
      runWidoco: false,
      runNpmInstall: RUN_NPM_INSTALL,
      supportBundling: false, //SUPPORT_BUNDLING,
      // publish: [DEFAULT_PUBLISH_KEY],
      storeLocalCopyOfVocabDirectory: LOCAL_COPY_OF_VOCAB_DIRECTORY,
      reportBestPracticeCompliance: true,
    });
  }, 30000);
});

async function generateVocabArtifact(argv) {
  const app = new App({ ...argv, noPrompt: true });
  const result = await app.run();

  const directoryForJavaScriptArtifact = result.artifactToGenerate.filter(
    (artifact) => {
      const language = artifact.programmingLanguage.toLowerCase();
      return language === "typescript" || language === "javascript";
    },
  )[0].outputDirectoryForArtifact;

  debug(
    `Expecting 'package.json' in this directory: [${directoryForJavaScriptArtifact}/package.json]...`,
  );
  expect(fs.existsSync(`${directoryForJavaScriptArtifact}/package.json`)).toBe(
    true,
  );

  if (result.runNpmInstall) {
    expect(
      fs.existsSync(`${directoryForJavaScriptArtifact}/package-lock.json`),
    ).toBe(true);
  }

  if (result.runWidoco) {
    // Check if our documentation is in the root output directory (not the
    // artifact directory!).
    expect(result.documentationDirectories).toHaveLength(1);
    expect(result.documentationDirectories[0]).toMatch(/Widoco/);
    expect(
      fs.existsSync(`${result.documentationDirectory[0]}/index-en.html`),
    ).toBe(true);
  }

  debug(`Generation process successful!\n`);
}
