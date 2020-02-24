require("mock-local-storage");
const debugInstance = require("debug");
const fs = require("fs");
const path = require("path");

const App = require("./App");
const FileGenerator = require("./generator/FileGenerator");
const ArtifactGenerator = require("./generator/ArtifactGenerator");
const { ConfigFileGenerator } = require("./generator/ConfigFileGenerator");
const VocabWatcher = require("./VocabWatcher");

const {
  DEFAULT_CONFIG_TEMPLATE_PATH
} = require("./generator/ConfigFileGenerator");

const UNCALLED_PUBLISH_FUNCTION = jest.fn();
const CALLED_PUBLISH_FUNCTION = jest.fn();

const locallyPublishingGenerator = () => {
  return {
    generate: async () => {
      // In a non-mocked setting, the `publish` option passes through the `generate` function,
      // but here it must be set explicitly.
      return Promise.resolve({
        stubbed: true,
        noprompt: true,
        publish: ["local"]
      });
    },
    runPublish: CALLED_PUBLISH_FUNCTION
  };
};

const remotelyPublishingGenerator = () => {
  return {
    generate: async () => {
      // In a non-mocked setting, the `publish` option passes through the `generate` function,
      // but here it must be set explicitly.
      return Promise.resolve({
        stubbed: true,
        noprompt: true,
        publish: ["remote"]
      });
    },
    runPublish: CALLED_PUBLISH_FUNCTION
  };
};

const locallyAndRemotelyPublishingGenerator = () => {
  return {
    generate: async () => {
      // In a non-mocked setting, the `publish` option passes through the `generate` function,
      // but here it must be set explicitly.
      return Promise.resolve({
        stubbed: true,
        noprompt: true,
        publish: ["local", "remote"]
      });
    },
    runPublish: CALLED_PUBLISH_FUNCTION
  };
};

const nonPublishingGenerator = () => {
  return {
    generate: async () => {
      return Promise.resolve({ stubbed: true, noprompt: true });
    },
    runPublish: UNCALLED_PUBLISH_FUNCTION
  };
};

jest.mock("./generator/ArtifactGenerator");
ArtifactGenerator.mockImplementation(nonPublishingGenerator);

jest.mock("./VocabWatcher");
VocabWatcher.mockImplementation(() => {
  return {
    watch: jest.fn(x => x),
    unwatch: jest.fn(x => x)
  };
});

jest.mock("./generator/ConfigFileGenerator");
ConfigFileGenerator.mockImplementation(() => {
  return {
    collectConfigInfo: async () => {
      return Promise.resolve({});
    },
    generateDefaultConfigFile: targetPath => {
      FileGenerator.createFileFromTemplate(
        DEFAULT_CONFIG_TEMPLATE_PATH,
        {},
        targetPath
      );
    },
    generateConfigFile: targetPath => {
      FileGenerator.createFileFromTemplate(
        DEFAULT_CONFIG_TEMPLATE_PATH,
        {},
        targetPath
      );
    }
  };
});

describe("App tests", () => {
  it("should fail to even construct", () => {
    expect(() => new App()).toThrow("must be initialised with a configuration");
  });

  describe("Testing mocked generator...", () => {
    it("should pass through in non-quiet mode (with DEBUG setting too)", async () => {
      debugInstance.enable("lit-artifact-generator:*");

      const config = {
        _: ["generate"],
        inputResources: ["some_file.ttl"],
        litVocabTermVersion: "1.1.1",
        quiet: false,
        noprompt: true
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.noprompt).toBe(true);
      expect(mockedResponse.stubbed).toBe(true);
    });

    it("should pass through in non-quiet mode", async () => {
      debugInstance.disable("lit-artifact-generator:*");

      const config = {
        _: ["generate"],
        inputResources: ["some_file.ttl"],
        litVocabTermVersion: "1.1.1",
        quiet: false,
        noprompt: true
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.noprompt).toBe(true);
      expect(mockedResponse.stubbed).toBe(true);
    });

    it("should publish artifacts if the option is set", async () => {
      debugInstance.disable("lit-artifact-generator:*");

      ArtifactGenerator.mockImplementation(locallyPublishingGenerator);

      const config = {
        _: ["generate"],
        inputResources: ["some_file.ttl"],
        litVocabTermVersion: "1.1.1",
        quiet: false,
        noprompt: true,
        publish: ["local"]
      };
      const before = CALLED_PUBLISH_FUNCTION.mock.calls.length;
      await new App(config).run();
      expect(CALLED_PUBLISH_FUNCTION.mock.calls.length).toBe(before + 1);
      ArtifactGenerator.mockImplementation(nonPublishingGenerator);
    });

    it("should publish artifacts remotely if the option is set", async () => {
      debugInstance.disable("lit-artifact-generator:*");
      ArtifactGenerator.mockImplementation(remotelyPublishingGenerator);

      const config = {
        _: ["generate"],
        inputResources: ["some_file.ttl"],
        litVocabTermVersion: "1.1.1",
        quiet: false,
        noprompt: true,
        publish: ["remote"]
      };
      const before = CALLED_PUBLISH_FUNCTION.mock.calls.length;
      await new App(config).run();
      expect(CALLED_PUBLISH_FUNCTION.mock.calls.length).toBe(before + 1);
      ArtifactGenerator.mockImplementation(nonPublishingGenerator);
    });

    it("should publish artifacts both locally and remotely if the options are set", async () => {
      debugInstance.disable("lit-artifact-generator:*");

      ArtifactGenerator.mockImplementation(
        locallyAndRemotelyPublishingGenerator
      );

      const config = {
        _: ["generate"],
        inputResources: ["some_file.ttl"],
        litVocabTermVersion: "1.1.1",
        quiet: false,
        noprompt: true,
        publish: ["local", "remote"]
      };
      const before = CALLED_PUBLISH_FUNCTION.mock.calls.length;
      await new App(config).run();
      expect(CALLED_PUBLISH_FUNCTION.mock.calls.length).toBe(before + 2);
      ArtifactGenerator.mockImplementation(nonPublishingGenerator);
    });

    it("should not publish artifacts if not asked to", async () => {
      debugInstance.disable("lit-artifact-generator:*");

      const config = {
        _: ["generate"],
        inputResources: ["some_file.ttl"],
        litVocabTermVersion: "1.1.1",
        quiet: false,
        noprompt: true
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.published).toBe(undefined);
    });

    it("should pass through in quiet mode", async () => {
      const config = {
        _: ["generate"],
        inputResources: ["some_file.ttl"],
        litVocabTermVersion: "1.1.1",
        quiet: true,
        noprompt: true
      };

      const mockedResponse = await new App(config).run();
      expect(mockedResponse.noprompt).toBe(true);
      expect(mockedResponse.stubbed).toBe(true);
    });

    it("should generate a default file", async () => {
      const directoryPath = path.join(".", ".tmp");
      const filePath = path.join(directoryPath, "lit-vocab.yml");
      const argv = {
        _: ["init"],
        outputDirectory: directoryPath,
        quiet: false,
        noprompt: true
      };
      await new App(argv).init();
      expect(fs.existsSync(filePath)).toBe(true);
      fs.unlinkSync(filePath);
      fs.rmdirSync(directoryPath);
    });

    it("should generate a file through prompt", async () => {
      const directoryPath = path.join(".", ".tmp");
      const filePath = path.join(directoryPath, "lit-vocab.yml");
      const argv = { _: ["init"], outputDirectory: directoryPath };
      // init will call the prompt, which is mocked here
      await new App(argv).init();
      expect(fs.existsSync(filePath)).toBe(true);
      fs.unlinkSync(filePath);
      fs.rmdirSync(directoryPath);
    });
  });

  describe("Testing mocked watcher...", () => {
    it("should be possible to watch and unwatch vocabularies", async () => {
      const argv = {
        _: ["watch"],
        vocabListFile: "./test/resources/watcher/vocab-list.yml"
      };
      // init will call the prompt, which is mocked here
      const app = new App(argv);
      await app.watch();
      app.unwatch();
      expect(app.watcher.watch.mock.calls.length).toBe(1);
      expect(app.watcher.unwatch.mock.calls.length).toBe(1);
    });
  });

  describe("Testing validation", () => {
    it("should validate a correct config file", async () => {
      const filePath = path.join(
        "test",
        "resources",
        "validation",
        "vocab-list.yml"
      );
      const argv = {
        _: ["validate"],
        vocabListFile: filePath
      };
      let valid = false;
      await new App(argv).validate().then(() => {
        valid = true;
      });
      expect(valid).toBe(true);
    });

    it("should throw when validating an incorrect config file", async () => {
      const filePath = path.join(
        "test",
        "resources",
        "vocabs",
        "no-artifacts.yml"
      );
      const argv = {
        _: ["validate"],
        vocabListFile: filePath
      };
      expect(new App(argv).validate()).rejects.toThrow("Invalid configuration");
    });

    it("should throw when a local vocabulary is missing", async () => {
      const filePath = path.join(
        "test",
        "resources",
        "validation",
        "missing-local-vocab-list.yml"
      );
      const argv = {
        _: ["validate"],
        vocabListFile: filePath
      };
      expect(new App(argv).validate()).rejects.toThrow();
    });

    it("should throw when a remote vocabulary is incorrect", async () => {
      const filePath = path.join(
        "test",
        "resources",
        "validation",
        "inexistent-online-vocab-list.yml"
      );
      const argv = {
        _: ["validate"],
        vocabListFile: filePath
      };
      expect(new App(argv).validate()).rejects.toThrow();
    });

    it("should throw when a vocabulary is syntactically incorrect", async () => {
      const filePath = path.join(
        "test",
        "resources",
        "validation",
        "vocab-list-containing-invalid-syntax.yml"
      );
      const argv = {
        _: ["validate"],
        vocabListFile: filePath
      };
      expect(new App(argv).validate()).rejects.toThrow();
    });
  });
});
