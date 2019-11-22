const rdf = require('rdf-ext');
const rdfFetch = require('@rdfjs/fetch-lite');
const axios = require('axios');
const fs = require('fs');

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

    // The vocab
    // 'https://raw.githubusercontent.com/UKGovLD/publishing-statistical-data/master/specs/src/main/vocab/cube.ttl'
    // returns a 'Content-Type' header of 'text/plain' even though we request Turtle!
    ['text/plain', parserN3],
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
  constructor(datasetFiles, vocabTermsFromResource) {
    this.datasetFiles = datasetFiles;
    this.vocabTermsFromResource = vocabTermsFromResource;
  }

  async processInputs(processInputsCallback) {
    logger(`Processing datasetFiles: [${this.datasetFiles}]...`);
    const datasetsPromises = this.datasetFiles.map(e => Resources.readResource(e));

    const datasets = await Promise.all(datasetsPromises);

    let vocabTermsFromDataset;
    if (this.vocabTermsFromResource) {
      vocabTermsFromDataset = await Resources.readResource(this.vocabTermsFromResource);

      // We also add the terms from this resource to our collection of input datasets, since we expect it to contain
      // possible extensions (e.g. translations of labels of comments into new languages, or possibly completely new
      // terms).
      datasets.push(vocabTermsFromDataset);
    }

    processInputsCallback(datasets, vocabTermsFromDataset);
  }

  /**
   * Reads resources, either from a local file or a remote IRI.
   * @param {string} datasetFile path to the file, or IRI.
   */
  static readResource(datasetFile) {
    logger(`Loading resource: [${datasetFile}]...`);
    if (datasetFile.startsWith('http')) {
      return rdfFetch(datasetFile, { factory: rdf, formats }).then(resource => {
        return resource.dataset();
      });
    }

    return new Promise(resolve => {
      resolve(LitUtils.loadTurtleFileIntoDatasetPromise(`${datasetFile}`));
    });
  }

  static async getHttpResourceLastModificationTime(resource) {
    return axios({
      method: 'head',
      url: resource,
    })
      .then(response => {
        const lastModifiedDate = Date.parse(response.headers['last-modified']);
        if (Number.isNaN(lastModifiedDate)) {
          throw new Error(`Cannot parse date: ${lastModifiedDate}`);
        }
        return lastModifiedDate;
      })
      .catch(error => {
        throw new Error(`Cannot get last modification time: ${error}`);
      });
  }

  /**
   * Gets the time of the most recent modification for a resource, either local or remote, in POSIX date.
   * @param {*} resource
   */
  static async getResourceLastModificationTime(resource) {
    return resource.startsWith('http')
      ? Resources.getHttpResourceLastModificationTime(resource)
      : fs.statSync(resource).mtimeMs;
  }
};
