const rdf = require("rdf-ext");
const rdfFetch = require("@rdfjs/fetch-lite");
const rdfFormats = require("@rdfjs/formats-common");
const stringToStream = require("string-to-stream");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

const ParserN3 = require("@rdfjs/parser-n3");
const ParserJsonld = require("@rdfjs/parser-jsonld");
const ParserRdfXml = require("rdfxml-streaming-parser").RdfXmlParser;
const ParserRdfa = require("rdfa-streaming-parser").RdfaParser;

const N3 = require("n3");

const SinkMap = require("@rdfjs/sink-map");

const debug = require("debug")("lit-artifact-generator:Resources");

const FileGenerator = require("./generator/FileGenerator");

// In January 1991, the first Web browser was released, so it's unlikely that
// the resource has been modified earlier. This default is used as a generation
// last modification date for unreachable online vocabularies to prevent
// failure.
const DEFAULT_MODIFICATION_DATE = 662688059000;

const parserN3 = new ParserN3();

const formats = {
  parsers: new SinkMap([
    ["text/turtle", parserN3],
    ["text/n3", parserN3], // The OLO vocab returns this content type.
    ["application/x-turtle", parserN3], // This is needed as schema.org returns this as the content type.
    ["application/ld+json", new ParserJsonld()], // Activity streams only supports JSON-LD and HTML.

    // For these parsers we may need to manually set the `baseIRI` on a
    // per-vocab basis, which we can only do in the constructor. So no point in
    // constructing a shared parser instance here at all...
    // See issue here: https://github.com/rdfjs/rdfxml-streaming-parser.js/issues/46
    // ["application/rdf+xml", new ParserRdfXml()],
    // ["text/html", new ParserRdfa( { baseIRI: `${namespace} })],

    // The vocab
    // 'https://raw.githubusercontent.com/UKGovLD/publishing-statistical-data/master/specs/src/main/vocab/cube.ttl'
    // returns a 'Content-Type' header of 'text/plain' even though we request Turtle!
    ["text/plain", parserN3],
  ]),
};

/**
 * Prefixes used for writing RDF in serializations that support prefixes, such
 * as Turtle (which we might do to cache local copies of vocabularies, for
 * example). These prefixes simply make the resulting serialization easier for
 * humans to read.
 *
 * @type {{schema: string, void: string, rdf: string, owl: string, xsd: string, skos: string, dcterms: string, rdfs: string, time: string, vann: string}}
 */
const prefixes = {
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  owl: "http://www.w3.org/2002/07/owl#",
  skos: "http://www.w3.org/2004/02/skos/core#",
  void: "http://rdfs.org/ns/void#",
  vann: "http://purl.org/vocab/vann/",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  schema: "http://schema.org/",
  dcterms: "http://purl.org/dc/terms/",
  time: "http://www.w3.org/2006/time#",
};

module.exports = class Resource {
  /**
   *
   * @param inputResources
   * @param termSelectionResource
   */
  constructor(inputResources, termSelectionResource) {
    this.inputResources = inputResources;
    this.termSelectionResource = termSelectionResource;
  }

  async processInputs(config, processInputsCallback) {
    debug(`Processing input resources: [${this.inputResources}]...`);
    const datasetsPromises = this.inputResources.map((inputResource) => {
      return Resource.readResource(inputResource).catch((rootCause) =>
        Resource.attemptToReadGeneratedResource(
          config,
          inputResource,
          rootCause
        )
      );
    });

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

  static attemptToReadGeneratedResource(config, inputResource, rootCause) {
    const cacheDirectory = config.storeLocalCopyOfVocabDirectory;
    if (cacheDirectory == undefined) {
      throw new Error(
        `No local cached vocab directory to fallback to when processing resource [${inputResource}] - root cause of failure: [${rootCause}]`
      );
    }

    debug(
      `Attempting to use previously cached vocab file for resource [${inputResource}] from directory [${cacheDirectory}]...`
    );

    // Assume the input resource is actually the vocab namespace (which it
    // should be, generally!).
    const formatNamespace = Resource.formatUrlWithFilenameCharacters(
      inputResource
    );

    // Scan our provided directory for any pre-existing copies of this
    // vocabulary, sorting alphabetically which will get us the most recently
    // cached version...
    const failureMessage = `No locally cached vocab found for input resource [${inputResource}] in directory [${cacheDirectory}] (either our local cache was cleared out, or we've never successfully read this vocabulary) - root cause of failure: [${rootCause}]`;
    try {
      const files = fs
        .readdirSync(cacheDirectory)
        .filter((filename) => filename.endsWith(`__${formatNamespace}.ttl`))
        .sort((a, b) => b.localeCompare(a));

      // ...if no existing copies of this vocabulary, report the original problem.
      if (files.length === 0) {
        throw new Error(failureMessage);
      }

      // Get the latest cached version...
      return Resource.loadTurtleFileIntoDatasetPromise(
        path.join(cacheDirectory, files[0])
      );
    } catch (error) {
      throw new Error(
        `Context: [${failureMessage}] - local cache processing error: [${error}]`
      );
    }
  }

  /**
   * Reads resources, either from a local file or a remote IRI.
   * @param {string} inputResource path to the file, or IRI.
   */
  static readResource(inputResource) {
    debug(`Loading resource: [${inputResource}]...`);
    if (Resource.isOnline(inputResource)) {
      // This is unfortunate, but we can't reuse single parser instances for
      // these serializations across vocabs, since we may need the `baseIRI` to
      // be set for each vocab, and we can only do this via their respective
      // constructors.
      // See issue here: https://github.com/rdfjs/rdfxml-streaming-parser.js/issues/46
      formats.parsers.set(
        "application/rdf+xml",
        new ParserRdfXml({ baseIRI: inputResource })
      );

      formats.parsers.set(
        "text/html",
        new ParserRdfa({ baseIRI: inputResource })
      );

      return rdfFetch(inputResource, { factory: rdf, formats })
        .then((resource) => {
          return resource.dataset();
        })
        .catch((error) => {
          const message = `Encountered error while attempting to fetch resource [${inputResource}]: ${error}`;
          debug(message);
          throw new Error(message);
        });
    }

    return new Promise((resolve) => {
      resolve(this.loadTurtleFileIntoDatasetPromise(inputResource));
    });
  }

  /**
   * Stores the specified RDF resource as a local file in the specified
   * directory.
   *
   * Note: The format of the locally save filename is as follows:
   *   <Vocab prefix>-<Timestamp of generation>-<Digest of vocab>__<Encoded vocab namespace>.ttl
   *
   *   - <Vocab prefix> - to make the filename easily readable. Prefixes *should*
   *     be unique to vocabs.
   *   - <Digest of vocab> - a digest to ensure we only store new, changed,
   *     versions of a vocabulary.
   *   - <Timestamp of generation> - the date and time the local file was
   *     generated.
   *   - <Encoded vocab namespace> - the full namespace of the vocabulary
   *     (encoded to replace invalid filename characters).
   *   - .ttl - files are stored as Turtle (for human readability).
   *
   * @param directory the directory in which to store the local copy
   * @param vocabName the short-form name of the vocab (e.g., the vocab prefix)
   * @param vocabNamespace the full namespace of the vocab
   * @param dataset the vocabulary as an RDF dataset
   */
  static storeLocalCopyOfResource(
    directory,
    vocabName,
    vocabNamespace,
    dataset,
    doneCallback
  ) {
    const writer = new N3.Writer({
      format: "text/turtle",
      prefixes,
    });

    // We can't simply digest (or hash) the serialized RDF, due to potential of
    // having pesky Blank Nodes. So as we serialize, we also need to collect
    // that same serialization with Blank Nodes removed.
    let vocabDigestInput = "";

    dataset.forEach((quad) => {
      writer.addQuad(quad);
      vocabDigestInput = vocabDigestInput.concat(
        Resource.quadToStringIgnoringBNodes(quad)
      );
    });

    writer.end((error, result) => {
      // We should catch and report writer errors, but not sure how to mock this
      // out for our tests to cover this...
      // if (error) {
      //   throw new Error(
      //     `Failed to serialize RDF output as a string for vocabulary [${vocabName}] (when attempting to write to file [${outputFilename}]), reason: ${error}`
      //   );
      // }

      FileGenerator.createDirectoryIfNotExist(directory);

      // Produce a simple digest (or hash) of the RDF vocabulary. This allows us
      // easily determine if the contents of the vocabulary have changed since
      // we previously ran this same digest process.
      const vocabDigest = Resource.simpleStringHash(vocabDigestInput);

      // Format our vocab namespace to only include valid filename characters.
      const formatNamespace = Resource.formatUrlWithFilenameCharacters(
        vocabNamespace
      );

      // Scan our provided directory for any pre-existing copies of this
      // vocabulary with a matching digest...
      const files = fs
        .readdirSync(directory)
        .filter((filename) =>
          filename.endsWith(`-${vocabDigest}__${formatNamespace}.ttl`)
        );

      // ...if no existing copies of this vocabulary, store a copy now.
      if (files.length === 0) {
        const outputFilename = path.join(
          directory,
          `${vocabName}-${moment().format()}-${vocabDigest}__${formatNamespace}.ttl`
        );

        // File errors will just propagate back up. (We should add specific
        // try/catch handling here, but that would then need mocking 'fs'!)
        fs.writeFileSync(outputFilename, result.toString());
      }

      if (doneCallback) {
        doneCallback();
      }
    });
  }

  /**
   * Replaces all URL characters that are invalid in filenames with a hypen "-".
   *
   * @param url the URL to format using only valid filename characters
   * @returns {*}
   */
  static formatUrlWithFilenameCharacters(url) {
    return url.replace(/[/\\?%*:|"<>]/g, "-");
  }

  /**
   * For our purposes here, we just need a simple hash of an RDF vocab, and of
   * course Blank Nodes complicate hashing - so we just ignore them!
   *
   * @param quad the quad to string-ify
   * @returns {string}
   */
  static quadToStringIgnoringBNodes(quad) {
    return (quad.subject.termType === "BlankNode"
      ? "BNode"
      : quad.subject.value
    )
      .concat(quad.predicate.value)
      .concat(
        quad.object.termType === "BlankNode" ? "BNode" : quad.object.value
      );
  }

  static simpleStringHash(value) {
    var hash = 0,
      i,
      chr;

    if (value.length === 0) {
      return hash;
    }

    for (i = 0; i < value.length; i++) {
      chr = value.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer.
    }

    return hash;
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
    } catch (error) {
      fs.closeSync(fs.openSync(filename, "w"));
    }
  }
};

module.exports.DEFAULT_MODIFICATION_DATE = DEFAULT_MODIFICATION_DATE;
