require('mock-local-storage');

const chai = require('chai');
chai.use(require('chai-string'));

const { expect } = chai;

const fs = require('fs');

const del = require('del');

const Generator = require('../src/generator');
const CommandLine = require('../src/command-line');

async function deleteDirectory(directory) {
  const deletedPaths = await del([`${directory}/*`], { force: true });
  console.log('Deleted all there files and folders:\n', deletedPaths.join('\n'));
}

async function generateVocabArtifact(argv) {
  await deleteDirectory(argv.outputDirectory);

  const generator = new Generator({ ...argv, noprompt: true });

  await generator
    .generate(CommandLine.askForArtifactInfo)
    .then(CommandLine.askForArtifactVersionBumpType)
    .then(CommandLine.askForArtifactToBeInstalled)
    .then(CommandLine.askForArtifactToBePublished)
    .then(CommandLine.askForArtifactToBeDocumented)
    .then(console.log(`Generation process successful!`))
    .catch(error => {
      console.log(`Generation process failed: [${error}]`);
      console.error(error);
      throw new Error(error);
    });

  expect(fs.existsSync(`${argv.outputDirectory}/package.json`)).to.be.true;

  if (argv.install) {
    expect(fs.existsSync(`${argv.outputDirectory}/package-lock.json`)).to.be.true;
  }
}

describe('Suite for generating common vocabularies (marked as [skip] to prevent non-manual execution', () => {
  it.skip('LIT vocabs - WE DO NOT YET SUPPORT MULTIPLE VOCABS IN THIS JAVASCRIPT CODEBASE', async () => {
    generateVocabArtifact(
      ['SHOULD BE RDF, RDFS, Schema.org, etc.'],
      '../../../../Vocab/LIT/Common/GeneratedSourceCodeArtifacts/Javascript',
      '1.0.0',
      '^1.0.0'
    );
  });

  it.skip('Test Demo App', async () => {
    generateVocabArtifact({
      input: ['../../../../Solid/ReactSdk/testExport/public/vocab/TestExportVocab.ttl'],
      outputDirectory: './generated',
      artifactVersion: '1.0.0',
      litVocabTermVersion: 'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
      moduleNamePrefix: '@lit/generated-vocab-',
    });
  });

  it.skip('Solid Generator UI vocab', async () => {
    generateVocabArtifact({
      input: ['../../../../Vocab/SolidGeneratorUi/SolidGeneratorUi.ttl'],
      outputDirectory: '../../../../Vocab/SolidGeneratorUi/GeneratedSourceCodeArtifacts/Javascript',
      artifactVersion: '1.0.0',
      litVocabTermVersion: 'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
      // litVocabTermVersion: '^1.0.11',
      moduleNamePrefix: '@solid/generated-vocab-',
      install: true,
      widoco: true,
    });
  });

  it.skip('Solid Component vocab', async () => {
    generateVocabArtifact({
      input: ['../../../../Vocab/SolidComponent/SolidComponent.ttl'],
      outputDirectory: '../../../../Vocab/SolidComponent/GeneratedSourceCodeArtifacts/Javascript',
      artifactVersion: '1.0.0',
      // litVocabTermVersion: 'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
      litVocabTermVersion: '^1.0.11',
      moduleNamePrefix: '@solid/generated-vocab-',
      install: true,
      widoco: true,
    });
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
