require('mock-local-storage');
const debug = require('debug');
const fs = require('fs');
const path = require('path');

const App = require('./App');
const ArtifactGenerator = require('./generator/ArtifactGenerator');

jest.mock('./generator/ArtifactGenerator');
ArtifactGenerator.mockImplementation(() => {
  return {
    generate: async () => {
      return Promise.resolve({ stubbed: true, noprompt: true });
    },
  };
});

describe('App tests', () => {
  it('should fail to even construct', () => {
    expect(() => new App()).toThrow('must be initialised with a configuration');
  });

  it('should construct Ok', () => {
    const config = {
      argv: {},
    };

    expect(() => new App(config)).not.toThrow();
  });

  // This check is now directly done by yargs
  // TODO: When moving functionnalities towards a yaml-only approach, this test should evolve to test the validity of the config file.
  // it('should fail with missing input', async () => {
  //   const config = {
  //     argv: {},
  //     showHelp: () => {},
  //   };

  //   await expect(new App(config).run()).rejects.toThrow('You must provide input');
  // });

  describe('Testing mocked generator...', () => {
    it('should pass through in non-quiet mode (with DEBUG setting too)', async () => {
      debug.enable('lit-artifact-generator:*');

      const config = {
        argv: { inputResources: 'some_file.ttl', quiet: false, noprompt: true },
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.noprompt).toBe(true);
      expect(mockedResponse.stubbed).toBe(true);
    });

    it('should pass through in non-quiet mode', async () => {
      debug.disable('lit-artifact-generator:*');

      const config = {
        argv: { inputResources: 'some_file.ttl', quiet: false, noprompt: true },
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.noprompt).toBe(true);
      expect(mockedResponse.stubbed).toBe(true);
    });

    it('should pass through in quiet mode', async () => {
      const config = {
        argv: { inputResources: 'some_file.ttl', quiet: true, noprompt: true },
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.noprompt).toBe(true);
      expect(mockedResponse.stubbed).toBe(true);
    });

    it('should generate a default file', async () => {
      const directoryPath = path.join('.', '.tmp');
      const filePath = path.join(directoryPath, 'lit-vocab.yml');
      const argv = { outputDirectory: directoryPath, quiet: false, noprompt: true };
      await new App(argv).init();
      expect(fs.existsSync(filePath)).toBe(true);
      fs.unlinkSync(filePath);
      fs.rmdirSync(directoryPath);
    });
  });
});
