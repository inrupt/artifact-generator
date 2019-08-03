'use strict';

require('mock-local-storage');

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;
const fs = require('fs');
const del = require('del');

const VocabGenerator = require('../src/generator/VocabGenerator');
const { ARTIFACT_DIRECTORY_JAVASCRIPT } = require('../src/generator/FileGenerator');

describe('Supported Data Type', () => {
  const outputDirectory = `generated`;
  const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_JAVASCRIPT}`;

  it('should test the special-case handling for the OWL vocabulary', async () => {
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator({
      input: ['./test/resources/vocabs/special-case-owl-snippet.ttl'],
      outputDirectory: outputDirectory,
      artifactVersion: '1.0.0',
      moduleNamePrefix: 'lit-generated-vocab-',
      vocabNameAndPrefixOverride: 'owl',

      generatedVocabs: [],
      authorSet: new Set(),
    });

    await generator.generate();

    const indexOutput = fs
      .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/owl.js`)
      .toString();

    expect(indexOutput).to.contain('NAMESPACE = "http://www.w3.org/2002/07/owl#');
    expect(indexOutput).to.contain(
      "AllDifferent: new LitVocabTerm(_NS('AllDifferent'), localStorage, true)"
    );
    expect(indexOutput).to.contain(".addLabel('', `AllDifferent`)");
  });

  it('should be able to generate vocabs for all the supported class data types', async () => {
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator({
      input: ['./test/resources/vocabs/supported-data-types.ttl'],
      outputDirectory: outputDirectory,
      artifactVersion: '1.0.0',
      moduleNamePrefix: 'lit-generated-vocab-',

      generatedVocabs: [],
      authorSet: new Set(),
    });

    await generator.generate();

    const indexOutput = fs
      .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/lit_gen.js`)
      .toString();

    expect(indexOutput).to.contain("class1: new LitVocabTerm(_NS('class1'), localStorage, true)");
    expect(indexOutput).to.contain(".addLabel('', `A rdfs class`)");

    expect(indexOutput).to.contain("class2: new LitVocabTerm(_NS('class2'), localStorage, true)");
    expect(indexOutput).to.contain(".addLabel('', `An owl class`)");

    expect(indexOutput).to.contain("class3: new LitVocabTerm(_NS('class3'), localStorage, true)");
    expect(indexOutput).to.contain(".addLabel('', `A skos concept class`)");

    expect(indexOutput).to.contain("class4: new LitVocabTerm(_NS('class4'), localStorage, true)");
    expect(indexOutput).to.contain(".addLabel('', `A schema payment status type class`)");

    expect(indexOutput).to.not.contains(
      "class5: new LitVocabTerm(_NS('class5'), localStorage, true)"
    );
    expect(indexOutput).to.not.contains(".addLabel('', `Not supported class`)");

    expect(indexOutput).to.contain(
      "property1: new LitVocabTerm(_NS('property1'), localStorage, true)"
    );
    expect(indexOutput).to.contain(".addLabel('', `A rdf property`)");

    expect(indexOutput).to.contain(
      "property2: new LitVocabTerm(_NS('property2'), localStorage, true)"
    );
    expect(indexOutput).to.contain(".addLabel('', `A rdfs data type property`)");

    expect(indexOutput).to.contain(
      "property3: new LitVocabTerm(_NS('property3'), localStorage, true)"
    );
    expect(indexOutput).to.contain(".addLabel('', `An owl object property`)");

    expect(indexOutput).to.contain(
      "property4: new LitVocabTerm(_NS('property4'), localStorage, true)"
    );
    expect(indexOutput).to.contain(".addLabel('', `An owl named individual property`)");

    expect(indexOutput).to.contain(
      "property5: new LitVocabTerm(_NS('property5'), localStorage, true)"
    );
    expect(indexOutput).to.contain(".addLabel('', `An owl annotation property`)");

    expect(indexOutput).to.contain(
      "property6: new LitVocabTerm(_NS('property6'), localStorage, true)"
    );
    expect(indexOutput).to.contain(".addLabel('', `An owl datatype property`)");

    expect(indexOutput).to.not.contains(
      "property7: new LitVocabTerm(_NS('property7'), localStorage, true)"
    );
    expect(indexOutput).to.not.contains(".addLabel('', `Not supported property`)");
    // });
    //
    // it('should be able to generate vocabs for all the supported literal data types', async () => {
    //   var indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();

    expect(indexOutput).to.contain(
      "literal1: new LitVocabTerm(_NS('literal1'), localStorage, true)"
    );
    expect(indexOutput).to.contain(".addLabel('', `A rdfs literal`)");

    expect(indexOutput).to.contain(
      "literal2: new LitVocabTerm(_NS('literal2'), localStorage, true)"
    );
    expect(indexOutput).to.contain(".addMessage('en', `Welcome`)");
    expect(indexOutput).to.contain(".addMessage('es', `Bienvenido`)");
    expect(indexOutput).to.contain(".addMessage('fr', `Bienvenue`)");

    expect(indexOutput).to.not.contains(
      "literal3: new LitVocabTerm(_NS('literal3'), localStorage, true)"
    );
    expect(indexOutput).to.not.contains(".addLabel('', `Not supported literal`)");
  });
});
