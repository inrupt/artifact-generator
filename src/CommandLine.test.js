const sinon = require('sinon');
const inquirer = require('inquirer');
const childProcess = require('child_process');

const CommandLine = require('./CommandLine');

const defaultInputs = {
  artifactName: '@lit/generator-vocab-schema-ext',
  authorSet: new Set(['lit@inrupt.com']),
  npmRegistry: 'http://localhost:4873/',
};

describe('Command Line unit tests', () => {
  afterEach(() => {
    // Restore the default sandbox here.
    sinon.restore();
  });

  describe('Requesting input from the user', () => {
    it('Should not ask for artifact information if explicitly told not to', async () => {
      const result = await CommandLine.askForArtifactInfo({ ...defaultInputs, noprompt: true });

      expect(result.artifactName).toBe('@lit/generator-vocab-schema-ext');
      expect(result.authorSet.has('lit@inrupt.com'));
    });

    it('Should ask for artifact name', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { artifactName: 'lit-gen-schema-ext', authorSet: new Set(['inrupt']) };
      });

      const result = await CommandLine.askForArtifactInfo(defaultInputs);

      expect(result.artifactName).toBe('lit-gen-schema-ext');
      expect(result.authorSet.has('inrupt'));
    });

    it('Should ask for artifact module name prefix, and override provided value', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { artifactName: 'test-prefix-' };
      });

      const result = await CommandLine.askForArtifactInfo({
        ...defaultInputs,
        moduleNamePrefix: 'override-this-prefix-',
      });

      expect(result.artifactName).toBe('test-prefix-');
    });

    it('Should ask for LIT Vocab Term version, and override provided value', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { litVocabTermVersion: '^1.2.3' };
      });

      const result = await CommandLine.askForArtifactInfo({
        ...defaultInputs,
        litVocabTermVersion: '0.0.0',
      });

      expect(result.litVocabTermVersion).toBe('^1.2.3');
    });

    it('Should ask for artifact authors information if none provided', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { authorSet: new Set().add('test-inrupt') };
      });

      const result = await CommandLine.askForArtifactInfo(delete defaultInputs.authorSet);

      expect(result.authorSet.has('test-inrupt'));
    });
  });

  describe('NPM publishing...', () => {
    it('Should find the latest published artifact from registry', () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '1.1.10';
      });

      const result = CommandLine.findPublishedVersionOfModule({
        ...defaultInputs,
        runNpmPublish: true,
      });

      expect(result.publishedVersion).toBe('1.1.10');
      expect(result.version).toBe('1.1.10');
    });

    it('Should not add to the result if artifact has not been published to the registry', () => {
      sinon.stub(childProcess, 'execSync').throws();

      const result = CommandLine.findPublishedVersionOfModule({
        ...defaultInputs,
        runNpmPublish: true,
      });

      expect(result.publishedVersion).toBeUndefined();
      expect(result.version).toBeUndefined();
    });

    it('Should publish artifact to the registry if user confirms yes', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { runNpmPublish: true };
      });

      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBeNpmPublished(defaultInputs);

      expect(result.runNpmPublish).toBe(true);
      expect(result.ranNpmPublish).toBe(true);
    });

    it('Should publish artifact to the registry if given explicit inputs', async () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBeNpmPublished({
        ...defaultInputs,
        runNpmPublish: true,
      });

      expect(result.runNpmPublish).toBe(true);
      expect(result.ranNpmPublish).toBe(true);
    });

    it('Should not publish artifact to the registry if user confirms no', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { runNpmPublish: false };
      });

      sinon
        .mock(childProcess)
        .expects('execSync')
        .never();

      const result = await CommandLine.askForArtifactToBeNpmPublished(defaultInputs);

      expect(result.runNpmPublish).toBe(false);
      expect(result.ranNpmPublish).toBeUndefined();
    });

    it('Should not publish artifact if user did not specify publish, and also set no prompting', async () => {
      const result = await CommandLine.askForArtifactToBeNpmPublished({
        ...defaultInputs,
        noprompt: true,
      });

      expect(result.ranNpmPublish).toBeUndefined();
    });
  });

  describe('NPM version bumping...', () => {
    it('Should run npm version', () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = CommandLine.runNpmVersion(defaultInputs);

      expect(result.ranNpmVersion).toBe(true);
    });

    it('Should bump artifact version if explicitly told to', async () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '1.2.10';
      });

      const result = await CommandLine.askForArtifactToBeNpmVersionBumped({
        ...defaultInputs,
        publishedVersion: '1.1.10',
        bumpVersion: 'minor',
      });

      expect(result.publishedVersion).toBe('1.1.10');
      expect(result.bumpVersion).toBe('minor');
      expect(result.bumpedVersion).toBe('1.2.10');
      expect(result.ranNpmVersion).toBe(true);
    });

    it('Should ask for the artifact version bump type (major, minor, patch)', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { bumpVersion: 'patch' };
      });

      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBeNpmVersionBumped({
        ...defaultInputs,
        publishedVersion: '1.1.10',
      });

      expect(result.bumpVersion).toBe('patch');
      expect(result.ranNpmVersion).toBe(true);
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

      const result = await CommandLine.askForArtifactToBeNpmVersionBumped(defaultInputs);

      expect(result.bump).toBe('no');
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

      const result = await CommandLine.askForArtifactToBeNpmVersionBumped(defaultInputs);

      expect(result.publishedVersion).toBeUndefined();
    });
  });

  describe('NPM installing...', () => {
    it('Should run npm install', () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = CommandLine.runNpmInstall(defaultInputs);

      expect(result.ranNpmInstall).toBe(true);
    });

    it('Should install artifact if user explicitly told to', async () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBeNpmInstalled({
        ...defaultInputs,
        runNpmInstall: true,
      });

      expect(result.ranNpmInstall).toBe(true);
    });

    it('Should install artifact if user confirms yes', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { runNpmInstall: true };
      });

      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBeNpmInstalled(defaultInputs);

      expect(result.ranNpmInstall).toBe(true);
    });

    it('Should not install artifact if user confirms no', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { runNpmInstall: false };
      });

      const result = await CommandLine.askForArtifactToBeNpmInstalled(defaultInputs);

      expect(result.ranNpmInstall).toBeUndefined();
    });

    it('Should not install artifact if user did not specify install, and also set no prompting', async () => {
      const result = await CommandLine.askForArtifactToBeNpmInstalled({
        ...defaultInputs,
        noprompt: true,
      });

      expect(result.ranNpmInstall).toBeUndefined();
    });
  });

  describe('Running Widoco...', () => {
    it('Should run Widoco', () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = CommandLine.runWidoco({
        ...defaultInputs,
        input: ['Dummy_vocab_file'],
        outputDirectory: 'needs/a/parent/directory',
      });

      expect(result.ranWidoco).toBe(true);
    });

    it('Should generate documentation if user explicitly told to', async () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        input: ['Dummy_vocab_file'],
        outputDirectory: 'needs/a/parent/directory',
        runWidoco: true,
      });

      expect(result.ranWidoco).toBe(true);
    });

    it('Should generate documentation (from HTTP vocab) if user explicitly told to', async () => {
      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        input: ['http://Dummy_vocab_file'],
        outputDirectory: 'needs/a/parent/directory',
        runWidoco: true,
      });

      expect(result.ranWidoco).toBe(true);
    });

    it('Should generate documentation if user confirms yes', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { runWidoco: true };
      });

      sinon.stub(childProcess, 'execSync').callsFake(() => {
        return '';
      });

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        input: ['Dummy_vocab_file'],
        outputDirectory: 'needs/a/parent/directory',
      });

      expect(result.ranWidoco).toBe(true);
    });

    it('Should not generate documentation if user confirms no', async () => {
      sinon.stub(inquirer, 'prompt').callsFake(async () => {
        return { runWidoco: false };
      });

      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        input: ['Dummy_vocab_file'],
        outputDirectory: 'needs/a/parent/directory',
      });

      expect(result.ranWidoco).toBeUndefined();
    });

    it('Should not generate documentation if user did not specify, and also set no prompting', async () => {
      const result = await CommandLine.askForArtifactToBeDocumented({
        ...defaultInputs,
        noprompt: true,
      });

      expect(result.ranWidoco).toBeUndefined();
    });
  });
});
