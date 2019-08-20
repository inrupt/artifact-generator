require('mock-local-storage');

const fs = require('fs');
const del = require('del');

const VocabGenerator = require('./generator/VocabGenerator');
const { ARTIFACT_DIRECTORY_SOURCE_CODE } = require('./generator/ArtifactGenerator');

describe('Supported Data Type', () => {
  it('should test the special-case handling for the OWL vocabulary', async () => {
    const outputDirectory = 'test/generated/SupportedDataType/owl-test';
    const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        inputResources: ['./test/resources/vocabs/special-case-owl-snippet.ttl'],
        outputDirectory,
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavascript,
        artifactVersion: '1.0.0',
        moduleNamePrefix: 'lit-generated-vocab-',
        nameAndPrefixOverride: 'owl',

        generatedVocabs: [],
        authorSet: new Set(),
      },
      {
        programmingLanguage: 'Javascript',
        artifactFolderName: 'Javascript',
        handlebarsTemplate: 'javascript-rdf-ext.hbs',
        sourceFileExtension: 'js',
      }
    );

    await generator.generate();

    const indexOutput = fs
      .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/OWL.js`)
      .toString();

    expect(indexOutput).toEqual(
      expect.stringContaining('NAMESPACE = "http://www.w3.org/2002/07/owl#')
    );

    expect(indexOutput).toEqual(
      expect.stringContaining(
        "AllDifferent: new LitVocabTerm(_NS('AllDifferent'), localStorage, true)"
      )
    );

    expect(indexOutput).toEqual(expect.stringContaining(".addLabel('', `AllDifferent`)"));
  });

  it('should test the special-case handling for the HTTP vocabulary', async () => {
    const outputDirectory = 'test/generated/SupportedDataType/http-test';
    const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        inputResources: ['./test/resources/vocabs/special-case-http-snippet.ttl'],
        outputDirectory,
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavascript,
        artifactVersion: '1.0.0',
        moduleNamePrefix: 'lit-generated-vocab-',
        nameAndPrefixOverride: 'http',

        generatedVocabs: [],
        authorSet: new Set(),
      },
      {
        programmingLanguage: 'Javascript',
        artifactFolderName: 'Javascript',
        handlebarsTemplate: 'javascript-rdf-ext.hbs',
        sourceFileExtension: 'js',
      }
    );

    await generator.generate();

    const indexOutput = fs
      .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/HTTP.js`)
      .toString();

    expect(indexOutput).toEqual(
      expect.stringContaining('NAMESPACE = "http://www.w3.org/2011/http#')
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("Connection: new LitVocabTerm(_NS('Connection'), localStorage, true)")
    );

    expect(indexOutput).toEqual(expect.stringContaining(".addLabel('en', `Connection`)"));
  });

  it('should be able to generate vocabs for all the supported class data types', async () => {
    const outputDirectory = 'test/generated/SupportedDataType/data-types';
    const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
    await del([`${outputDirectory}/*`]);

    const generator = new VocabGenerator(
      {
        inputResources: ['./test/resources/vocabs/supported-data-types.ttl'],
        outputDirectory,
        // We need to provide the artifact-specific output directory.
        outputDirectoryForArtifact: outputDirectoryJavascript,
        artifactVersion: '1.0.0',
        moduleNamePrefix: 'lit-generated-vocab-',

        generatedVocabs: [],
        authorSet: new Set(),
      },
      {
        programmingLanguage: 'Javascript',
        artifactFolderName: 'Javascript',
        handlebarsTemplate: 'javascript-rdf-ext.hbs',
        sourceFileExtension: 'js',
      }
    );

    await generator.generate();

    const indexOutput = fs
      .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/LIT_GEN.js`)
      .toString();

    expect(indexOutput).toEqual(
      expect.stringContaining("class1: new LitVocabTerm(_NS('class1'), localStorage, true)")
    );
    expect(indexOutput).toEqual(expect.stringContaining(".addLabel('', `A rdfs class`)"));

    expect(indexOutput).toEqual(
      expect.stringContaining("class2: new LitVocabTerm(_NS('class2'), localStorage, true)")
    );
    expect(indexOutput).toEqual(expect.stringContaining(".addLabel('', `An owl class`)"));

    expect(indexOutput).toEqual(
      expect.stringContaining("class3: new LitVocabTerm(_NS('class3'), localStorage, true)")
    );
    expect(indexOutput).toEqual(expect.stringContaining(".addLabel('', `A skos concept class`)"));

    expect(indexOutput).toEqual(
      expect.stringContaining("class4: new LitVocabTerm(_NS('class4'), localStorage, true)")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabel('', `A schema payment status type class`)")
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining("class5: new LitVocabTerm(_NS('class5'), localStorage, true)")
    );
    expect(indexOutput).toEqual(
      expect.not.stringContaining(".addLabel('', `Not supported class`)")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property1: new LitVocabTerm(_NS('property1'), localStorage, true)")
    );
    expect(indexOutput).toEqual(expect.stringContaining(".addLabel('', `A rdf property`)"));

    expect(indexOutput).toEqual(
      expect.stringContaining("property2: new LitVocabTerm(_NS('property2'), localStorage, true)")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabel('', `A rdfs data type property`)")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property3: new LitVocabTerm(_NS('property3'), localStorage, true)")
    );
    expect(indexOutput).toEqual(expect.stringContaining(".addLabel('', `An owl object property`)"));

    expect(indexOutput).toEqual(
      expect.stringContaining("property4: new LitVocabTerm(_NS('property4'), localStorage, true)")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabel('', `An owl named individual property`)")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property5: new LitVocabTerm(_NS('property5'), localStorage, true)")
    );
    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabel('', `An owl annotation property`)")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining("property6: new LitVocabTerm(_NS('property6'), localStorage, true)")
    );

    expect(indexOutput).toEqual(
      expect.stringContaining(".addLabel('', `An owl datatype property`)")
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining(
        "property7: new LitVocabTerm(_NS('property7'), localStorage, true)"
      )
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining(".addLabel('', `Not supported property`)")
    );
    // });
    //
    // it('should be able to generate vocabs for all the supported literal data types', async () => {
    //   var indexOutput = fs.readFileSync(`${outputDirectory}/index.js`).toString();

    expect(indexOutput).toEqual(
      expect.stringContaining("literal1: new LitVocabTerm(_NS('literal1'), localStorage, true)")
    );

    expect(indexOutput).toEqual(expect.stringContaining(".addLabel('', `A rdfs literal`)"));

    expect(indexOutput).toEqual(
      expect.stringContaining("literal2: new LitVocabTerm(_NS('literal2'), localStorage, true)")
    );

    expect(indexOutput).toEqual(expect.stringContaining(".addMessage('en', `Welcome`)"));
    expect(indexOutput).toEqual(expect.stringContaining(".addMessage('es', `Bienvenido`)"));
    expect(indexOutput).toEqual(expect.stringContaining(".addMessage('fr', `Bienvenue`)"));

    expect(indexOutput).toEqual(
      expect.not.stringContaining("literal3: new LitVocabTerm(_NS('literal3'), localStorage, true)")
    );

    expect(indexOutput).toEqual(
      expect.not.stringContaining(".addLabel('', `Not supported literal`)")
    );
  });
});
