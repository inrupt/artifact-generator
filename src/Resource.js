const rdf = require("rdf-ext");
const rdfFetch = require("@rdfjs/fetch-lite");
const rdfFormats = require("@rdfjs/formats-common");
const stringToStream = require("string-to-stream");
const axios = require("axios");
const fs = require("fs");

const ParserN3 = require("@rdfjs/parser-n3");
const ParserJsonld = require("@rdfjs/parser-jsonld");
const ParserRdfXml = require("rdfxml-streaming-parser").RdfXmlParser;

const SinkMap = require("@rdfjs/sink-map");

const debug = require("debug")("lit-artifact-generator:Resources");

const parserN3 = new ParserN3();
const parserJsonld = new ParserJsonld();
const parserRdfXml = new ParserRdfXml();

// In Jan. 1991, the first Web browser was released, so it is unlikely that the resource has been modified earlier
// This default is used as a generationlast modification date for unreachable online vocabularies to prevent failure
const DEFAULT_MODIFICATION_DATE = 662688059000;

const formats = {
  parsers: new SinkMap([
    ["text/turtle", parserN3],
    ["text/n3", parserN3], // The OLO vocab returns this content type.
    ["application/x-turtle", parserN3], // This is needed as schema.org returns this as the content type.
    ["application/ld+json", parserJsonld], // Activity streams only supports JSON-LD and HTML.
    ["application/rdf+xml", parserRdfXml],

    // The vocab
    // 'https://raw.githubusercontent.com/UKGovLD/publishing-statistical-data/master/specs/src/main/vocab/cube.ttl'
    // returns a 'Content-Type' header of 'text/plain' even though we request Turtle!
    ["text/plain", parserN3],
  ]),
};

module.exports = class Resource {
  /**
   *
   * @param datasetFiles
   * @param termSelectionResource
   */
  constructor(datasetFiles, termSelectionResource) {
    this.datasetFiles = datasetFiles;
    this.termSelectionResource = termSelectionResource;
  }

  async processInputs(processInputsCallback) {
    debug(`Processing input resources: [${this.datasetFiles}]...`);
    const datasetsPromises = this.datasetFiles.map((e) =>
      Resource.readResource(e)
    );

    const datasets = await Promise.all(datasetsPromises);

    let termsSelectionDataset;
    if (this.termSelectionResource) {
      termsSelectionDataset = await Resource.readResource(
        this.termSelectionResource
      );

      // We also add the terms from this resource to our collection of input
      // datasets, since we expect it to contain possible extensions (e.g.,
      // translations of labels or comments into new languages, or possibly
      // completely new terms).
      datasets.push(termsSelectionDataset);
    }

    processInputsCallback(datasets, termsSelectionDataset);
  }

  /**
   * Reads resources, either from a local file or a remote IRI.
   * @param {string} datasetFile path to the file, or IRI.
   */
  static readResource(datasetFile) {
    debug(`Loading resource: [${datasetFile}]...`);
    if (Resource.isOnline(datasetFile)) {
      return rdfFetch(datasetFile, { factory: rdf, formats })
        .then((resource) => {
          return resource.dataset();
        })
        .catch((error) => {
          debug(
            `Encountered error [${error}] while fetching [${datasetFile}], attempting to use previously generated file`
          );
          return undefined;
        });
    }

    return new Promise((resolve) => {
      resolve(this.loadTurtleFileIntoDatasetPromise(datasetFile));
    });
  }

  static loadTurtleFileIntoDatasetPromise(filename) {
    const mimeType = "text/turtle";
    const data = fs.readFileSync(filename, "utf8");

    const rdfParser = rdfFormats.parsers.get(mimeType);
    const quadStream = rdfParser.import(stringToStream(data));
    return rdf.dataset().import(quadStream);
  }

  static async getHttpResourceLastModificationTime(resource) {
    // Note: If being executed from within a Jest test, we can expect to
    // encounter this error:
    //    Error: Cross origin http://localhost forbidden
    // This test-only error can generally be safely ignored, as we're just
    // checking a last-modified time, and fallback to returning 'now'.
    return axios({
      method: "GET",
      url: resource,
    })
      .then((response) => {
        const lastModifiedDate = Date.parse(response.headers["last-modified"]);
        return Number.isNaN(lastModifiedDate)
          ? DEFAULT_MODIFICATION_DATE
          : lastModifiedDate;
      })
      .catch((error) => {
        debug(
          `Failed to lookup Last Modification Time for resource [${resource}]. Error: ${error}`
        );
        return new Date();
      });
  }

  /**
   * Gets the time of the most recent modification for a resource, either local or remote, in POSIX date.
   * @param {*} resource
   */
  static async getResourceLastModificationTime(resource) {
    return this.isOnline(resource)
      ? Resource.getHttpResourceLastModificationTime(resource)
      : fs.statSync(resource).mtimeMs;
  }

  static isOnline(resource) {
    return resource.startsWith("http");
  }

  /**
   * Touches (i.e. updates the last modified time) on the specified file.
   * Note: For testing we allow passing in an instance of 'fs'.
   * @param filename the file to touch.
   * @param fs the file system to use (allows for testing).
   */
  static touchFile(filename, fileSystem) {
    const now = new Date();

    try {
      (fileSystem || fs).utimesSync(filename, now, now);
    } catch (err) {
      fs.closeSync(fs.openSync(filename, "w"));
    }
  }
};

module.exports.DEFAULT_MODIFICATION_DATE = DEFAULT_MODIFICATION_DATE;
