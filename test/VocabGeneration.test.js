require('mock-local-storage');

const chai = require('chai');
chai.use(require('chai-string'));

const { expect } = chai;

const fs = require('fs');

const del = require('del');

const ArtifactGenerator = require('../src/generator/ArtifactGenerator');
const CommandLine = require('../src/CommandLine');

const GenerationConfigLitCommon = {
  vocabListFile: '../../../vocab/Vocab-List-LIT-Common.yml',
  outputDirectory: '../../../../Vocab/LIT/Common/GeneratedSourceCodeArtifacts/Javascript',
  artifactVersion: '1.0.0',
  // litVocabTermVersion: 'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
  litVocabTermVersion: '^1.0.13',
  moduleNamePrefix: '@lit/generated-vocab-',
  artifactName: 'lit-common',
  install: true,
  // runYalcCommand: 'yalc link @lit/vocab-term && yalc publish',
  runWidoco: false,
};

const GenerationConfigSolidComponent = {
  input: ['../../../../Vocab/SolidComponent/SolidComponent.ttl'],
  outputDirectory: '../../../../Vocab/SolidComponent/GeneratedSourceCodeArtifacts/Javascript',
  artifactVersion: '1.0.0',
  // litVocabTermVersion: 'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
  litVocabTermVersion: '^1.0.13',
  moduleNamePrefix: '@solid/generated-vocab-',
  install: true,
  // runYalcCommand: 'yalc link @lit/vocab-term && yalc publish',
  runWidoco: true,
};

const GenerationConfigSolidGeneratorUi = {
  input: ['../../../../Vocab/SolidGeneratorUi/SolidGeneratorUi.ttl'],
  outputDirectory: '../../../../Vocab/SolidGeneratorUi/GeneratedSourceCodeArtifacts/Javascript',
  artifactVersion: '1.0.0',
  // litVocabTermVersion: 'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
  litVocabTermVersion: '^1.0.13',
  moduleNamePrefix: '@solid/generated-vocab-',
  install: true,
  // runYalcCommand: 'yalc link @lit/vocab-term && yalc publish',
  runWidoco: true,
};

async function deleteDirectory(directory) {
  const deletedPaths = await del([`${directory}/*`], { force: true });
  console.log('Deleted all files and folders:\n', deletedPaths.join('\n'));
}

async function generateVocabArtifact(argv) {
  await deleteDirectory(argv.outputDirectory);

  const generator = new ArtifactGenerator(
    { ...argv, noprompt: true },
    CommandLine.askForArtifactInfo
  );

  await generator
    .generate()
    .then(await CommandLine.askForArtifactToBeNpmVersionBumped)
    // .then(await CommandLine.askForArtifactToBeYalced)
    .then(await CommandLine.askForArtifactToBeNpmInstalled)
    .then(await CommandLine.askForArtifactToBeNpmPublished)
    .then(await CommandLine.askForArtifactToBeDocumented)
    .catch(error => {
      console.log(`Generation process failed: [${error}]`);
      console.error(error);
      throw new Error(error);
    });

  expect(fs.existsSync(`${argv.outputDirectory}/package.json`)).to.be.true;

  if (argv.install) {
    expect(fs.existsSync(`${argv.outputDirectory}/package-lock.json`)).to.be.true;
  }

  console.log(`Generation process successful!\n`);
}

describe('Suite for generating common vocabularies (marked as [skip] to prevent non-manual execution', () => {
  it.skip('Test Demo App', async () => {
    generateVocabArtifact({
      input: ['../../../../Solid/ReactSdk/testExport/public/vocab/TestExportVocab.ttl'],
      outputDirectory: './generated',
      artifactVersion: '1.0.0',
      litVocabTermVersion: 'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
      moduleNamePrefix: '@lit/generated-vocab-',
    });
  });

  // it('Generate ALL vocabs', async () => {
  it.skip('Generate ALL vocabs', async () => {
    await generateVocabArtifact(GenerationConfigLitCommon);
    await generateVocabArtifact(GenerationConfigSolidComponent);
    await generateVocabArtifact(GenerationConfigSolidGeneratorUi);
  }).timeout(30000);

  // it('LIT COMMON vocabs', async () => {
  it.skip('LIT vocabs', async () => {
    await generateVocabArtifact(GenerationConfigLitCommon);
  });

  // it('Solid Generator UI vocab', async () => {
  it.skip('Solid Generator UI vocab', async () => {
    await generateVocabArtifact(GenerationConfigSolidGeneratorUi);
  });

  // it('Solid Component vocab', async () => {
  it.skip('Solid Component vocab', async () => {
    await generateVocabArtifact(GenerationConfigSolidComponent);
  });

  it.skip('Schema.org vocab (we only want a tiny subset of terms from the thousands defined there)', async () => {
    generateVocabArtifact({
      input: [''],
      outputDirectory: '../../../../Vocab/Schema.org/GeneratedSourceCodeArtifacts/Javascript',
      artifactVersion: '1.0.0',
      litVocabTermVersion: 'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
      moduleNamePrefix: '@solid/generated-vocab-',
    });
  });
});
