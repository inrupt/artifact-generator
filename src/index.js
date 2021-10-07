#!/usr/bin/env node

const processCommandLine = require("./commandLineProcessor");

try {
  processCommandLine(true, process.argv.slice(2)).then((argv) => {
    // TODO: This watcher clean up should really be inside the watcher code
    //  itself, but for that we need to mock `process.stdin` (to emulate the
    //  developer hitting the 'Enter' key), so just do it here for now!
    if (argv._[0] === "watch") {
      process.stdin.on("data", () => {
        argv.unwatchFunction();
        process.exit(0);
      });
    }
  });

  return 0;
} catch (error) {
  console.log(`Error running Artifact Generator: [${error.toString()}]`);
  return -2;
}
