const chokidar = require('chokidar');
const axios = require('axios');
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
        watchList.push(resource);
      }
    }
    return watchList;
  }

  /**
   * Gets the time of the most recent modification for a resource, either local or remote, in POSIX date.
   * @param {*} resource
   */
  static async getResourceLastModificationTime(resource) {
    if (resource.startsWith('http')) {
      return axios({
        method: 'head',
        url: resource,
      })
        .then(response => {
          const lastModifiedDate = Date.parse(response.headers['last-modified']);
          if (Number.isNaN(lastModifiedDate)) {
            throw new Error(`Cannot parse date: ${lastModifiedDate}`);
          }
          return lastModifiedDate;
        })
        .catch(error => {
          throw new Error(`Cannot get last modification time: ${error}`);
        });
    }
    return fs.statSync(resource).mtimeMs;
  }

  async generateIfNecessary() {
    let artifactsOutdated = false;
    const outputDir = this.generator.configuration.configuration.outputDirectory;
    const artifactInfoPath = path.join(outputDir, ARTIFACT_DIRECTORY_ROOT, ARTIFACTS_INFO_FILENAME);
    if (fs.existsSync(artifactInfoPath)) {
      const lastGenerationTime = fs.statSync(artifactInfoPath).mtimeMs;
      const vocabsLastModif = [];
      for (let i = 0; i < this.watchedResources.length; i += 1) {
        vocabsLastModif.push(
          VocabWatcher.getResourceLastModificationTime(this.watchedResources[i])
        );
      }
      await Promise.all(vocabsLastModif).then(values => {
        // The artifact is outdated if one vocabulary is more recent than the artifact
        artifactsOutdated = values.reduce((accumulator, lastModif) => {
          return lastGenerationTime < lastModif || accumulator;
        }, artifactsOutdated);
      });
    } else {
      // There are no artifacts in the target directory.
      artifactsOutdated = true;
    }
    if (artifactsOutdated) {
      this.generator.generate().catch(error => {
        logger(error);
      });
    }
  }

  async watch() {
    // chokidar can't watch online resources, and so we won't ever get an event if an online resource changes.
    // Therefore we need to poll online resources periodically, checking their last-modified response header to
    // determine if an online vocabulary has changed.
    // TODO: Right now, online vocabs are checked only once.
    await this.generateIfNecessary();

    // Add event listeners.
    this.watcher.on('change', eventPath => {
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
