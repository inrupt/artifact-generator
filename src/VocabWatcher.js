const chokidar = require('chokidar');
const logger = require('debug')('lit-artifact-generator:VocabWatcher');

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

  watch() {
    // Add event listeners.
    this.watcher
      .on('add', path => {
        // Triggers the initial generation, when the watcher starts
        logger(`File ${path} has been added`);
        this.generator.generate().catch(error => {
          logger(error);
        });
      })
      .on('change', path => {
        // Triggers the generation when the file changes
        // TODO: Possible optimization: not re-generate everything
        logger(`File ${path} has been changed`);
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
