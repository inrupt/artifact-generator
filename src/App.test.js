require('mock-local-storage');
const debug = require('debug');

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

  it('should fail with missing input', async () => {
    const config = {
      argv: {},
      showHelp: () => {},
    };

    await expect(new App(config).run()).rejects.toThrow('You must provide input');
  });

  describe('Testing mocked generator...', () => {
    it('should pass through in non-quiet mode (with DEBUG setting too)', async () => {
      debug.enable('lit-artifact-generator:*');

      const config = {
        argv: { inputFiles: 'some_file.ttl', quiet: false, noprompt: true },
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.noprompt).toBe(true);
      expect(mockedResponse.stubbed).toBe(true);
    });

    it('should pass through in non-quiet mode', async () => {
      debug.disable('lit-artifact-generator:*');

      const config = {
        argv: { inputFiles: 'some_file.ttl', quiet: false, noprompt: true },
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.noprompt).toBe(true);
      expect(mockedResponse.stubbed).toBe(true);
    });

    it('should pass through in quiet mode', async () => {
      const config = {
        argv: { inputFiles: 'some_file.ttl', quiet: true, noprompt: true },
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.noprompt).toBe(true);
      expect(mockedResponse.stubbed).toBe(true);
    });
  });
});
