require('mock-local-storage');
const fs = require('fs');
const logger = require('debug')('lit-artifact-generator:VocabGenerator');

const App = require('./App');

// These values are not expected to be specified in vocab list files - they
// are expected to be provided as runtime arguments.
const VERSION_LIT_VOCAB_TERM = '^0.1.0';
const NPM_REGISTRY = 'http://localhost:4873';
const RUN_NPM_INSTALL = false;
const SUPPORT_BUNDLING = false;
const RUN_PACKAGING = true;

const ConfigLitCommon = {
  _: 'generate',
  force: true,
  vocabListFile:
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/LIT/Common/Vocab/Vocab-List-LIT-Common.yml',
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/LIT/Common',
  moduleNamePrefix: '@lit/generated-vocab-', // TODO: SHOULD BE IRRELEVANT NOW (FOR VOCAB LIST FILES)...!?
  artifactName: 'common',
  litVocabTermVersion: VERSION_LIT_VOCAB_TERM,
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: RUN_PACKAGING,
};

const ConfigSolidCommon = {
  _: 'generate',
  force: true,
  vocabListFile:
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/solid-rdf-vocab/Common/Vocab/Vocab-List-Solid-Common.yml',
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/solid-rdf-vocab/Common',
  moduleNamePrefix: '@solid/generated-vocab-', // TODO: SHOULD BE IRRELEVANT NOW (FOR VOCAB LIST FILES)...!?
  artifactName: 'common',
  litVocabTermVersion: VERSION_LIT_VOCAB_TERM,
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: RUN_PACKAGING,
};

const ConfigInruptCommon = {
  _: 'generate',
  force: true,
  vocabListFile:
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/inrupt-rdf-vocab/Common/Vocab/Vocab-List-Inrupt-Common.yml',
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/inrupt-rdf-vocab/Common',
  moduleNamePrefix: '@inrupt/generated-vocab-',
  artifactName: 'common',
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: RUN_PACKAGING,
};

const ConfigInruptService = {
  _: 'generate',
  force: true,
  vocabListFile:
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/inrupt-rdf-vocab/Service/Vocab/Vocab-List-Inrupt-Service.yml',
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/inrupt-rdf-vocab/Service',
  moduleNamePrefix: '@inrupt/generated-vocab-',
  artifactName: 'service',
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: RUN_PACKAGING,
};

const ConfigLitCore = {
  _: 'generate',
  force: true,
  vocabListFile:
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/LIT/Core/Vocab/Vocab-List-LIT-Core.yml',
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/LIT/Core',
  moduleNamePrefix: '@lit/generated-vocab-',
  artifactName: 'core',
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  publish: RUN_PACKAGING,
};

const ConfigSolidComponent = {
  _: 'generate',
  force: true,
  inputResources: [
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/solid-rdf-vocab/Component/Vocab/SolidComponent.ttl',
  ],
  litVocabTermVersion: '^0.1.0',

  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/solid-rdf-vocab/Component',
  artifactVersion: '0.1.0',
  moduleNamePrefix: '@solid/generated-vocab-',
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  runWidoco: true,
  publish: RUN_PACKAGING,
};

const ConfigSolidGeneratorUi = {
  _: 'generate',
  force: true,
  inputResources: [
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/solid-rdf-vocab/GeneratorUi/Vocab/SolidGeneratorUi.ttl',
  ],
  litVocabTermVersion: '^0.1.0',

  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/solid-rdf-vocab/GeneratorUi',
  artifactVersion: '0.1.0',
  moduleNamePrefix: '@solid/generated-vocab-',
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  supportBundling: SUPPORT_BUNDLING,
  runWidoco: true,
  publish: RUN_PACKAGING,
};

async function generateVocabArtifact(argv) {
  const app = new App({ ...argv, noprompt: true });
  await app.configure();
  const result = await app.run();

  const directoryForJavascriptArtifact = result.artifactToGenerate.filter(
    artifact => artifact.programmingLanguage === 'Javascript'
  )[0].outputDirectoryForArtifact;

  logger(
    `Expecting 'package.json' in this folder: [${directoryForJavascriptArtifact}/package.json]...`
  );
  expect(fs.existsSync(`${directoryForJavascriptArtifact}/package.json`)).toBe(true);

  if (result.runNpmInstall) {
    expect(fs.existsSync(`${directoryForJavascriptArtifact}/package-lock.json`)).toBe(true);
  }

  if (result.runWidoco) {
    // Check if our documentation is in the root output directory (not the
    // artifact directory!).
    expect(result.documentationDirectory).toMatch(/Widoco/);
    expect(fs.existsSync(`${result.documentationDirectory}/index-en.html`)).toBe(true);
  }

  logger(`Generation process successful!\n`);
}

describe('Suite for generating common vocabularies (marked as [skip] to prevent non-manual execution', () => {
  it('Generate ALL vocabs', async () => {
  // it.skip('Generate ALL vocabs', async () => {
    jest.setTimeout(60000);
    await generateVocabArtifact(ConfigLitCommon);
    await generateVocabArtifact(ConfigLitCore);

    await generateVocabArtifact(ConfigSolidCommon);

    // Just note - these configurations generate from single RDF vocab files (i.e. not via YAML
    // config files), so they'll only generate Javascript (i.e. the command-line default).
    // TODO: commented out for now until the config's are updated to work with latest packaging
    //  changes from Nic...
    // await generateVocabArtifact(ConfigSolidComponent);
    // await generateVocabArtifact(ConfigSolidGeneratorUi);

    await generateVocabArtifact(ConfigInruptCommon);
    await generateVocabArtifact(ConfigInruptService);
  });

  // it('LIT vocabs', async () => {
  it.skip('LIT vocabs', async () => {
    jest.setTimeout(15000);
    await generateVocabArtifact(ConfigLitCommon);
    await generateVocabArtifact(ConfigLitCore);
  });

  // it('Solid vocabs', async () => {
  it.skip('Solid vocabs', async () => {
    jest.setTimeout(15000);
    await generateVocabArtifact(ConfigSolidCommon);
    await generateVocabArtifact(ConfigSolidGeneratorUi);
    await generateVocabArtifact(ConfigSolidComponent);
  });

  // it('Inrupt vocab', async () => {
  it.skip('Inrupt vocab', async () => {
    await generateVocabArtifact(ConfigInruptCommon);
    await generateVocabArtifact(ConfigInruptService);
  });

  // it('LIT Common vocabs', async () => {
  it.skip('LIT Common vocabs', async () => {
    jest.setTimeout(15000);
    await generateVocabArtifact(ConfigLitCommon);
  });

  // it('LIT Core vocabs', async () => {
  it.skip('LIT Core vocabs', async () => {
    await generateVocabArtifact(ConfigLitCore);
  });

  // it('Solid Common vocabs', async () => {
  it.skip('Solid Common vocabs', async () => {
    jest.setTimeout(15000);
    await generateVocabArtifact(ConfigSolidCommon);
  });

  // it('Solid Generator UI vocab', async () => {
  it.skip('Solid Generator UI vocab', async () => {
    await generateVocabArtifact(ConfigSolidGeneratorUi);
  });

  // it('Solid Component vocab', async () => {
  it.skip('Solid Component vocab', async () => {
    await generateVocabArtifact(ConfigSolidComponent);
  });

  // it('Inrupt Commmon vocab', async () => {
  it.skip('Inrupt Commmon vocab', async () => {
    await generateVocabArtifact(ConfigInruptCommon);
  });

  // it('Inrupt Service vocab', async () => {
  it.skip('Inrupt Service vocab', async () => {
    await generateVocabArtifact(ConfigInruptService);
  });

  it.skip('Test Demo App', async () => {
    // it('Test Demo App', async () => {
    await generateVocabArtifact({
      // inputResources: ['../../../../Solid/ReactSdk/testExport/public/vocab/TestExportVocab.ttl'],

      // inputResources: ['../../../../Solid/MonoRepo/testLit/packages/Vocab/PetRock/Vocab/PetRock.ttl'],

      // inputResources: ['./example/vocab/PetRock.ttl'],
      // outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/PetRock',

      inputResources: [
        'https://raw.githubusercontent.com/UKGovLD/publishing-statistical-data/master/specs/src/main/vocab/cube.ttl',
      ],
      nameAndPrefixOverride: 'cube',

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

      outputDirectory: './test/generated',
      artifactVersion: '1.0.0',
      litVocabTermVersion: VERSION_LIT_VOCAB_TERM,
      moduleNamePrefix: '@lit/generated-vocab-',
      npmRegistry: NPM_REGISTRY,
      runNpmInstall: RUN_NPM_INSTALL,
      supportBundling: SUPPORT_BUNDLING,
      runWidoco: false,
      publish: RUN_PACKAGING,
    });
  });
});
