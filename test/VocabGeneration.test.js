require('mock-local-storage');

const chai = require('chai');
chai.use(require('chai-string'));
const { expect } = chai;

const fs = require('fs');
const del = require('del');

const ArtifactGenerator = require('../src/generator/ArtifactGenerator');
const CommandLine = require('../src/CommandLine');

const VERSION_ARTIFACT_GENERATED = '0.1.0';
// const VERSION_BUMP_EXISTING = true; // Not sure yet if this is really needed, or how it would work...!

// const VERSION_LIT_VOCAB_TERM = 'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
const VERSION_LIT_VOCAB_TERM = '^0.1.0';
const NPM_REGISTRY = 'http://localhost:4873';
const RUN_NPM_INSTALL = false;
const RUN_NPM_PUBLISH = false;

const GenerationConfigLitCommon = {
  vocabListFile: '../../../vocab/Vocab-List-LIT-Common.yml',
  outputDirectory:
    // '../../../../Solid/MonoRepo/testLit/packages/LIT/Common/GeneratedSourceCodeArtifacts/Javascript',
    './generated',
  moduleNamePrefix: '@lit/generated-vocab-',
  artifactName: 'common',
  artifactVersion: VERSION_ARTIFACT_GENERATED,
  litVocabTermVersion: VERSION_LIT_VOCAB_TERM,
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  runNpmPublish: RUN_NPM_PUBLISH,
  // runYalcCommand: 'yalc link @lit/vocab-term && yalc publish',
};

const GenerationConfigSolidComponent = {
  input: ['../../../../Solid/MonoRepo/testLit/packages/SolidComponent/SolidComponent.ttl'],
  outputDirectory:
    '../../../../Solid/MonoRepo/testLit/packages/SolidComponent/GeneratedSourceCodeArtifacts/Javascript',
  artifactVersion: VERSION_ARTIFACT_GENERATED,
  litVocabTermVersion: VERSION_LIT_VOCAB_TERM,
  moduleNamePrefix: '@solid/generated-vocab-',
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  runNpmPublish: RUN_NPM_PUBLISH,
  // runYalcCommand: 'yalc link @lit/vocab-term && yalc publish',
  runWidoco: true,
};

const GenerationConfigSolidGeneratorUi = {
  input: ['../../../../Solid/MonoRepo/testLit/packages/SolidGeneratorUi/SolidGeneratorUi.ttl'],
  outputDirectory:
    '../../../../Solid/MonoRepo/testLit/packages/SolidGeneratorUi/GeneratedSourceCodeArtifacts/Javascript',
  artifactVersion: VERSION_ARTIFACT_GENERATED,
  litVocabTermVersion: VERSION_LIT_VOCAB_TERM,
  moduleNamePrefix: '@solid/generated-vocab-',
  npmRegistry: NPM_REGISTRY,
  runNpmInstall: RUN_NPM_INSTALL,
  runNpmPublish: RUN_NPM_PUBLISH,
  // runYalcCommand: 'yalc link @lit/vocab-term && yalc publish',
  runWidoco: true,
};

async function deleteDirectory(directory) {
  const deletedPaths = await del([`${directory}/*`], { force: true });
  console.log(`Deleting all files and folders from [${directory}]:`);
  console.log(deletedPaths.join('\n'));
}

async function generateVocabArtifact(argv) {
  await deleteDirectory(argv.outputDirectory);

  const generator = new ArtifactGenerator(
    { ...argv, noprompt: true },
    CommandLine.askForArtifactInfo
  );

  await generator
    .generate()
    .then(CommandLine.askForArtifactToBeNpmVersionBumped)
    // .then(await CommandLine.askForArtifactToBeYalced)
    .then(CommandLine.askForArtifactToBeNpmInstalled)
    .then(CommandLine.askForArtifactToBeNpmPublished)
    .then(CommandLine.askForArtifactToBeDocumented)
    .catch(error => {
      console.log(`Generation process failed: [${error}]`);
      console.error(error);
      throw new Error(error);
    });

  expect(fs.existsSync(`${argv.outputDirectory}/package.json`)).to.be.true;

  if (argv.runNpmInstall) {
    expect(fs.existsSync(`${argv.outputDirectory}/package-lock.json`)).to.be.true;
  }

  if (argv.ranWidoco) {
    expect(fs.existsSync(`${argv.outputDirectory}/Widoco/index-en.html`)).to.be.true;
  }

  console.log(`Generation process successful!\n`);
}

describe('Suite for generating common vocabularies (marked as [skip] to prevent non-manual execution', () => {
  // it('Generate ALL vocabs', async () => {
  it.skip('Generate ALL vocabs', async () => {
    await generateVocabArtifact(GenerationConfigLitCommon);
    await generateVocabArtifact(GenerationConfigSolidComponent);
    await generateVocabArtifact(GenerationConfigSolidGeneratorUi);
  }).timeout(30000);

  // it('LIT COMMON vocabs', async () => {
  it.skip('LIT vocabs', async () => {
    await generateVocabArtifact(GenerationConfigLitCommon);
  }).timeout(20000);

  // it('Solid Generator UI vocab', async () => {
  it.skip('Solid Generator UI vocab', async () => {
    await generateVocabArtifact(GenerationConfigSolidGeneratorUi);
  }).timeout(20000);

  // it('Solid Component vocab', async () => {
  it.skip('Solid Component vocab', async () => {
    await generateVocabArtifact(GenerationConfigSolidComponent);
  }).timeout(20000);

  it.skip('Schema.org vocab (we only want a tiny subset of terms from the thousands defined there)', async () => {
    await generateVocabArtifact({
      input: [''],
      outputDirectory: '../../../../Vocab/Schema.org/GeneratedSourceCodeArtifacts/Javascript',
      artifactVersion: '1.0.0',
      litVocabTermVersion: 'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
      moduleNamePrefix: '@solid/generated-vocab-',
    });
  });

  it.skip('Test Demo App', async () => {
    // it('Test Demo App', async () => {
    await generateVocabArtifact({
      // input: ['../../../../Solid/ReactSdk/testExport/public/vocab/TestExportVocab.ttl'],
      input: ['./example/PetRocks.ttl'],

      // input: ['http://www.w3.org/2006/vcard/ns#'],
      // vocabNameAndPrefixOverride: 'vcard',
      //
      // input: ['http://www.w3.org/2002/07/owl#'],
      // vocabNameAndPrefixOverride: 'owl',

      // input: ['http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
      // vocabNameAndPrefixOverride: 'RDF',

      // input: ['http://dublincore.org/2012/06/14/dcterms.ttl'],
      // vocabNameAndPrefixOverride: 'DCTERMS',

      // input: ['https://www.w3.org/ns/activitystreams#'],
      // vocabNameAndPrefixOverride: 'as',

      outputDirectory: './generated',
      // outputDirectory:
      //   '../../../../Solid/MonoRepo/testLit/packages/Vocab/PetRock/GeneratedSourceCodeArtifacts/Javascript',
      artifactVersion: '1.0.0',
      litVocabTermVersion: VERSION_LIT_VOCAB_TERM,
      moduleNamePrefix: '@lit/generated-vocab-',
      runWidoco: true,
    });
  });
});
