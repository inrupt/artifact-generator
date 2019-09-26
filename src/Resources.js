const rdf = require('rdf-ext');
const rdfFetch = require('@rdfjs/fetch-lite');

const ParserN3 = require('@rdfjs/parser-n3');
const ParserJsonld = require('@rdfjs/parser-jsonld');
const ParserRdfXml = require('rdfxml-streaming-parser').RdfXmlParser;

const SinkMap = require('@rdfjs/sink-map');

const logger = require('debug')('lit-artifact-generator:Resources');

const { LitUtils } = require('@lit/vocab-term');

const parserN3 = new ParserN3();
const parserJsonld = new ParserJsonld();
const parserRdfXml = new ParserRdfXml();

const formats = {
  parsers: new SinkMap([
    ['text/turtle', parserN3],
    ['text/n3', parserN3], // The OLO vocab returns this content type.
    ['application/x-turtle', parserN3], // This is needed as schema.org returns this as the content type.
    ['application/ld+json', parserJsonld], // Activity streams only supports JSON-LD and HTML.
    ['application/rdf+xml', parserRdfXml],
  ]),
};

module.exports = class Resources {
  /**
   *
   * @param datasetFiles
   * @param vocabTermsFromResource
   * @param fileResourcesRelativeTo If we load resources locally from the file system, make them relative to this path
   * (e.g. for reading resources from a vocab list file that can be anywhere, all local resources referenced in it
   * should be relative to wherever that list file itself is!).
   */
  constructor(datasetFiles, vocabTermsFromResource, fileResourcesRelativeTo) {
    this.datasetFiles = datasetFiles;
    this.vocabTermsFromResource = vocabTermsFromResource;
    this.fileResourcesRelativeTo = fileResourcesRelativeTo;
  }

  async processInputs(processInputsCallback) {
    logger(`Processing datasetFiles: [${this.datasetFiles}]...`);
    const datasetsPromises = this.datasetFiles.map(e => this.readResource(e));

    const datasets = await Promise.all(datasetsPromises);

    let vocabTermsFromDataset;
    if (this.vocabTermsFromResource) {
      vocabTermsFromDataset = await this.readResource(this.vocabTermsFromResource);

      // We also add the terms from this resource to our collection of input datasets, since we expect it to contain
      // possible extensions (e.g. translations of labels of comments into new languages, or possibly completely new
      // terms).
      datasets.push(vocabTermsFromDataset);
    }

    processInputsCallback(datasets, vocabTermsFromDataset);
  }

  readResource(datasetFile) {
    logger(`Loading resource: [${datasetFile}]...`);
    if (datasetFile.startsWith('http')) {
      return rdfFetch(datasetFile, { factory: rdf, formats }).then(resource => {
        return resource.dataset();
      });
    }

    return LitUtils.loadTurtleFileIntoDatasetPromise(
      `${this.fileResourcesRelativeTo}/${datasetFile}`
    );
  }
};
