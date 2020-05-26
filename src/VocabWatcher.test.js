require("mock-local-storage");

const fs = require("fs");
const del = require("del");

const ArtifactGenerator = require("./generator/ArtifactGenerator");
const GeneratorConfiguration = require("./config/GeneratorConfiguration");
const { getArtifactDirectorySourceCode } = require("./Util");
const VocabWatcher = require("./VocabWatcher");

const WATCHED_VOCAB_PATH = "./test/resources/watcher/schema-snippet.ttl";
const VOCAB_LIST_PATH = "./test/resources/watcher/vocab-list.yml";
const VOCAB_LIST_PATH_ALTERNATE = "./test/resources/watcher/vocab-list.yaml";
const VOCAB_LIST_PATH_ONLINE_ONLY =
  "./test/resources/watcher/vocab-list-online-only.yml";
const VOCAB_LIST_PATH_GLOB = "./test/resources/glob/**/*.yml";
const OUTPUT_DIRECTORY = "./test/Generated/watcher/initial/";
const OUTPUT_DIRECTORY_JAVA = `${OUTPUT_DIRECTORY}${getArtifactDirectorySourceCode()}/Java`;
const JAVA_PACKAGE_HIERARCHY = "src/main/java/com/example/java/packagename";
const GENERATED_FILEPATH = `${OUTPUT_DIRECTORY_JAVA}/${JAVA_PACKAGE_HIERARCHY}/SCHEMA.java`;
const SLEEP_TIME = 200;

// const MOCKED_ONLINE_RESOURCE_PATH = './test/resources/watcher/another-schema-snippet.ttl';
// const MOCKED_ONLINE_RESOURCE_BODY = fs.readFileSync(MOCKED_ONLINE_RESOURCE_PATH).toString();

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

beforeEach(() => {
  del.sync([`${OUTPUT_DIRECTORY}/*`]);
});

/**
 * This function seeks a string in the specified file, replaces it, waits, and
 * changes it back.
 * @param {string} filePath The path to the vocabulary
 * @param {string} before The string that is going to be replaced, and then restored
 * @param {string} after The string this is going to be used as a replacement, and then removed
 */
async function changeAndRestoreFile(filePath, before, after) {
  fs.writeFileSync(
    filePath,
    fs.readFileSync(filePath).toString().replace(before, after)
  );

  await sleep(SLEEP_TIME);

  // The following changes the file back.
  fs.writeFileSync(
    filePath,
    fs.readFileSync(filePath).toString().replace(after, before)
  );
}

describe("Vocabulary watcher", () => {
  it("should generate an initial artifact when the output directory is empty", async () => {
    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          { vocabListFile: VOCAB_LIST_PATH, outputDirectory: OUTPUT_DIRECTORY },
          undefined
        )
      )
    );

    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay
    // to verify if generation was successful.
    await sleep(SLEEP_TIME);

    expect(fs.existsSync(GENERATED_FILEPATH)).toBe(true);
    watcher.unwatch();
  });

  it("should ignore online resources", async () => {
    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile: VOCAB_LIST_PATH_ONLINE_ONLY,
            outputDirectory: OUTPUT_DIRECTORY,
          },
          undefined
        )
      )
    );

    await watcher.watch();
    // Expect to just be watching the config file itself, not any of the
    // online resources it references.
    expect(watcher.getWatchedResourceList().length).toBe(1);
    watcher.unwatch();
  });

  it("should not generate an initial artifact without changes", async () => {
    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile: VOCAB_LIST_PATH,
            outputDirectory: OUTPUT_DIRECTORY,
          },
          undefined
        )
      )
    );

    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay
    // to verify if generation was successful.
    await sleep(SLEEP_TIME);

    expect(fs.existsSync(GENERATED_FILEPATH)).toBe(true);
    watcher.unwatch();
  });

  it("should trigger artifact generation on change", async () => {
    const config = new GeneratorConfiguration({
      vocabListFile: VOCAB_LIST_PATH,
      outputDirectory: OUTPUT_DIRECTORY,
    });
    await config.completeInitialConfiguration();

    const vocabWatcher = new VocabWatcher(new ArtifactGenerator(config));
    vocabWatcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay
    // to verify if the generation was successful.
    await sleep(SLEEP_TIME);

    expect(fs.existsSync(GENERATED_FILEPATH)).toBe(true);
    // This is the state of the generated file before the vocabulary gets updated
    const initialModifiedTime = fs.statSync(GENERATED_FILEPATH).mtimeMs;

    await changeAndRestoreFile(
      WATCHED_VOCAB_PATH,
      "(alive, dead, undead, or fictional)",
      "(alive, dead, or fictional)"
    );
    expect(fs.statSync(GENERATED_FILEPATH).mtimeMs).not.toEqual(
      initialModifiedTime
    );
    vocabWatcher.unwatch();
  });

  it("should trigger artifact generation on config file change", async () => {
    runWithConfigFile(VOCAB_LIST_PATH);
    runWithConfigFile(VOCAB_LIST_PATH_ALTERNATE);
  });

  async function runWithConfigFile(configFile) {
    const config = new GeneratorConfiguration({
      vocabListFile: VOCAB_LIST_PATH,
      outputDirectory: OUTPUT_DIRECTORY,
    });
    await config.completeInitialConfiguration();

    const vocabWatcher = new VocabWatcher(new ArtifactGenerator(config));
    vocabWatcher.watch();

    // Starting the watcher is not a blocking call, so we need to add a delay
    // to verify if the generation was successful.
    await sleep(SLEEP_TIME);

    expect(fs.existsSync(GENERATED_FILEPATH)).toBe(true);
    // This is the state of the generated file before the vocabulary gets updated
    const initialModifiedTime = fs.statSync(GENERATED_FILEPATH).mtimeMs;

    await changeAndRestoreFile(
      VOCAB_LIST_PATH,
      "artifactGeneratorVersion: 0.1.0",
      "artifactGeneratorVersion: 99.999.99999"
    );
    expect(fs.statSync(GENERATED_FILEPATH).mtimeMs).not.toEqual(
      initialModifiedTime
    );
    vocabWatcher.unwatch();
  }

  it("should not throw when the vocabulary is initially malformed RDF", async () => {
    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile:
              "./test/resources/watcher/vocab-list-referencing-incorrect-vocab.yml",
            outputDirectory: OUTPUT_DIRECTORY,
          },
          undefined
        )
      )
    );

    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay
    // to verify if generation was successful.
    await sleep(SLEEP_TIME);

    // If the watcher process throws, this will fail
    watcher.unwatch();
  });

  it("should not throw when the vocabulary is changed to malformed RDF", async () => {
    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile: VOCAB_LIST_PATH,
            outputDirectory: OUTPUT_DIRECTORY,
          },
          undefined
        )
      )
    );

    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay
    // to verify if generation was successful.
    await sleep(SLEEP_TIME);
    // Makes the vocabulary syntactically wrong, and restores it
    await changeAndRestoreFile(
      WATCHED_VOCAB_PATH,
      "schema:Person a rdfs:Class ;",
      "schema:Person a rdfs:Class"
    );
    // If the watcher process throws, this will fail
    watcher.unwatch();
  });

  it("should not trigger artifact generation after the watcher stopped", async () => {
    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile: VOCAB_LIST_PATH,
            outputDirectory: OUTPUT_DIRECTORY,
          },
          undefined
        )
      )
    );
    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay
    // to verify if generation was successful.
    await sleep(SLEEP_TIME);

    // This is the state of the generated file before the vocabulary gets updated
    const initialModifiedTime = fs.statSync(GENERATED_FILEPATH).mtimeMs;

    await changeAndRestoreFile(
      WATCHED_VOCAB_PATH,
      "(alive, dead, undead, or fictional)",
      "(alive, dead, or fictional)"
    );
    await sleep(SLEEP_TIME);

    const newerModifiedTime = fs.statSync(GENERATED_FILEPATH).mtimeMs;
    expect(newerModifiedTime).not.toEqual(initialModifiedTime);

    watcher.unwatch();

    await changeAndRestoreFile(
      WATCHED_VOCAB_PATH,
      "(alive, dead, undead, or fictional)",
      "(alive, dead, or fictional)"
    );

    const newestModifiedTime = fs.statSync(GENERATED_FILEPATH).mtimeMs;
    expect(newestModifiedTime).toEqual(newerModifiedTime);
  });

  it("should not generate an artifact on startup when the output directory is up-to-date", async () => {
    const generator = new ArtifactGenerator(
      new GeneratorConfiguration(
        {
          _: "generate",
          vocabListFile: VOCAB_LIST_PATH,
          outputDirectory: OUTPUT_DIRECTORY,
        },
        undefined
      )
    );

    // We manually generate the artifacts before watching the vocabulary (so that the artifacts are up-to-date)
    await generator.generate();

    const firstModifiedTime = fs.statSync(GENERATED_FILEPATH).mtimeMs;

    const watcher = new VocabWatcher(generator);

    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay
    // to verify if generation was successful.
    await sleep(SLEEP_TIME);

    const newerModifiedTime = fs.statSync(GENERATED_FILEPATH).mtimeMs;
    expect(newerModifiedTime).toEqual(firstModifiedTime);
    watcher.unwatch();
  });

  it("should generate an artifact on startup when the output directory is outdated", async () => {
    const generator = new ArtifactGenerator(
      new GeneratorConfiguration(
        {
          vocabListFile: VOCAB_LIST_PATH,
          outputDirectory: OUTPUT_DIRECTORY,
        },
        undefined
      )
    );

    // We manually generate the artifacts before watching the vocabulary (so that the artifacts are up-to-date)
    generator.artifactData.force = true;
    await generator.generate();

    const firstModifiedTime = fs.statSync(GENERATED_FILEPATH).mtimeMs;

    await changeAndRestoreFile(
      WATCHED_VOCAB_PATH,
      "(alive, dead, undead, or fictional)",
      "(alive, dead, or fictional)"
    );

    const watcher = new VocabWatcher(generator);

    await watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay
    // to verify if generation was successful.
    await sleep(SLEEP_TIME);

    const newerModifiedTime = fs.statSync(GENERATED_FILEPATH).mtimeMs;
    expect(newerModifiedTime).not.toEqual(firstModifiedTime);
    watcher.unwatch();
  });
});
