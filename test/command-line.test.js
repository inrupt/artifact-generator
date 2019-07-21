'use strict';

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;
const sinon = require('sinon');

const inquirer = require('inquirer');

const childProcess = require('child_process');

const CommandLine = require('../src/command-line');

const defaultInputs = {
  artifactName: '@lit/generator-vocab-schema-ext',
  author: 'lit@inrupt.com',
  npmRegistry: 'http://localhost:4873/',
};

describe('Command Line unit tests', () => {
  beforeEach(() => {});

  afterEach(() => {
    // Restore the default sandbox here
    sinon.restore();
  });

  describe('Requesting input from the user', () => {
    it('Should not ask for artifact information if explicitly told not to', async () => {
      const result = await CommandLine.askForArtifactInfo({ ...defaultInputs, noprompt: true });

      expect(result.artifactName).to.equal('@lit/generator-vocab-schema-ext');
      expect(result.author).to.equal('lit@inrupt.com');
    });

    it('Should ask for artifact name', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { artifactName: 'lit-gen-schema-ext', author: 'inrupt' };
      });

      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '1.1.10';
      });

      const result = await CommandLine.askForArtifactInfo(defaultInputs);

      expect(result.artifactName).to.equal('lit-gen-schema-ext');
      expect(result.author).to.equal('inrupt');
    });

    it('Should ask for artifact module name prefix, and override provided value', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { artifactName: 'test-prefix-' };
      });

      const result = await CommandLine.askForArtifactInfo({
        ...defaultInputs,
        moduleNamePrefix: 'override-this-prefix-',
      });

      expect(result.artifactName).to.equal('test-prefix-');
    });

    it('Should ask for LIT Vocab Term version, and override provided value', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { litVocabTermVersion: '^1.2.3' };
      });

      const result = await CommandLine.askForArtifactInfo({
        ...defaultInputs,
        litVocabTermVersion: '0.0.0',
      });

      expect(result.litVocabTermVersion).to.equal('^1.2.3');
    });

    it('Should ask for artifact author information if none provided', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { author: 'test-inrupt' };
      });

      const result = await CommandLine.askForArtifactInfo(delete defaultInputs.author);

      expect(result.author).to.equal('test-inrupt');
    });
  });

  describe('NPM publishing...', () => {
    it('Should find the latest published artifact from registry', () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '1.1.10';
      });

      const result = CommandLine.findPublishedVersionOfModule({ ...defaultInputs, publish: true });

      expect(result.publishedVersion).to.equal('1.1.10');
      expect(result.version).to.equal('1.1.10');
    });

    it('Should not add to the result if artifact has not been published to the registry', () => {
      sinon.stub(childProcess, 'execSync').throws();

      const result = CommandLine.findPublishedVersionOfModule({ ...defaultInputs, publish: true });

      expect(result.publishedVersion).to.equal(undefined);
      expect(result.version).to.equal(undefined);
    });
    it('Should publish artifact to the registry if user confirms yes', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { publish: true };
      });

      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBePublished(defaultInputs);

      expect(result.publish).to.equal(true);
    });

    it('Should publish artifact to the registry if given explicit inputs', async () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBePublished({
        ...defaultInputs,
        publish: true,
      });

      expect(result.publish).to.equal(true);
      expect(result.ranNpmPublish).to.equal(true);
    });

    it('Should not publish artifact to the registry if user confirms no', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { publish: false };
      });

      sinon
        .mock(childProcess)
        .expects('execSync')
        .never();

      const result = await CommandLine.askForArtifactToBePublished(defaultInputs);

      expect(result.publish).to.equal(false);
    });

    it('Should not publish artifact if user did not specify publish, and also set no prompting', async () => {
      const result = await CommandLine.askForArtifactToBePublished({
        ...defaultInputs,
        noprompt: true,
      });

      expect(result.ranNpmPublish).to.equal(undefined);
    });
  });

  describe('NPM version bumping...', () => {
    it('Should run npm version', () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = CommandLine.runNpmVersion(defaultInputs);

      expect(result.ranNpmVersion).to.be.true;
    });

    it('Should bump artifact version if explicitly told to', async () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '1.2.10';
      });

      const result = await CommandLine.askForArtifactVersionBumpType({
        ...defaultInputs,
        publishedVersion: '1.1.10',
        bumpVersion: 'minor',
      });

      expect(result.publishedVersion).to.equal('1.1.10');
      expect(result.bumpVersion).to.equal('minor');
      expect(result.bumpedVersion).to.equal('1.2.10');
      expect(result.ranNpmVersion).to.equal(true);
    });

    it('Should ask for the artifact version bump type (major, minor, patch)', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { bumpVersion: 'patch' };
      });

      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactVersionBumpType({
        ...defaultInputs,
        publishedVersion: '1.1.10',
      });

      expect(result.bumpVersion).to.equal('patch');
      expect(result.ranNpmVersion).to.equal(true);
    });

    it('Should not run update version command if the user answers "no" when ask for the artifact version bump type', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { bump: 'no' };
      });

      sinon
        .mock(childProcess)
        .expects('execSync')
        .never();

      defaultInputs.publishedVersion = '1.1.10';

      const result = await CommandLine.askForArtifactVersionBumpType(defaultInputs);

      expect(result.bump).to.equal('no');
    });

    it('Should not prompt for artifact version bump type if the module has not been published', async () => {
      sinon
        .mock(inquirer)
        .expects('prompt')
        .never();

      sinon
        .mock(childProcess)
        .expects('execSync')
        .never();

      defaultInputs.publishedVersion = undefined;

      const result = await CommandLine.askForArtifactVersionBumpType(defaultInputs);

      expect(result.publishedVersion).to.equal(undefined);
    });
  });

  describe('NPM installing...', () => {
    it('Should run npm install', () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = CommandLine.runNpmInstall(defaultInputs);

      expect(result.ranNpmInstall).to.be.true;
    });

    it('Should install artifact if user explicitly told to', async () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBeInstalled({
        ...defaultInputs,
        install: true,
      });

      expect(result.ranNpmInstall).to.equal(true);
    });

    it('Should install artifact if user confirms yes', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { install: true };
      });

      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBeInstalled(defaultInputs);

      expect(result.ranNpmInstall).to.equal(true);
    });

    it('Should not install artifact if user confirms no', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { install: false };
      });

      const result = await CommandLine.askForArtifactToBeInstalled(defaultInputs);

      expect(result.ranNpmInstall).to.equal(undefined);
    });

    it('Should not install artifact if user did not specify install, and also set no prompting', async () => {
      const result = await CommandLine.askForArtifactToBeInstalled({
        ...defaultInputs,
        noprompt: true,
      });

      expect(result.ranNpmInstall).to.equal(undefined);
    });
  });

  describe('Running Widoco...', () => {
    it('Should run Widoco', () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = CommandLine.runWidoco({
        ...defaultInputs,
        inputVocabList: ['Dummy_vocab_file'],
        outputDirectory: 'needs/a/parent/directory',
      });

      expect(result.ranWidoco).to.be.true;
    });

    it('Should generate documentation if user explicitly told to', async () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        inputVocabList: ['Dummy_vocab_file'],
        outputDirectory: 'needs/a/parent/directory',
        widoco: true,
      });

      expect(result.ranWidoco).to.equal(true);
    });

    it('Should generate documentation if user confirms yes', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { widoco: true };
      });

      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        inputVocabList: ['Dummy_vocab_file'],
        outputDirectory: 'needs/a/parent/directory',
      });

      expect(result.ranWidoco).to.equal(true);
    });

    it('Should not generate documentation if user confirms no', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { widoco: false };
      });

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        inputVocabList: ['Dummy_vocab_file'],
        outputDirectory: 'needs/a/parent/directory',
      });

      expect(result.ranWidoco).to.equal(undefined);
    });

    it('Should not generate documentation if user did not specify, and also set no prompting', async () => {
      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        noprompt: true,
      });

      expect(result.ranWidoco).to.equal(undefined);
    });
  });
});
