const rdf = require('rdf-ext');
const rdfFetch = require('rdf-fetch-lite');
const N3Parser = require('rdf-parser-n3');
const ParserJsonld = require('@rdfjs/parser-jsonld');
const logger = require('debug')('lit-artifact-generator:Resources');

const { LitUtils } = require('@lit/vocab-term');

const formats = {
  parsers: new rdf.Parsers({
    'text/turtle': N3Parser,
    'text/n3': N3Parser, // The OLO vocab returns this content type.
    'application/x-turtle': N3Parser, // This is needed as schema.org returns this as the content type.
    'application/ld+json': ParserJsonld, // Activity streams only supports JSON-LD and HTML.
    // 'application/rdf+xml': ???, // No XML parser available at the moment (https://github.com/rdf-ext/documentation).
  }),
};

module.exports = class Resources {
  /**
   *
   * @param datasetFiles
   * @param vocabTermsFromFile
   * @param fileResourcesRelativeTo If we load resources locally from the file system, make them relative to this path
   * (e.g. for reading resources from a vocab list file that can be anywhere, all local resources referenced in it
   * should be relative to wherever that list file itself is!).
   */
  constructor(datasetFiles, vocabTermsFromFile, fileResourcesRelativeTo) {
    this.datasetFiles = datasetFiles;
    this.subjectsOnlyFile = vocabTermsFromFile;
    this.fileResourcesRelativeTo = fileResourcesRelativeTo;
  }

  async processInputs(processInputsCallback) {
    logger(`Procesing datasetFiles: [${this.datasetFiles}]...`);
    if (this.datasetFiles === undefined) {
      logger(`NULL...`);
    }
    const datasetsPromises = this.datasetFiles.map(e => this.readResource(e));

    const datasets = await Promise.all(datasetsPromises);

    let subjectsOnlyDataset;
    if (this.subjectsOnlyFile) {
      subjectsOnlyDataset = await this.readResource(this.subjectsOnlyFile);
      datasets.push(subjectsOnlyDataset); // Adds the extension to the full data set.
    }

    processInputsCallback(datasets, subjectsOnlyDataset);
  }

  readResource(datasetFile) {
    logger(`Loading resource: [${datasetFile}]...`);
    if (datasetFile.startsWith('http')) {
      // [PMcB] - Fails trying to read the Activity Streams vocab, so tried
      // this manual Parsing of JSON-LD, but I don't know how to construct the
      // input properly...
      //
      // const parserJsonld = new ParserJsonld()
      // const output = parserJsonld.import(input)
      //
      // output.on('data', quad => {
      //   console.log(`${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`)
      // })

      return rdfFetch(datasetFile, { formats }).then(resource => {
        return resource.dataset();
      });
    }

    return LitUtils.loadTurtleFileIntoDatasetPromise(
      `${this.fileResourcesRelativeTo}/${datasetFile}`
    );
  }
};
