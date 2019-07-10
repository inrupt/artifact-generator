'use strict';

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;

const fs = require('fs');

const del = require('del');

const Generator = require('../src/generator');


const { execSync } = require('child_process');


describe('Ontology Generator', () => {
  const outputDirectory = 'generated';

  beforeEach(() => {
    (async () => {
      const deletedPaths = await del([`${outputDirectory}/*`]);
      console.log('Deleted files and folders:\n', deletedPaths.join('\n'));
    })();
  });

  describe('Builds node modules artifacts', () => {


    it('should create artifacts from a single ontology file', async () => {


      const generator = new Generator({
        input: ['./test/vocabs/schema.ttl'],
        outputDirectory: outputDirectory,
        artifactVersion: '1.0.0',
        moduleNamePrefix: 'lit-generated-vocab-',
      });

      await generator.generate(doNothingPromise);

      execSync(`cd .. && node index.js --input ./test/vocabs/schema.ttl`)


      expect(fs.existsSync(`${outputDirectory}/index.ts`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/index.ts`).toString()).to.equal(
        fs.readFileSync('test/expected/single/index.ts').toString()
      );

      expect(fs.existsSync(`${outputDirectory}/package.json`)).to.be.true;
      expect(fs.readFileSync(`${outputDirectory}/package.json`).toString()).to.equal(
        fs.readFileSync('test/expected/single/package.json').toString()
      );
    });
  });
});
