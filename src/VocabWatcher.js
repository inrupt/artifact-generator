const chokidar = require("chokidar");
const debug = require("debug")("lit-artifact-generator:VocabWatcher");

class VocabWatcher {
  constructor(generator) {
    this.generator = generator;
    // The watcher overrides the configuration to be no prompt by default
    this.generator.configuration.configuration.noprompt = true;

    this.watcher = chokidar.watch(
      [this.generator.configuration.getInputResources()],
      {
        persistent: true
      }
    );
  }

  async watch() {
    // chokidar can't watch online resources, and so we won't ever get an event if an online resource changes.
    // Therefore we need to poll online resources periodically, checking their last-modified response header to
    // determine if an online vocabulary has changed.
    // TODO: Right now, online vocabs are checked only once.
    await this.generator.generate().catch(error => {
      debug(error);
    });

    // Add event listeners.
    this.watcher.on("change", eventPath => {
      // Triggers the generation when the file changes
      debug(`File ${eventPath} has been changed`);
      this.generator.generate().catch(error => {
        debug(error);
      });
    });
  }

  async unwatch() {
    this.watcher.close();
  }
}

module.exports = VocabWatcher;
