require('mock-local-storage');
const fs = require('fs');
const logger = require('debug')('lit-artifact-generator:VocabGenerator');

const ArtifactGenerator = require('./generator/ArtifactGenerator');
const CommandLine = require('./CommandLine');

// These values are not expected to be specified in vocab list files - they
// are expected to be provided as runtime arguments.
const VERSION_ARTIFACT_GENERATED = '0.1.0';

const VERSION_LIT_VOCAB_TERM = '^0.1.0'; // TODO: SHOULD BE IRRELEVANT NOW (FOR VOCAB LIST FILES, AS THEY PROVIDE PER PROGRAMMING LANGUAGE)...!?
const NPM_REGISTRY = 'http://localhost:4873';
const RUN_NPM_INSTALL = false;
const RUN_MAVEN_INSTALL = true;
const RUN_NPM_PUBLISH = false;
const SUPPORT_BUNDLING = false;

const GenerationConfigLitCommon = {
  vocabListFile:
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/LIT/Common/Vocab/Vocab-List-LIT-Common.yml',
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/LIT/Common',
  moduleNamePrefix: '@lit/generated-vocab-', // TODO: SHOULD BE IRRELEVANT NOW (FOR VOCAB LIST FILES)...!?
  artifactName: 'common',
  artifactVersion: VERSION_ARTIFACT_GENERATED,
  litVocabTermVersion: VERSION_LIT_VOCAB_TERM, // TODO: SHOULD BE IRRELEVANT NOW (FOR VOCAB LIST FILES)...!?
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  runMavenInstall: RUN_MAVEN_INSTALL,
  runNpmPublish: RUN_NPM_PUBLISH,
  supportBundling: SUPPORT_BUNDLING,
  // runYalcCommand: 'yalc link @lit/vocab-term && yalc publish',
};

const GenerationConfigSolidCommon = {
  vocabListFile:
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/SolidCommon/Vocab/Vocab-List-Solid-Common.yml',
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/SolidCommon',
  moduleNamePrefix: '@solid/generated-vocab-', // TODO: SHOULD BE IRRELEVANT NOW (FOR VOCAB LIST FILES)...!?
  artifactName: 'common',
  artifactVersion: VERSION_ARTIFACT_GENERATED,
  litVocabTermVersion: VERSION_LIT_VOCAB_TERM, // TODO: SHOULD BE IRRELEVANT NOW (FOR VOCAB LIST FILES)...!?
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  runMavenInstall: RUN_MAVEN_INSTALL,
  runNpmPublish: RUN_NPM_PUBLISH,
  supportBundling: SUPPORT_BUNDLING,
};

const GenerationConfigLitCore = {
  vocabListFile:
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/LIT/Core/Vocab/Vocab-List-LIT-Core.yml',
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/LIT/Core',
  moduleNamePrefix: '@lit/generated-vocab-',
  artifactName: 'core',
  artifactVersion: VERSION_ARTIFACT_GENERATED,
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  runMavenInstall: RUN_MAVEN_INSTALL,
  runNpmPublish: RUN_NPM_PUBLISH,
  supportBundling: SUPPORT_BUNDLING,
};

const GenerationConfigSolidComponent = {
  inputResources: [
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/SolidComponent/Vocab/SolidComponent.ttl',
  ],
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/SolidComponent',
  artifactVersion: VERSION_ARTIFACT_GENERATED,
  moduleNamePrefix: '@solid/generated-vocab-',
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  runNpmPublish: RUN_NPM_PUBLISH,
  supportBundling: SUPPORT_BUNDLING,
  runWidoco: true,
};

const GenerationConfigSolidGeneratorUi = {
  inputResources: [
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/SolidGeneratorUi/Vocab/SolidGeneratorUi.ttl',
  ],
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/SolidGeneratorUi',
  artifactVersion: VERSION_ARTIFACT_GENERATED,
  moduleNamePrefix: '@solid/generated-vocab-',
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  runNpmPublish: RUN_NPM_PUBLISH,
  supportBundling: SUPPORT_BUNDLING,
  runWidoco: true,
};

async function generateVocabArtifact(argv) {
  const artifactGenerator = new ArtifactGenerator(
    { ...argv, noprompt: true },
    CommandLine.askForArtifactInfo
  );

  const result = await artifactGenerator
    .generate()
    .then(CommandLine.askForArtifactToBeNpmVersionBumped)
    // .then(await CommandLine.askForArtifactToBeYalced)
    .then(CommandLine.askForArtifactToBeNpmInstalled)
    .then(CommandLine.runMavenInstall)
    .then(CommandLine.askForArtifactToBeNpmPublished)
    .then(CommandLine.askForArtifactToBeDocumented)
    .catch(error => {
      logger(`Generation process failed: [${error}]`);
      throw new Error(error);
    });

  expect(fs.existsSync(`${result.outputDirectoryForArtifact}/package.json`)).toBe(true);

  if (result.runNpmInstall) {
    expect(fs.existsSync(`${result.outputDirectoryForArtifact}/package-lock.json`)).toBe(true);
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
  // it('Generate ALL vocabs', async () => {
  it.skip('Generate ALL vocabs', async () => {
    jest.setTimeout(60000);
    await generateVocabArtifact(GenerationConfigLitCommon);
    await generateVocabArtifact(GenerationConfigLitCore);
    await generateVocabArtifact(GenerationConfigSolidCommon);

    await generateVocabArtifact(GenerationConfigSolidComponent);
    await generateVocabArtifact(GenerationConfigSolidGeneratorUi);
  });

  // it('LIT Common vocabs', async () => {
  it.skip('LIT Common vocabs', async () => {
    jest.setTimeout(15000);
    await generateVocabArtifact(GenerationConfigLitCommon);
  });

  // it('LIT Core vocabs', async () => {
  it.skip('LIT Core vocabs', async () => {
    await generateVocabArtifact(GenerationConfigLitCore);
  });

  // it('Solid Common vocabs', async () => {
  it.skip('Solid Common vocabs', async () => {
    jest.setTimeout(15000);
    await generateVocabArtifact(GenerationConfigSolidCommon);
  });

  // it('Solid Generator UI vocab', async () => {
  it.skip('Solid Generator UI vocab', async () => {
    await generateVocabArtifact(GenerationConfigSolidGeneratorUi);
  });

  // it('Solid Component vocab', async () => {
  it.skip('Solid Component vocab', async () => {
    await generateVocabArtifact(GenerationConfigSolidComponent);
  });

  it.skip('Test Demo App', async () => {
    // it('Test Demo App', async () => {
    await generateVocabArtifact({
      // inputResources: ['../../../../Solid/ReactSdk/testExport/public/vocab/TestExportVocab.ttl'],
      // inputResources: ['./example/vocab/PetRocks.ttl'],
      // inputResources: ['../../../../Solid/MonoRepo/testLit/packages/Vocab/PetRock/Vocab/PetRock.ttl'],

      // inputResources: ['http://www.w3.org/2006/vcard/ns#'],
      // nameAndPrefixOverride: 'vcard',
      //
      // inputResources: ['http://www.w3.org/2002/07/owl#'],
      // nameAndPrefixOverride: 'owl',

      // inputResources: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
      // nameAndPrefixOverride: 'RDF',

      // inputResources: ['http://dublincore.org/2012/06/14/dcterms.ttl'],
      // nameAndPrefixOverride: 'DCTERMS',

      // inputResources: ['https://www.w3.org/ns/activitystreams-owl'],
      // nameAndPrefixOverride: 'as',

      inputResources: ['http://www.w3.org/2007/ont/httph#'],
      nameAndPrefixOverride: 'httph',

      outputDirectory: './test/generated',
      // outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/PetRock',
      artifactVersion: '1.0.0',
      litVocabTermVersion: VERSION_LIT_VOCAB_TERM,
      moduleNamePrefix: '@lit/generated-vocab-',
      runNpmInstall: RUN_NPM_INSTALL,
      runNpmPublish: RUN_NPM_PUBLISH,
      supportBundling: SUPPORT_BUNDLING,
      runWidoco: false,
    });
  });
});
