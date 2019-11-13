require('mock-local-storage');

const fs = require('fs');
const del = require('del');
const axios = require('axios');

jest.mock('axios');

const ArtifactGenerator = require('./generator/ArtifactGenerator');
const GeneratorConfiguration = require('./config/GeneratorConfiguration');
const { ARTIFACT_DIRECTORY_SOURCE_CODE } = require('./generator/ArtifactGenerator');
const VocabWatcher = require('./VocabWatcher');

const WATCHED_VOCAB_PATH = './test/resources/watcher/schema-snippet.ttl';
const VOCAB_LIST_PATH = './test/resources/watcher/vocab-list.yml';
const OUTPUT_DIRECTORY = './test/generated/watcher/initial/';
const OUTPUT_DIRECTORY_JAVA = `${OUTPUT_DIRECTORY}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java`;
const JAVA_PACKAGE_HIERARCHY = 'src/main/java/com/example/java/packagename';
const GENERATED_FILEPATH = `${OUTPUT_DIRECTORY_JAVA}/${JAVA_PACKAGE_HIERARCHY}/SCHEMA.java`;
const SLEEP_TIME = 200;

// 'Mon, 01 Jan 4000 00:00:59 GMT', in POSIX time
const MOCKED_LAST_MODIFIED = 64060588859000;
const VALID_LAST_MODIF_HTTP_RESOURCE = {
  headers: {
    // This date should alway be more recent than the considered artifacts (unless you are running this test
    // 2000 years in the future and are trying to figure out what stopped working)
    'last-modified': 'Mon, 01 Jan 4000 00:00:59 GMT',
  },
};

const INVALID_LAST_MODIF_HTTP_RESOURCE = {
  headers: {
    'last-modified': 'This is not a date',
  },
};

// const MOCKED_ONLINE_RESOURCE_PATH = './test/resources/watcher/another-schema-snippet.ttl';
// const MOCKED_ONLINE_RESOURCE_BODY = fs.readFileSync(MOCKED_ONLINE_RESOURCE_PATH).toString();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

beforeEach(() => {
  del.sync([`${OUTPUT_DIRECTORY}/*`]);
});

/**
 * This function seeks a string in the vocabulary, replaces it, waits, and changes it back.
 * @param {string} vocabPath The path to the vocabulary
 * @param {string} before The string that is going to be replaced, and then restored
 * @param {string} after The string this is going to be used as a replacement, and then removed
 */
async function changeAndRestoreVocab(vocabPath, before, after) {
  fs.writeFileSync(
    vocabPath,
    fs
      .readFileSync(vocabPath)
      .toString()
      .replace(before, after)
  );
  await sleep(SLEEP_TIME);

  // The following changes the vocabulary back
  fs.writeFileSync(
    vocabPath,
    fs
      .readFileSync(vocabPath)
      .toString()
      .replace(after, before)
  );
}

describe('Vocabulary watcher', () => {
  it('should generate an initial artifact when the output directory is empty', async () => {
    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          { vocabListFile: VOCAB_LIST_PATH, outputDirectory: OUTPUT_DIRECTORY },
          undefined
        )
      )
    );

    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if generation was successful
    await sleep(SLEEP_TIME);

    expect(fs.existsSync(GENERATED_FILEPATH)).toBe(true);
    watcher.unwatch();
  });

  it('should not generate an initial artifact without changes', async () => {
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
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if generation was successful
    await sleep(SLEEP_TIME);

    expect(fs.existsSync(GENERATED_FILEPATH)).toBe(true);
    watcher.unwatch();
  });

  it('should trigger artifact generation on change', async () => {
    const config = new GeneratorConfiguration({
      vocabListFile: VOCAB_LIST_PATH,
      outputDirectory: OUTPUT_DIRECTORY,
    });
    await config.completeInitialConfiguration();

    const vocabWatcher = new VocabWatcher(new ArtifactGenerator(config));
    vocabWatcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if the generation was successful
    await sleep(SLEEP_TIME);

    expect(fs.existsSync(GENERATED_FILEPATH)).toBe(true);
    // This is the state of the generated file before the vocabulary gets updated
    const initialModif = fs.statSync(GENERATED_FILEPATH).mtimeMs;

    await changeAndRestoreVocab(
      WATCHED_VOCAB_PATH,
      '(alive, dead, undead, or fictional)',
      '(alive, dead, or fictional)'
    );
    expect(fs.statSync(GENERATED_FILEPATH).mtimeMs).not.toEqual(initialModif);
    vocabWatcher.unwatch();
  });

  it('should not throw when the vocabulary is initially malformed RDF', async () => {
    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile: './test/resources/watcher/vocab-list-referencing-incorrect-vocab.yml',
            outputDirectory: OUTPUT_DIRECTORY,
          },
          undefined
        )
      )
    );
    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if generation was successful
    await sleep(SLEEP_TIME);

    // If the watcher process throws, this will fail
    watcher.unwatch();
  });

  it('should not throw when the vocabulary is changed to malformed RDF', async () => {
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
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if generation was successful
    await sleep(SLEEP_TIME);
    // Makes the vocabulary syntactically wrong, and restores it
    await changeAndRestoreVocab(
      WATCHED_VOCAB_PATH,
      'schema:Person a rdfs:Class ;',
      'schema:Person a rdfs:Class'
    );
    // If the watcher process throws, this will fail
    watcher.unwatch();
  });

  it('should not trigger artifact generation after the watcher stopped', async () => {
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
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if generation was successful
    await sleep(SLEEP_TIME);

    // This is the state of the generated file before the vocabulary gets updated
    const initialModif = fs.statSync(GENERATED_FILEPATH).mtimeMs;

    await changeAndRestoreVocab(
      WATCHED_VOCAB_PATH,
      '(alive, dead, undead, or fictional)',
      '(alive, dead, or fictional)'
    );
    await sleep(SLEEP_TIME);

    const newerModif = fs.statSync(GENERATED_FILEPATH).mtimeMs;
    expect(newerModif).not.toEqual(initialModif);

    watcher.unwatch();

    await changeAndRestoreVocab(
      WATCHED_VOCAB_PATH,
      '(alive, dead, undead, or fictional)',
      '(alive, dead, or fictional)'
    );

    const newestModif = fs.statSync(GENERATED_FILEPATH).mtimeMs;
    expect(newestModif).toEqual(newerModif);
  });

  it('should not generate an artifact on startup when the output directory is up-to-date', async () => {
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
    await generator.generate();

    const firstModif = fs.statSync(GENERATED_FILEPATH).mtimeMs;

    const watcher = new VocabWatcher(generator);

    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if generation was successful
    await sleep(SLEEP_TIME);

    const newerModif = fs.statSync(GENERATED_FILEPATH).mtimeMs;
    expect(newerModif).toEqual(firstModif);
    watcher.unwatch();
  });

  it('should generate an artifact on startup when the output directory is outdated', async () => {
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
    await generator.generate();

    const firstModif = fs.statSync(GENERATED_FILEPATH).mtimeMs;

    await changeAndRestoreVocab(
      WATCHED_VOCAB_PATH,
      '(alive, dead, undead, or fictional)',
      '(alive, dead, or fictional)'
    );

    const watcher = new VocabWatcher(generator);

    await watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if generation was successful
    await sleep(SLEEP_TIME);

    const newerModif = fs.statSync(GENERATED_FILEPATH).mtimeMs;
    expect(newerModif).not.toEqual(firstModif);
    watcher.unwatch();
  });

  it('should get the resource last modification for online resources', async () => {
    axios.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(VALID_LAST_MODIF_HTTP_RESOURCE))
    );

    const lastmodif = await VocabWatcher.getResourceLastModificationTime('http://whatever.org');
    expect(lastmodif).toEqual(MOCKED_LAST_MODIFIED);
  });

  it('should throw when the resource last modification for online resources is invalid', async () => {
    axios.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(INVALID_LAST_MODIF_HTTP_RESOURCE))
    );
    expect(VocabWatcher.getResourceLastModificationTime('http://whatever.org')).rejects.toThrow(
      'Cannot get last modification time'
    );
  });
});
