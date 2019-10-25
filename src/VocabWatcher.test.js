require('mock-local-storage');

const fs = require('fs');
const del = require('del');

const ArtifactGenerator = require('./generator/ArtifactGenerator');
const GeneratorConfiguration = require('./config/GeneratorConfiguration');
const { ARTIFACT_DIRECTORY_SOURCE_CODE } = require('./generator/ArtifactGenerator');
const VocabWatcher = require('./VocabWatcher');

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

describe('Vocabulary watcher', () => {
  it('should generate an initial artifact without changes', async () => {
    const outputDirectory = './test/generated/watcher/initial/';
    del.sync([`${outputDirectory}/*`]);

    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile: './test/resources/watcher/vocab-list.yml',
            outputDirectory,
          },
          undefined
        )
      )
    );

    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if generation was successful
    await sleep(500);

    const outputDirectoryJava = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java`;
    const packageHierarchy = 'src/main/java/com/example/java/packagename';

    expect(fs.existsSync(`${outputDirectoryJava}/${packageHierarchy}/SCHEMA.java`)).toBe(true);
  });

  it('should trigger artifact generation on change', async () => {
    const outputDirectory = 'test/generated/watcher/initial';
    del.sync([`${outputDirectory}/*`]);

    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile: './test/resources/watcher/vocab-list.yml',
            outputDirectory,
          },
          undefined
        )
      )
    );
    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if generation was successful
    await sleep(500);
    const outputDirectoryJava = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java`;
    const packageHierarchy = 'src/main/java/com/example/java/packagename';
    const generatedFilePath = `${outputDirectoryJava}/${packageHierarchy}/SCHEMA.java`;
    expect(fs.existsSync(generatedFilePath)).toBe(true);
    // This is the state of the generated file before the vocabulary gets updated
    const initialFileStat = fs.statSync(generatedFilePath);

    const watchedVocabPath = './test/resources/watcher/schema-snippet.ttl';
    // The following changes a comment in the vocabulary
    fs.writeFileSync(
      watchedVocabPath,
      fs
        .readFileSync(watchedVocabPath)
        .toString()
        .replace('(alive, dead, undead, or fictional)', '(alive, dead, or fictional)')
    );
    await sleep(1000);
    expect(fs.statSync(generatedFilePath)).not.toEqual(initialFileStat);

    // The following changes the vocabulary back
    fs.writeFileSync(
      watchedVocabPath,
      fs
        .readFileSync(watchedVocabPath)
        .toString()
        .replace('(alive, dead, or fictional)', '(alive, dead, undead, or fictional)')
    );
  });

  it('should fail when trying to watch an online resource', async () => {
    const outputDirectory = 'test/generated/watcher/initial';
    del.sync([`${outputDirectory}/*`]);
    expect(() => {
      let watcher = new VocabWatcher(
        new ArtifactGenerator(
          new GeneratorConfiguration(
            {
              vocabListFile: './test/resources/watcher/online-vocab-list.yml',
              outputDirectory,
            },
            undefined
          )
        )
      );
      // Useless line, construction should throw
      if (watcher === undefined) {
        watcher = null;
      }
    }).toThrow();
  });

  it('should not throw when the vocabulary is changed to malformed RDF', async () => {
    const outputDirectory = 'test/generated/watcher/initial';
    del.sync([`${outputDirectory}/*`]);

    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile: './test/resources/watcher/vocab-list.yml',
            outputDirectory,
          },
          undefined
        )
      )
    );
    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if generation was successful
    await sleep(500);

    const watchedVocabPath = './test/resources/watcher/schema-snippet.ttl';
    // The following changes a comment in the vocabulary
    fs.writeFileSync(
      watchedVocabPath,
      fs
        .readFileSync(watchedVocabPath)
        .toString()
        .replace('schema:Person a rdfs:Class ;', 'schema:Person a rdfs:Class')
    );
    await sleep(1000);

    // The following changes the vocabulary back
    fs.writeFileSync(
      watchedVocabPath,
      fs
        .readFileSync(watchedVocabPath)
        .toString()
        .replace('schema:Person a rdfs:Class', 'schema:Person a rdfs:Class ;')
    );
    // Completing this test is proof that nothing was thrown
  });

  it('should not generate when the watcher stops', async () => {
    const outputDirectory = 'test/generated/watcher/initial';
    del.sync([`${outputDirectory}/*`]);

    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile: './test/resources/watcher/incorrect-vocab-list.yml',
            outputDirectory,
          },
          undefined
        )
      )
    );
    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if generation was successful
    await sleep(500);
    // Completing this test is proof that nothing was thrown
  });

  it('should trigger artifact generation on change', async () => {
    const outputDirectory = 'test/generated/watcher/initial';
    del.sync([`${outputDirectory}/*`]);

    const watcher = new VocabWatcher(
      new ArtifactGenerator(
        new GeneratorConfiguration(
          {
            vocabListFile: './test/resources/watcher/vocab-list.yml',
            outputDirectory,
          },
          undefined
        )
      )
    );
    watcher.watch();
    // Starting the watcher is not a blocking call, so we need to add a delay to verify if generation was successful
    await sleep(500);
    const outputDirectoryJava = `${outputDirectory}${ARTIFACT_DIRECTORY_SOURCE_CODE}/Java`;
    const packageHierarchy = 'src/main/java/com/example/java/packagename';
    const generatedFilePath = `${outputDirectoryJava}/${packageHierarchy}/SCHEMA.java`;
    // This is the state of the generated file before the vocabulary gets updated
    const initialFileStat = fs.statSync(generatedFilePath);

    const watchedVocabPath = './test/resources/watcher/schema-snippet.ttl';
    // The following changes a comment in the vocabulary
    fs.writeFileSync(
      watchedVocabPath,
      fs
        .readFileSync(watchedVocabPath)
        .toString()
        .replace('(alive, dead, undead, or fictional)', '(alive, dead, or fictional)')
    );
    await sleep(1000);
    const newerFileStat = fs.statSync(generatedFilePath);
    expect(newerFileStat).not.toEqual(initialFileStat);
    watcher.unwatch();
    // The following changes the vocabulary back
    fs.writeFileSync(
      watchedVocabPath,
      fs
        .readFileSync(watchedVocabPath)
        .toString()
        .replace('(alive, dead, or fictional)', '(alive, dead, undead, or fictional)')
    );
    // There should have been no new generation
    const newestFileStat = fs.statSync(generatedFilePath);
    expect(newerFileStat).toEqual(newestFileStat);
  });
});
