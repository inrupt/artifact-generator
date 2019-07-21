'use strict';

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;

const fs = require('fs');

const del = require('del');

const Generator = require('../src/generator');
const CommandLine = require('../src/command-line');

const doNothingPromise = data => {
  return new Promise((resolve, reject) => {
    resolve(data);
  });
};

describe('Suite for generating common vocabularies (marked as [skip] to prevent non-manual execution', () => {
  it.skip('LIT vocabs', async () => {
    generateVocabArtifact(
      ['SHOULD BE RDF, RDFS, Schema.org, etc.'],
      '../../../../Vocab/LIT/GeneratedSourceCodeArtifacts/Javascript',
      '1.0.0',
      '^1.0.0'
    );
  });

  it.skip('Solid Generator UI vocab', async () => {
    generateVocabArtifact(
      ['../../../../Vocab/SolidGeneratorUi/SolidGeneratorUi.ttl'],
      '../../../../Vocab/SolidGeneratorUi/GeneratedSourceCodeArtifacts/Javascript',
      '1.0.0',
      // '^1.0.11',
      'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
      'solid'
    );
  });

  it.skip('Solid Component vocab', async () => {
    generateVocabArtifact(
      ['../../../../Vocab/SolidComponent/SolidComponent.ttl'],
      '../../../../Vocab/SolidComponent/GeneratedSourceCodeArtifacts/Javascript',
      '1.0.0',
      // '^1.0.11',
      'file:/home/pmcb55/Work/Projects/LIT/src/javascript/lit-vocab-term-js',
      'solid'
    );
  });

  it.skip('Schema.org vocab (we only want a tiny subset of terms from the thousands defined there)', async () => {
    generateVocabArtifact(
      [''],
      '../../../../Vocab/Schema.org/GeneratedSourceCodeArtifacts/Javascript',
      '1.0.0',
      '^1.0.0'
    );
  });
});

async function generateVocabArtifact(
  inputFiles,
  outputDirectory,
  artifactVersion,
  litVersion,
  scope
) {
  await deleteDirectory(outputDirectory);

  const generator = new Generator({
    input: inputFiles,
    outputDirectory: outputDirectory,
    artifactVersion: artifactVersion,
    litVersion: litVersion,
    moduleNamePrefix: `@${scope ? scope : 'lit'}/generated-vocab-`,
  });

  const data = await generator.generate(doNothingPromise);
  expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;

  CommandLine.runNpmInstall(data);
  expect(fs.existsSync(`${outputDirectory}/package-lock.json`)).to.be.true;
}

async function deleteDirectory(outputDirectory) {
  const deletedPaths = await del([`${outputDirectory}/*`], { force: true });
  console.log('Deleted files and folders:\n', deletedPaths.join('\n'));
}
