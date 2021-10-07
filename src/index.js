#!/usr/bin/env node

const processCommandLine = require("./commandLineProcessor");

try {
  processCommandLine(true, process.argv.slice(2)).then((argv) => {
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
