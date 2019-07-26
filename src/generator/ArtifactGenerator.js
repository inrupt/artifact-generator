const fs = require('fs');
// const yaml = require('js-yaml');

const FileGenerator = require('./FileGenerator');
const VocabGenerator = require('./VocabGenerator');

const DatasetHandler = require('../DatasetHandler');

module.exports = class ArtifactGenerator {
  constructor(argv, inquirerProcess) {
    this.argv = argv;
    this.inquirerProcess = inquirerProcess;
  }

  /**
   * If we are bundling vocabs from a list, then we run our inquirer first, then run our generation. But if we are
   * only generating a single vocab, then process our inputs first and then run our inquirer, as our input vocab may
   * have provided suggested default values for our inquirer (e.g. the suggested name of the vocab may come from the
   * vocab itself).
   *
   * @param inquirerProcess
   * @returns {Promise<void>}
   */
  async generate() {
    if (this.argv.vocabListFile) {
      if (this.inquirerProcess) {
        this.argv = await this.inquirerProcess(this.argv);
      }

      await this.generateFromVocabListFile();
    } else {
      this.argv = await new VocabGenerator(this.argv, this.inquirerProcess).generate();
      this.argv.generatedVocabs = [
        { vocabName: this.argv.vocabName, vocabNameUpperCase: this.argv.vocabNameUpperCase },
      ];
    }

    return FileGenerator.createPackagingFiles(this.argv);
  }

  async generateFromVocabListFile() {
    // try {
    //   var doc = yaml.safeLoad(fs.readFileSync(this.argv.vocabListFile, 'utf8'));
    //   console.log(doc);
    // } catch (e) {
    //   console.log(e);
    // }
    //

    // Read the vocab list file and generate a vocab for each valid line entry...
    const vocabGenerationPromises = ArtifactGenerator.extractLinesWithDetails(
      fs.readFileSync(this.argv.vocabListFile, 'utf-8')
    ).map(lineDetails => {
      // Override our vocab inputs using this file line entry
      this.argv.input = lineDetails.inputFiles;
      this.argv.vocabTermsFrom = lineDetails.selectTermsFromFile;

      return new VocabGenerator(this.argv, undefined).generate();
    });

    // Wait for all our vocabs to be generated.
    const datasets = await Promise.all(vocabGenerationPromises);

    // Collect details from each generated vocab (to bundle them all together into our packaging artifact).
    const authors = new Set();
    let description = `Bundle of vocabularies that includes the following:`;
    datasets.forEach(vocabData => {
      description += `\n  ${vocabData.vocabName}: ${vocabData.description}`;
      authors.add(`${vocabData.author}`);
    });

    this.argv.artifactName = `${this.argv.moduleNamePrefix}`;
    this.argv.author = `Vocabularies authored by: ${[...authors].join(', ')}.`;
    this.argv.description = DatasetHandler.escapeStringForJson(description);
  }

  /**
   * Read each line of our file, augment with it's line number (very useful when error reporting), filter out empty or
   * comment lines, extract data on input vocabs and optional term selection file, then generate a vocab for each one.
   *
   * @param fileData
   * @returns Collection of vocab-generation detail objects (one per vocab to be generated).
   */
  static extractLinesWithDetails(fileData) {
    return fileData
      .split(/\r?\n/)
      .map((line, i) => ({ line, lineNumber: i + 1 }))
      .filter(ArtifactGenerator.hasDetails)
      .map(ArtifactGenerator.splitVocabListLine);
  }

  static hasDetails(lineData) {
    const trimmedLine = lineData.line.trim();
    return !(trimmedLine.length === 0 || trimmedLine.startsWith('#'));
  }

  static splitVocabListLine(lineData) {
    const tokens = lineData.line.match(/\S+/g);
    let lastToken = tokens[tokens.length - 1];

    if (lastToken.endsWith(']')) {
      // If we have a term selection filename last, then pop off this token, and remove the delimiter from the end...
      lastToken = tokens.pop().slice(0, -1);

      // If this last token is now empty (e.g. file was specified as '... [ file ]'), then pop again (to get 'file').
      if (lastToken.length === 0) {
        lastToken = tokens.pop();
      }

      // If our last token starts with '[' (e.g. file was specified as '... [file]' or '... [file ]')...
      if (lastToken.startsWith('[')) {
        lastToken = lastToken.substring(1);
        if (lastToken.length === 0) {
          throw new Error(
            `Invalid term selection file - line [${lineData.lineNumber}] appears to have empty term selection filename (i.e. delimited by '[' and ']').`
          );
        }
      } else if (tokens.pop() !== '[') {
        throw new Error(
          `Invalid term selection file - line [${lineData.lineNumber}] appears to have incorrectly specified term selection filename (needs to be delimited by '[' and ']').`
        );
      }

      if (tokens.length === 0) {
        throw new Error(
          `Invalid term selection file - line [${lineData.lineNumber}] appears to have specified a term selection filename [${lastToken}], but no input files!`
        );
      }

      return {
        inputFiles: tokens,
        selectTermsFromFile: lastToken,
        lineNumber: lineData.lineNumber,
      };
    }

    return { inputFiles: tokens, lineNumber: lineData.lineNumber };
  }
};
