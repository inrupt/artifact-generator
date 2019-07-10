'use strict';

const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;
const sinon = require('sinon');

const inquirer = require('inquirer');

const childProcess = require('child_process');

const CommandLine = require('../src/command-line');

const defaultInputs = { artifactName: 'lit-generator-vocab-schema-ext', author: 'lit@inrupt.com' };

describe('Command Line unit tests', () => {
  beforeEach(() => {});

  afterEach(() => {
    // Restore the default sandbox here
    sinon.restore();
  });

  describe('Requesting input from the user', () => {
    it('Should ask for artifact information', async () => {
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

    it('Should find the latest published artifact from registry', () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '1.1.10';
      });

      const result = CommandLine.findPublishedVersionOfModule(defaultInputs);

      expect(result.publishedVersion).to.equal('1.1.10');
      expect(result.version).to.equal('1.1.10');
    });

    it('Should ask for the artifact version bump type (major, minor, patch)', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { bump: 'patch' };
      });

      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactVersionBumpType(defaultInputs);

      expect(result.bump).to.equal('patch');
    });

    it('Should not run update version command if the user answers "no" when ask for the artifact version bump type', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { bump: 'no' };
      });

      sinon
        .mock(childProcess)
        .expects('execSync')
        .never();

      const result = await CommandLine.askForArtifactVersionBumpType(defaultInputs);

      expect(result.bump).to.equal('no');
    });

    it('Should publish artifact to the registry if user confirms yes', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { publish: true };
      });

      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const commandLine = new CommandLine({ npmRegistry: 'http://localhost:4873/' });
      const result = await commandLine.askForArtifactToBePublished(defaultInputs);

      expect(result.publish).to.equal(true);
    });

    it('Should not publish artifact to the registry if user confirms no', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { publish: false };
      });

      sinon
        .mock(childProcess)
        .expects('execSync')
        .never();

      const commandLine = new CommandLine({ npmRegistry: 'http://localhost:4873/' });
      const result = await commandLine.askForArtifactToBePublished(defaultInputs);

      expect(result.publish).to.equal(false);
    });
  });
});
