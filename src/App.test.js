require('mock-local-storage');
const debug = require('debug');
const fs = require('fs');
const path = require('path');

const App = require('./App');
const FileGenerator = require('./generator/FileGenerator');
const ArtifactGenerator = require('./generator/ArtifactGenerator');
const { ConfigFileGenerator } = require('./generator/ConfigFileGenerator');
const VocabWatcher = require('./VocabWatcher');

const DEFAULT_CONFIG_TEMPLATE_PATH = '../../templates/initial-config.hbs';

jest.mock('./generator/ArtifactGenerator');
ArtifactGenerator.mockImplementation(() => {
  return {
    generate: async () => {
      return Promise.resolve({ stubbed: true, noprompt: true });
    },
  };
});

jest.mock('./VocabWatcher');
VocabWatcher.mockImplementation(() => {
  return {
    watch: jest.fn(x => x),
    unwatch: jest.fn(x => x),
  };
});

jest.mock('./generator/ConfigFileGenerator');
ConfigFileGenerator.mockImplementation(() => {
  return {
    collectConfigInfo: async () => {
      return Promise.resolve({});
    },
    generateDefaultConfigFile: targetPath => {
      FileGenerator.createFileFromTemplate(DEFAULT_CONFIG_TEMPLATE_PATH, {}, targetPath);
    },
    generateConfigFile: targetPath => {
      FileGenerator.createFileFromTemplate(DEFAULT_CONFIG_TEMPLATE_PATH, {}, targetPath);
    },
  };
});

describe('App tests', () => {
  it('should fail to even construct', () => {
    expect(() => new App()).toThrow('must be initialised with a configuration');
  });

  describe('Testing mocked generator...', () => {
    it('should pass through in non-quiet mode (with DEBUG setting too)', async () => {
      debug.enable('lit-artifact-generator:*');

      const config = {
        _: ['generate'],
        inputResources: ['some_file.ttl'],
        litVocabTermVersion: '1.1.1',
        quiet: false,
        noprompt: true,
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.noprompt).toBe(true);
      expect(mockedResponse.stubbed).toBe(true);
    });

    it('should pass through in non-quiet mode', async () => {
      debug.disable('lit-artifact-generator:*');

      const config = {
        _: ['generate'],
        inputResources: ['some_file.ttl'],
        litVocabTermVersion: '1.1.1',
        quiet: false,
        noprompt: true,
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.noprompt).toBe(true);
      expect(mockedResponse.stubbed).toBe(true);
    });

    it('should pass through in quiet mode', async () => {
      const config = {
        _: ['generate'],
        inputResources: ['some_file.ttl'],
        litVocabTermVersion: '1.1.1',
        quiet: true,
        noprompt: true,
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.noprompt).toBe(true);
      expect(mockedResponse.stubbed).toBe(true);
    });

    it('should generate a default file', async () => {
      const directoryPath = path.join('.', '.tmp');
      const filePath = path.join(directoryPath, 'lit-vocab.yml');
      const argv = { _: ['init'], outputDirectory: directoryPath, quiet: false, noprompt: true };
      await new App(argv).init();
      expect(fs.existsSync(filePath)).toBe(true);
      fs.unlinkSync(filePath);
      fs.rmdirSync(directoryPath);
    });

    it('should generate a file through prompt', async () => {
      const directoryPath = path.join('.', '.tmp');
      const filePath = path.join(directoryPath, 'lit-vocab.yml');
      const argv = { _: ['init'], outputDirectory: directoryPath };
      // init will call the prompt, which is mocked here
      await new App(argv).init();
      expect(fs.existsSync(filePath)).toBe(true);
      fs.unlinkSync(filePath);
      fs.rmdirSync(directoryPath);
    });
  });

  describe('Testing mocked watcher...', () => {
    it('should be possible to watch and unwatch vocabularies', async () => {
      const argv = { _: ['watch'], vocabListFile: './test/resources/watcher/vocab-list.yml' };
      // init will call the prompt, which is mocked here
      const app = new App(argv);
      await app.watch();
      app.unwatch();
      expect(app.watcher.watch.mock.calls.length).toBe(1);
      expect(app.watcher.unwatch.mock.calls.length).toBe(1);
    });
  });
});
