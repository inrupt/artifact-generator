#!/usr/bin/env node

// Normally we'd only want to mock out local storage for testing, but in this
// case we want to use our generated vocabularies that depend on
// localStorage for runtime context (e.g. the currently selected language).
// So since we want to use those vocabularies in our Node application here,
// they need a mocked local storage to work with.
require("mock-local-storage");

const path = require("path");
const debugModule = require("debug");
const yargs = require("yargs");
const App = require("./App");
const { getArtifactDirectoryRoot } = require("./Util");
const CommandLine = require("./CommandLine");

const debug = debugModule("artifact-generator:commandLineProcessor");

const SUPPORTED_COMMANDS = [
  CommandLine.COMMAND_GENERATE(),
  CommandLine.COMMAND_INITIALIZE(),
  CommandLine.COMMAND_WATCH(),
  CommandLine.COMMAND_VALIDATE(),
];

function validateCommandLine(argv) {
  // argv._ contains the commands passed to the program
  if (argv._.length !== 1) {
    // Only one command is expected
    throw new Error(
      `Exactly one command is expected (got [${
        argv._.length
      }], [${argv._.toString()}]), expected one of [${SUPPORTED_COMMANDS}]. (Ensure wildcard file patterns are enclosed in double-quotes!)`,
    );
  }

  if (typeof argv._[0] === "number") {
    throw new Error(
      `Invalid command: command must be a string, but we got the number [${argv._[0]}]. Expected one of [${SUPPORTED_COMMANDS}].`,
    );
  }

  if (SUPPORTED_COMMANDS.indexOf(argv._[0]) === -1) {
    throw new Error(
      `Unknown command: [${argv._[0]}] is not a recognized command. Expected one of [${SUPPORTED_COMMANDS}].`,
    );
  }
  return true;
}

function processCommandLine(exitOnFail, commandLineArgs) {
  // To support multiple unit tests, create an instance of Yargs per
  // execution (otherwise the Yargs state gets corrupted).
  const yargsInstance = yargs();

  return (
    yargsInstance
      .help()
      .fail(false)
      .exitProcess(exitOnFail)
      .command(
        CommandLine.COMMAND_GENERATE(),
        "Generate code artifacts from RDF vocabularies.",
        (yargs) =>
          yargs
            .alias("i", "inputResources")
            .array("inputResources")
            .describe(
              "inputResources",
              "One or more ontology resources (i.e. local RDF files, or HTTP URI's) used to generate source-code artifacts representing the contained vocabulary terms.",
            )

            .alias("l", "vocabListFile")
            .describe(
              "vocabListFile",
              "Name of a YAML file providing a list of individual vocabs to bundle together into a single artifact (or potentially multiple artifacts for multiple programming languages).",
            )

            .alias("li", "vocabListFileIgnore")
            .describe(
              "vocabListFileIgnore",
              "Globbing pattern for files or directories to ignore when searching for vocabulary list files.",
            )

            // This override is really only relevant if we are generating from a
            // single vocabulary - if used with a vocab list file, it only applies
            // to the first vocabulary listed.
            .alias("no", "namespaceIriOverride")
            .describe(
              "namespaceIriOverride",
              "Overrides our namespace determination code to provide an explicit namespace IRI.",
            )

            .alias("lv", "solidCommonVocabVersion")
            .describe(
              "solidCommonVocabVersion",
              "The version of the Vocab Term to depend on.",
            )
            .default("solidCommonVocabVersion", "^1.4.0")

            .alias("in", "runNpmInstall")
            .boolean("runNpmInstall")
            .describe(
              "runNpmInstall",
              "If set will attempt to NPM install the generated artifact from within the output directory.",
            )
            .default("runNpmInstall", false)

            .alias("p", "publish")
            .array("publish")
            .describe(
              "publish",
              "the values provided to this option will be used as keys to trigger publication according to configurations in the associated YAML file. If not using a YAML file, this option can be used as a flag.",
            )

            .alias("tsr", "termSelectionResource")
            .describe(
              "termSelectionResource",
              "Generates Vocab Terms from only the specified ontology resource (file or IRI).",
            )

            .alias("av", "artifactVersion")
            .describe(
              "artifactVersion",
              "The version of the artifact(s) to be generated.",
            )
            .default("artifactVersion", "0.0.1")

            .alias("mnp", "moduleNamePrefix")
            .describe(
              "moduleNamePrefix",
              "A prefix for the name of the output module",
            )
            .default("moduleNamePrefix", "generated-vocab-")

            .alias("nr", "npmRegistry")
            .describe(
              "npmRegistry",
              "The NPM Registry where artifacts will be published",
            )
            .default("npmRegistry", "http://localhost:4873")

            .alias("w", "runWidoco")
            .boolean("runWidoco")
            .describe(
              "runWidoco",
              "If set will run Widoco to generate documentation for this vocabulary.",
            )

            .alias("s", "supportBundling")
            .boolean("supportBundling")
            .describe(
              "supportBundling",
              "If set will use bundling support within generated artifact (currently supports Rollup only).",
            )
            .default("supportBundling", false)

            .boolean("force")
            .describe(
              "force",
              "Forces generation, even if the target artifacts are considered up-to-date",
            )
            .alias("f", "force")
            .default("force", false)

            .boolean("reportBestPracticeCompliance")
            .describe(
              "reportBestPracticeCompliance",
              "For each vocabulary, add a report on its compliance to the Inrupt vocabulary Best Practice guidelines (added to the file's comment header)",
            )
            .alias("bp", "reportBestPracticeCompliance")
            .default("reportBestPracticeCompliance", true)

            .boolean("clearOutputDirectory")
            .describe(
              "clearOutputDirectory",
              "Deletes the entire output directory before generation",
            )
            .alias("c", "clearOutputDirectory")
            .default("clearOutputDirectory", false)

            // Must provide either an input vocab file, or a file containing a
            // list of vocab files (but how can we demand at least one of these
            // two...?).
            .conflicts("inputResources", "vocabListFile")
            .strict(),
        (argv) => {
          if (!argv.inputResources && !argv.vocabListFile) {
            const message =
              "You must provide input, either a single vocabulary using '--inputResources' (e.g. a local RDF file, or a URL that resolves to an RDF vocabulary), or a YAML file using '--vocabListFile' listing multiple vocabularies.";
            debugModule.enable("artifact-generator:*");
            debug(message);
            throw new Error(message);
          }
          return runGeneration(argv);
        },
      )
      .command(
        CommandLine.COMMAND_INITIALIZE(),
        "Initializes a configuration YAML file used for fine-grained " +
          "control of artifact generation.",
        (yargs) => yargs,
        (argv) => {
          return runInitialization(argv);
        },
      )
      .command(
        CommandLine.COMMAND_VALIDATE(),
        "Validates a configuration YAML file used for artifact generation.",
        (yargs) =>
          yargs
            .alias("l", "vocabListFile")
            .describe(
              "vocabListFile",
              "Name of a YAML file providing a list of individual vocabs to bundle together into a single artifact (or potentially multiple artifacts for multiple programming languages).",
            )
            .demandOption(["vocabListFile"]),
        (argv) => {
          return runValidation(argv);
        },
      )
      .command(
        CommandLine.COMMAND_WATCH(),
        "Starts a process watching the configured vocabulary" +
          " resources, and automatically re-generates artifacts whenever it detects" +
          " a vocabulary change.",
        (yargs) =>
          yargs
            .alias("l", "vocabListFile")
            .describe(
              "vocabListFile",
              "Name of a YAML file providing a list of individual vocabs to bundle together into a single artifact (or potentially multiple artifacts for multiple programming languages).",
            )
            .demandOption(["vocabListFile"]),
        (argv) => {
          return runWatcher(argv);
        },
      )

      // The following options are shared between the different commands
      .alias("q", "quiet")
      .boolean("quiet")
      .describe(
        "quiet",
        `If set will not display logging output to console (but you can still use the DEBUG environment variable, set to 'artifact-generator:*').`,
      )
      .default("quiet", false)

      .alias("np", "noPrompt")
      .boolean("noPrompt")
      .describe(
        "noPrompt",
        "If set will not ask any interactive questions and will attempt to perform artifact generation automatically.",
      )
      .default("noPrompt", false)

      .alias("o", "outputDirectory")
      .describe(
        "outputDirectory",
        "The output directory for the" +
          " generated artifacts (defaults to the current directory).",
      )
      .default("outputDirectory", ".")
      .check(validateCommandLine)
      .parse(commandLineArgs)
  );
}

function configureLog(argv) {
  // Unless specifically told to be quiet (i.e. no logging output, although that
  // will still be overridden by the DEBUG environment variable!), then
  // determine if any application-specific namespaces have been enabled. If they
  // haven't been, then turn them all on.
  if (!argv.quiet) {
    // Retrieve all currently enabled debug namespaces (and then restore them!).
    const namespaces = debugModule.disable();
    debugModule.enable(namespaces);

    // Unless our debug logging has been explicitly configured, turn all
    // debugging on.
    if (namespaces.indexOf("artifact-generator") === -1) {
      debugModule.enable("artifact-generator:*");
    }
  }
}

function runGeneration(argv) {
  configureLog(argv);
  return new App(argv)
    .run()
    .then((data) => {
      debug(
        `\nGeneration process successful to directory [${path.join(
          data.outputDirectory,
          getArtifactDirectoryRoot(data),
        )}]!`,
      );
    })
    .catch((error) => {
      const message = `Generation process failed: [${error}]`;
      debug(message);
      throw new Error(message);
    });
}

function runInitialization(argv) {
  configureLog(argv);
  // Note: No `.catch()` block needed here, as initialization can't fail (even
  // using weird characters (e.g., '@#$!*&^') in the output directory name
  // won't throw on Linux).
  new App(argv).init().then((data) => {
    debug(`\nSuccessfully initialized configuration file [${data}]`);
  });
}

async function runValidation(argv) {
  configureLog(argv);
  return await new App(argv)
    .validate()
    .then(() => {
      debug(`\nThe provided configuration is valid`);
    })
    .catch((error) => {
      const message = `Configuration validation failed: [${error}]`;
      debug(message);
      throw new Error(message);
    });
}

async function runWatcher(argv) {
  configureLog(argv);

  try {
    const app = new App(argv);
    const watcherCount = await app.watch();
    const plural = watcherCount !== 1;
    debug(
      `\nSuccessfully initialized file watcher${
        plural ? "s" : ""
      } on [${watcherCount}] vocabulary bundle configuration file${
        plural ? "s" : ""
      }.`,
    );

    debug("Press Enter to terminate");

    // Pass back our cleanup function.
    argv.unwatchFunction = async () => {
      await app.unwatch();
    };
  } catch (error) {
    const message = `Failed to initialise watcher: [${error.message}]`;
    debug(message);
    throw new Error(message);
  }
}

module.exports.processCommandLine = processCommandLine;
module.exports.configureLog = configureLog;
