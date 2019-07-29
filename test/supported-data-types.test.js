'use strict';

require('mock-local-storage');

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;

const fs = require('fs');

const del = require('del');

const Generator = require('../src/generator');

const doNothingPromise = data => {
  return new Promise((resolve, reject) => {
    resolve(data);
  });
};

describe('Supported Data Type', () => {
  const outputDirectory = 'generated';

  beforeEach(async () => {
    const deletedPaths = await del([`${outputDirectory}/*`]);
    console.log('Deleted files and folders:\n', deletedPaths.join('\n'));

    const generator = new Generator({
      input: ['./test/vocabs/supported-data-types.ttl'],
      outputDirectory: outputDirectory,
      artifactVersion: '1.0.0',
      moduleNamePrefix: 'lit-generated-vocab-',
    });

    await generator.generate(doNothingPromise);
  });

  it('should be able to generate vocabs for all the supported class data types', async () => {
    var indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();

    expect(indexOutput).to.contains("class1: new LitVocabTerm(_NS('class1'), localStorage, true)");
    expect(indexOutput).to.contains(".addLabel('', `A rdfs class`)");

    expect(indexOutput).to.contains("class2: new LitVocabTerm(_NS('class2'), localStorage, true)");
    expect(indexOutput).to.contains(".addLabel('', `An owl class`)");

    expect(indexOutput).to.contains("class3: new LitVocabTerm(_NS('class3'), localStorage, true)");
    expect(indexOutput).to.contains(".addLabel('', `A skos concept class`)");

    expect(indexOutput).to.contains("class4: new LitVocabTerm(_NS('class4'), localStorage, true)");
    expect(indexOutput).to.contains(".addLabel('', `A schema payment status type class`)");

    expect(indexOutput).to.not.contains(
      "class5: new LitVocabTerm(_NS('class5'), localStorage, true)"
    );
    expect(indexOutput).to.not.contains(".addLabel('', `Not supported class`)");
  });

  it('should be able to generate vocabs for all the supported property data types', () => {
    var indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();

    expect(indexOutput).to.contains(
      "property1: new LitVocabTerm(_NS('property1'), localStorage, true)"
    );
    expect(indexOutput).to.contains(".addLabel('', `A rdf property`)");

    expect(indexOutput).to.contains(
      "property2: new LitVocabTerm(_NS('property2'), localStorage, true)"
    );
    expect(indexOutput).to.contains(".addLabel('', `A rdfs data type property`)");

    expect(indexOutput).to.contains(
      "property3: new LitVocabTerm(_NS('property3'), localStorage, true)"
    );
    expect(indexOutput).to.contains(".addLabel('', `An owl object property`)");

    expect(indexOutput).to.contains(
      "property4: new LitVocabTerm(_NS('property4'), localStorage, true)"
    );
    expect(indexOutput).to.contains(".addLabel('', `An owl named individual property`)");

    expect(indexOutput).to.contains(
      "property5: new LitVocabTerm(_NS('property5'), localStorage, true)"
    );
    expect(indexOutput).to.contains(".addLabel('', `An owl annotation property`)");

    expect(indexOutput).to.contains(
      "property6: new LitVocabTerm(_NS('property6'), localStorage, true)"
    );
    expect(indexOutput).to.contains(".addLabel('', `An owl datatype property`)");

    expect(indexOutput).to.not.contains(
      "property7: new LitVocabTerm(_NS('property7'), localStorage, true)"
    );
    expect(indexOutput).to.not.contains(".addLabel('', `Not supported property`)");
  });

  it('should be able to generate vocabs for all the supported literal data types', async () => {
    var indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();

    expect(indexOutput).to.contains(
      "literal1: new LitVocabTerm(_NS('literal1'), localStorage, true)"
    );
    expect(indexOutput).to.contains(".addLabel('', `A rdfs literal`)");

    expect(indexOutput).to.contains(
      "literal2: new LitVocabTerm(_NS('literal2'), localStorage, true)"
    );
    expect(indexOutput).to.contains(".addMessage('en', `Welcome`)");
    expect(indexOutput).to.contains(".addMessage('es', `Bienvenido`)");
    expect(indexOutput).to.contains(".addMessage('fr', `Bienvenue`)");

    expect(indexOutput).to.not.contains(
      "literal3: new LitVocabTerm(_NS('literal3'), localStorage, true)"
    );
    expect(indexOutput).to.not.contains(".addLabel('', `Not supported literal`)");
  });
});
