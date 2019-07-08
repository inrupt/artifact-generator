'use strict';

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;

const fs = require('fs');

const del = require('del');

const Generator = require('../src/generator');

describe('Suite for generating common vocabularies (marked as [skip] to prevent non-manual execution', () => {
  it.skip('Solid Generator UI vocab', async () => {
    generateVocabArtifact(
      ['../../../../Vocab/SolidGeneratorUi/SolidGeneratorUi.ttl'],
      '../../../../Vocab/SolidGeneratorUi/GeneratedSourceCodeArtifacts/Javascript'
    );
  });
});

async function generateVocabArtifact(inputFiles, outputDirectory) {
  await deleteDirectory(outputDirectory);

  const generator = new Generator({
    input: inputFiles,
    outputDirectory: outputDirectory,
    artifactVersion: '1.0.0',
  });

  const result = await generator.generate();
  expect(result).to.equal('Done!');
  expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
}

async function deleteDirectory(outputDirectory) {
  const deletedPaths = await del([`${outputDirectory}/*`], { force: true });
  console.log('Deleted files and folders:\n', deletedPaths.join('\n'));
}
