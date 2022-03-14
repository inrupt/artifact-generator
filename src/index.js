#!/usr/bin/env node

const { processCommandLine } = require("./commandLineProcessor");

try {
  processCommandLine(true, process.argv.slice(2)).then((argv) => {
    // TODO: This watcher clean up should really be inside the watcher code
    //  itself, but for that we need to mock `process.stdin` (to emulate the
    //  developer hitting the 'Enter' key), so just do it here for now!
    if (argv._[0] === "watch") {
      process.stdin.on("data", async () => {
        await argv.unwatchFunction();
        process.exit(0);
      });
    }
  });
} catch (error) {
  const message = `Error running Artifact Generator: [${error.message}]`;
  console.log(message);
  process.exit(-2);
}
