require('mock-local-storage');
const fs = require('fs');
const logger = require('debug')('lit-artifact-generator:VocabGenerator');

const ArtifactGenerator = require('./generator/ArtifactGenerator');
const CommandLine = require('./CommandLine');

const VERSION_ARTIFACT_GENERATED = '0.1.0';

// const VERSION_LIT_VOCAB_TERM = 'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
const VERSION_LIT_VOCAB_TERM = '^0.1.0';
const NPM_REGISTRY = 'http://localhost:4873';
const RUN_NPM_INSTALL = false;
const RUN_NPM_PUBLISH = false;
const SUPPORT_BUNDLING = true;

const ConfigJavaAndJavascript = {
  artifactToGenerate: [
    {
      programmingLanguage: 'Java',
      description: 'Generate Java JAR',
      javaPackageName: 'com.inrupt.testing.java',
      artifactFolderName: 'Java',
      handlebarsTemplate: 'java.hbs',
      sourceFileExtension: 'java',
    },
    {
      programmingLanguage: 'Javascript',
      description: 'Generate Javascript NPM module',
      artifactFolderName: 'Javascript',
      handlebarsTemplate: 'javascript-rdf-ext.hbs',
      sourceFileExtension: 'js',
    },
  ],
};

const GenerationConfigLitCommon = {
  vocabListFile:
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/LIT/Common/Vocab/Vocab-List-LIT-Common.yml',
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/LIT/Common',
  // './test/generated',
  moduleNamePrefix: '@lit/generated-vocab-',
  artifactName: 'common',
  artifactVersion: VERSION_ARTIFACT_GENERATED,
  litVocabTermVersion: VERSION_LIT_VOCAB_TERM,
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  runNpmPublish: RUN_NPM_PUBLISH,
  supportBundling: SUPPORT_BUNDLING,
  // runYalcCommand: 'yalc link @lit/vocab-term && yalc publish',
};

const GenerationConfigLitCore = {
  vocabListFile:
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/LIT/Core/Vocab/Vocab-List-LIT-Core.yml',
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/LIT/Core',
  moduleNamePrefix: '@lit/generated-vocab-',
  artifactName: 'core',
  artifactVersion: VERSION_ARTIFACT_GENERATED,
  litVocabTermVersion: VERSION_LIT_VOCAB_TERM,
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  runNpmPublish: RUN_NPM_PUBLISH,
  supportBundling: SUPPORT_BUNDLING,
};

const GenerationConfigSolidComponent = {
  inputResources: [
    '../../../../Solid/MonoRepo/testLit/packages/Vocab/SolidComponent/Vocab/SolidComponent.ttl',
  ],
  outputDirectory: '../../../../Solid/MonoRepo/testLit/packages/Vocab/SolidComponent',
  artifactVersion: VERSION_ARTIFACT_GENERATED,
  litVocabTermVersion: VERSION_LIT_VOCAB_TERM,
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
  litVocabTermVersion: VERSION_LIT_VOCAB_TERM,
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
    await generateVocabArtifact(GenerationConfigLitCommon, ConfigJavaAndJavascript);
    await generateVocabArtifact(GenerationConfigLitCore, ConfigJavaAndJavascript);
    await generateVocabArtifact(GenerationConfigSolidComponent);
    await generateVocabArtifact(GenerationConfigSolidGeneratorUi);
  }, 60000);

  // it('LIT Common vocabs', async () => {
  it.skip('LIT Common vocabs', async () => {
    await generateVocabArtifact(GenerationConfigLitCommon);
  });

  // it('LIT Core vocabs', async () => {
  it.skip('LIT Core vocabs', async () => {
    await generateVocabArtifact(GenerationConfigLitCore);
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

      inputResources: ['https://www.w3.org/ns/activitystreams-owl'],
      nameAndPrefixOverride: 'as',

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
