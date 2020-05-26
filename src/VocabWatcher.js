const moment = require("moment");
const chokidar = require("chokidar");
const debug = require("debug")("lit-artifact-generator:VocabWatcher");

class VocabWatcher {
  constructor(generator) {
    this.generator = generator;
    // The watcher overrides the configuration to be no prompt by default
    this.generator.configuration.configuration.noprompt = true;

    const configFile = this.generator.configuration.configuration.vocabListFile;
    debug(`Watching local resources from [${configFile}]:`);

    // Filter out the HTTP resource (since Chokidar only watches files), and
    // ensure we add the configuration file itself to the list of watched
    // resources.
    let count = 0;
    const watchedResourceList = [configFile];
    this.generator.configuration
      .getInputResources()
      .forEach(function (element, index) {
        if (!element.toLowerCase().startsWith("http")) {
          watchedResourceList.push(element);
          debug(`  ${++count}) ${element}`);
        }
      });

    this.watchedResourceList = watchedResourceList;
    this.watcher = chokidar.watch([this.watchedResourceList], {
      persistent: true,
    });
  }

  getWatchedResourceList() {
    return this.watchedResourceList;
  }

  async watch() {
    // chokidar can't watch online resources, and so we won't ever get an event if an online resource changes.
    // Therefore we need to poll online resources periodically, checking their last-modified response header to
    // determine if an online vocabulary has changed.
    // TODO: Right now, online vocabs are checked only once.
    await this.generator
      .generate()
      .then((result) => {
        debug(
          `Successfully watching into directory: [${result.outputDirectory}] - [${result.globMatchPosition} of ${result.globMatchTotal} matched config files].`
        );
      })
      .catch((error) => {
        debug(`Problem generating when initializing watcher: ${error}`);
      });

    // Add event listeners.
    this.watcher.on("change", (eventPath) => {
      // Triggers the generation when the file changes
      const now = moment();
      debug(`*****************************************************`);
      debug(
        `File [${eventPath}] has changed at [${now.format(
          "YYYY-MM-DD HH:mm:ss"
        )}], regenerating...`
      );

      // If the changed file was a configuration file, then force the
      // re-generation of all resources (but make sure to restore the force flag
      // afterwards).
      const originalForce = this.generator.configuration.configuration.force;
      if (
        eventPath.toLowerCase().endsWith(".yml") ||
        eventPath.toLowerCase().endsWith(".yaml")
      ) {
        this.generator.configuration.configuration.force = true;
      }

      this.generator
        .generate()
        .then((result) => {
          debug(
            `...completed regeneration after file [${eventPath}] changed at [${now.format(
              "YYYY-MM-DD HH:mm:ss"
            )}].`
          );
        })
        .catch((error) => {
          debug(error);
        })
        .finally(() => {
          debug(`*****************************************************`);
          this.generator.configuration.configuration.force = originalForce;
        });
    });
  }

  async unwatch() {
    this.watcher.close();
  }
}

module.exports = VocabWatcher;
