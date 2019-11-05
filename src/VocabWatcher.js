const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const logger = require('debug')('lit-artifact-generator:VocabWatcher');

const {
  ARTIFACT_DIRECTORY_ROOT,
  ARTIFACTS_INFO_FILENAME,
} = require('./generator/ArtifactGenerator');

class VocabWatcher {
  constructor(generator) {
    this.generator = generator;
    this.watchedResources = VocabWatcher.createResourceWatchlist(
      generator.configuration.configuration.vocabList
    );

    this.watcher = chokidar.watch([this.watchedResources], {
      persistent: true,
    });
  }

  /**
   * This function takes a list of vocab configuration objects (see VocabularyConfigurator) to extract the resources to watch.
   * It throws an error if said resources are not local files.
   * @param {array} vocabList
   */
  static createResourceWatchlist(vocabList) {
    const watchList = [];
    for (let i = 0; i < vocabList.length; i += 1) {
      for (let j = 0; j < vocabList[i].inputResources.length; j += 1) {
        const resource = vocabList[i].inputResources[j];
        if (resource.startsWith('http')) {
          throw new Error(
            `Cannot watch online resource [${resource}]. The watcher only watches local files.`
          );
        }
        watchList.push(resource);
      }
    }
    return watchList;
  }

  static getResourceLastModificationTime(resource) {
    let lastModif;
    if (!resource.startsWith('http')) {
      lastModif = fs.statSync(resource).mtimeMs;
    }
    return lastModif;
  }

  generateIfNecessary() {
    let artifactsOutdated = false;
    const outputDir = this.generator.configuration.configuration.outputDirectory;
    const artifactInfoPath = path.join(outputDir, ARTIFACT_DIRECTORY_ROOT, ARTIFACTS_INFO_FILENAME);
    if (fs.existsSync(artifactInfoPath)) {
      const lastGenerationTime = fs.statSync(artifactInfoPath).mtimeMs;
      for (let i = 0; i < this.watchedResources.length; i += 1) {
        const vocabLastGeneration = VocabWatcher.getResourceLastModificationTime(
          this.watchedResources[i]
        );
        artifactsOutdated = lastGenerationTime < vocabLastGeneration || artifactsOutdated;
      }
    } else {
      // There is no artifacts in the target directory.
      artifactsOutdated = true;
    }
    if (artifactsOutdated) {
      this.generator.generate().catch(error => {
        logger(error);
      });
    }
  }

  watch() {
    // Add event listeners.
    this.watcher
      .on('add', eventPath => {
        // Triggers the initial generation, when the watcher starts
        logger(`File ${eventPath} has been added`);
        this.generateIfNecessary();
      })
      .on('change', eventPath => {
        // Triggers the generation when the file changes
        logger(`File ${eventPath} has been changed`);
        this.generator.generate().catch(error => {
          logger(error);
        });
      });
  }

  async unwatch() {
    this.watcher.close();
  }
}

module.exports = VocabWatcher;
