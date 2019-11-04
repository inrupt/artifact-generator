require('mock-local-storage');

const fs = require('fs');
const del = require('del');

const ArtifactGenerator = require('./generator/ArtifactGenerator');
const GeneratorConfiguration = require('./config/GeneratorConfiguration');
const { ARTIFACT_DIRECTORY_SOURCE_CODE } = require('./generator/ArtifactGenerator');

const doNothingPromise = data => {
  return new Promise(resolve => {
    resolve(data);
  });
};

describe('End-to-end tests', () => {
  describe('Build node module artifacts', () => {
    it('should fail if no ontology file', async () => {
      const outputDirectory = 'test/generated/End-to-End/no-ontology';
      del.sync([`${outputDirectory}/*`]);
      const errorFilename = './test/resources/vocabs/does.not.exist.ttl';

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: [errorFilename],
          outputDirectory,
          artifactVersion: '1.0.0',
          litVocabTermVersion: '^1.0.10',
          noprompt: true,
        }),
        doNothingPromise
      );

      await expect(artifactGenerator.generate()).rejects.toThrow(
        'Failed to generate',
        errorFilename
      );
    });

    it('should fail if ontology file invalid', async () => {
      const outputDirectory = 'test/generated/End-to-End/invalid-ontology';
      del.sync([`${outputDirectory}/*`]);
      const errorFilename = './test/resources/vocabs/invalid-turtle.ttl';
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: [errorFilename],
          outputDirectory,
          noprompt: true,
        })
      );

      await expect(artifactGenerator.generate()).rejects.toThrow('Failed', 'line 4', errorFilename);
    });

    it('should fail if ontology file has term from different namespace', async () => {
      const outputDirectory = 'test/generated/End-to-End/different-namespace';
      del.sync([`${outputDirectory}/*`]);
      const errorFilename = './test/resources/vocabs/mismatched-namespaces.ttl';

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            _: ['generate'],
            inputResources: [errorFilename],
            outputDirectory,
            noprompt: true,
          },
          doNothingPromise
        )
      );

      // TODO: Not sure the correct syntax to get this working - but should be something like this!
      await expect(artifactGenerator.generate()).rejects.toThrow(
        'sampleTerm',
        'https://inrupt.net/vocab/different-IRI#',
        'https://inrupt.net/vocab/not-matching-preferred-namespace-IRI#',
        errorFilename
      );
    });

    it('should create from an ontology file', async () => {
      const outputDirectory = 'test/generated/End-to-End/create-ontology/';
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            _: ['generate'],
            inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
            outputDirectory,
            artifactVersion: '1.0.0',
            litVocabTermVersion: '^1.0.10',
            moduleNamePrefix: 'lit-generated-vocab-',
            noprompt: true,
          },
          doNothingPromise
        )
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavascript}/index.js`)).toBe(true);
      expect(fs.readFileSync(`${outputDirectoryJavascript}/index.js`).toString()).toBe(
        fs.readFileSync('test/resources/expectedOutputs/single/index.js').toString()
      );

      // Generated code contains timestamnp (which will change every time we generate!), so skip the first comment.
      const output = fs
        .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/SCHEMA.js`)
        .toString();
      const expected = fs
        .readFileSync('test/resources/expectedOutputs/single/GeneratedVocab/SCHEMA.js')
        .toString();
      expect(output.substring(output.indexOf(' */'))).toBe(
        expected.substring(expected.indexOf(' */'))
      );

      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).toBe(true);
      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).toBe(
        fs.readFileSync('test/resources/expectedOutputs/single/package.json').toString()
      );
    });

    it('should create from an ontology link', async () => {
      const outputDirectory = 'test/generated/End-to-End/create-ontology-link/';
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
          outputDirectory,
          artifactVersion: '1.0.0',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        })
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavascript}/GeneratedVocab/SCHEMA.js`)).toBe(true);
      expect(
        fs.readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/SCHEMA.js`).toString()
      ).toEqual(
        expect.stringContaining("Person: new LitVocabTerm(_NS('Person'), localStorage, true)")
      );

      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).toBe(true);
      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).toEqual(
        expect.stringContaining('"name": "@lit/generated-vocab-schema"')
      );
    });

    it('should be able to fully extend an ontology with multiple input files', async () => {
      const outputDirectory = 'test/generated/End-to-End/multiple-inputs/';
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: [
            './test/resources/vocabs/schema-snippet.ttl',
            './test/resources/vocabs/schema-inrupt-ext.ttl',
          ],
          outputDirectory,
          artifactVersion: '1.0.0',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: 'lit-generated-vocab-',
          noprompt: true,
        })
      );

      await artifactGenerator.generate();

      // Generated code contains timestamp (which will change every time we generate!), so skip the first comment.
      const output = fs
        .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`)
        .toString();

      const expected = fs
        .readFileSync('test/resources/expectedOutputs/full-ext/GeneratedVocab/SCHEMA_INRUPT_EXT.js')
        .toString();

      expect(output.substring(output.indexOf(' */'))).toBe(
        expected.substring(expected.indexOf(' */'))
      );

      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).toBe(true);
      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).toBe(
        fs.readFileSync('test/resources/expectedOutputs/full-ext/package.json').toString()
      );
    });

    it('should be able to fully extend an ontology with multiple input files and URL links', async () => {
      const outputDirectory = 'test/generated/End-to-End/multiple-urls/';
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: [
            'https://schema.org/Person.ttl',
            './test/resources/vocabs/schema-inrupt-ext.ttl',
          ],
          outputDirectory,
          artifactVersion: '1.0.0',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        })
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavascript}/index.js`)).toBe(true);

      const indexOutput = fs
        .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`)
        .toString();

      expect(indexOutput).toEqual(
        expect.stringContaining("Person: new LitVocabTerm(_NS('Person')")
      );
      expect(indexOutput).toEqual(
        expect.stringContaining("address: new LitVocabTerm(_NS('address')")
      );
      expect(indexOutput).toEqual(
        expect.stringContaining("additionalName: new LitVocabTerm(_NS('additionalName')")
      );
      expect(indexOutput).toEqual(expect.stringContaining(".addLabel('es', `Nombre adicional`)"));
    });

    it('should be able to extend an ontology but only creates triples from extension file', async () => {
      const outputDirectory = 'test/generated/End-to-End/extension-file/';
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
          outputDirectory,
          vocabTermsFrom: './test/resources/vocabs/schema-inrupt-ext.ttl',
          artifactVersion: '1.0.0',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        })
      );

      await artifactGenerator.generate();

      const indexOutput = fs
        .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/SCHEMA_INRUPT_EXT.js`)
        .toString();

      expect(indexOutput).toEqual(
        expect.stringContaining("Person: new LitVocabTerm(_NS('Person')")
      );
      expect(indexOutput).toEqual(expect.stringContaining(".addLabel('fr', `La personne`)"));

      expect(indexOutput).toEqual(expect.stringContaining('additionalName: new LitVocabTerm'));
      expect(indexOutput).toEqual(expect.stringContaining('familyName: new LitVocabTerm'));
      expect(indexOutput).toEqual(expect.stringContaining('givenName: new LitVocabTerm'));
      expect(indexOutput).toEqual(expect.stringContaining(".addLabel('es', `Nombre de pila`)"));
      expect(indexOutput).toEqual(expect.stringContaining(".addLabel('it', `Nome di battesimo`)"));

      expect(indexOutput).toEqual(expect.not.stringContaining('address: new LitVocabTerm'));
    });

    it('should be able to extend an ontology but only create triples from extension URL links', async () => {
      const outputDirectory = 'test/generated/End-to-End/extension-urls/';
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
          outputDirectory,
          vocabTermsFrom: 'https://jholleran.inrupt.net/public/vocabs/schema-inrupt-ext.ttl',
          artifactVersion: '1.0.0',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        })
      );

      await artifactGenerator.generate();

      const indexOutput = fs
        .readFileSync(`${outputDirectoryJavascript}/GeneratedVocab/SCHEMA.js`)
        .toString();

      expect(indexOutput).toEqual(
        expect.stringContaining("Person: new LitVocabTerm(_NS('Person')")
      );
      expect(indexOutput).toEqual(expect.stringContaining(".addLabel('fr', `La personne`)"));

      expect(indexOutput).toEqual(expect.stringContaining('additionalName: new LitVocabTerm'));
      expect(indexOutput).toEqual(expect.stringContaining('familyName: new LitVocabTerm'));
      expect(indexOutput).toEqual(expect.stringContaining('givenName: new LitVocabTerm'));
      expect(indexOutput).toEqual(expect.stringContaining(".addLabel('es', `Nombre de pila`)"));
      expect(indexOutput).toEqual(expect.stringContaining(".addLabel('it', `Nome di battesimo`)"));

      expect(indexOutput).toEqual(expect.not.stringContaining('address: new LitVocabTerm'));
    });

    it('should take in a version for the output module', async () => {
      const outputDirectory = 'test/generated/End-to-End/module-version/';
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
          outputDirectory,
          vocabTermsFrom: './test/resources/vocabs/schema-inrupt-ext.ttl',
          artifactVersion: '1.0.5',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        })
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).toBe(true);
      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).toEqual(
        expect.stringContaining('"version": "1.0.5"')
      );
    });

    it('should handle creating generated folder if it does not exist already', async () => {
      const outputDirectory = 'test/generated/End-to-End/dest-folder-not-exist/';
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
      del.sync([`${outputDirectory}/*`]);

      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
          outputDirectory,
          artifactVersion: '1.0.5',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        })
      );

      await artifactGenerator.generate();

      expect(fs.existsSync(`${outputDirectoryJavascript}/index.js`)).toBe(true);
      expect(fs.existsSync(`${outputDirectoryJavascript}/package.json`)).toBe(true);
    });

    it('module names should by default start with @lit/generated-vocab-*', async () => {
      const outputDirectory = 'test/generated/End-to-End/module-default-name/';
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
      del.sync([`${outputDirectory}/*`]);
      let artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
          outputDirectory,
          artifactVersion: '1.0.5',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        })
      );

      await artifactGenerator.generate();

      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).toEqual(
        expect.stringContaining('"name": "@lit/generated-vocab-schema",')
      );

      artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: ['./test/resources/vocabs/schema-inrupt-ext.ttl'],
          outputDirectory,
          artifactVersion: '1.0.5',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        })
      );

      await artifactGenerator.generate();

      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).toEqual(
        expect.stringContaining('"name": "@lit/generated-vocab-schema-inrupt-ext",')
      );
    });

    it('should add a description inside the package.json', async () => {
      const outputDirectory = 'test/generated/End-to-End/package-description/';
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
          outputDirectory,
          vocabTermsFrom: './test/resources/vocabs/schema-inrupt-ext.ttl',
          artifactVersion: '1.0.5',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        })
      );

      await artifactGenerator.generate();

      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).toEqual(
        expect.stringContaining(
          '"description": "Bundle of vocabularies that includes the following:\\n\\n  schema-inrupt-ext: Extension to Schema.org terms'
        )
      );
    });

    it('should add authors inside the package.json', async () => {
      const outputDirectory = 'test/generated/End-to-End/authors-in-package/';
      const outputDirectoryJavascript = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Javascript`;
      del.sync([`${outputDirectory}/*`]);
      const artifactGenerator = new ArtifactGenerator(
        new GeneratorConfiguration({
          _: ['generate'],
          inputResources: ['./test/resources/vocabs/schema-snippet.ttl'],
          outputDirectory,
          vocabTermsFrom: './test/resources/vocabs/schema-inrupt-ext.ttl',
          artifactVersion: '1.0.5',
          litVocabTermVersion: '^1.0.10',
          moduleNamePrefix: '@lit/generated-vocab-',
          noprompt: true,
        })
      );

      await artifactGenerator.generate();

      expect(fs.readFileSync(`${outputDirectoryJavascript}/package.json`).toString()).toEqual(
        expect.stringContaining('"author": "Vocabularies authored by: Jarlath Holleran.')
      );
    });
  });
});
