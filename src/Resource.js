const rdf = require("rdf-ext");
const rdfFetch = require("@rdfjs/fetch-lite");
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

const debug = require("debug")("artifact-generator:Resources");

const Util = require("./Util");
const FileGenerator = require("./generator/FileGenerator");

// We only need to instantiate these parsers once (whereas some parsers we
// need to instantiate per-vocab to allow us set the 'baseIri').
const parserJsonld = new ParserJsonld();

// Our generation process can produce multiple artifacts per vocabulary, so we
// cache vocab resources to prevent reading them repeatedly.
let cachedResources = new Map();
// But we also need the ability to remove cached resources, since our vocab
// watcher is used to detect vocab changes, in which case we specifically want
// to re-read the changed resource.
function clearResourceFromCache(resource) {
  const normalizedResource = Util.normalizePath(resource);
  debug(`Clear resource [${normalizedResource}] from cache.`);
  cachedResources.delete(normalizedResource);
}

// In January 1991, the first Web browser was released, so it's unlikely that
// the resource has been modified earlier. This default is used as a generation
// last modification date for unreachable online vocabularies to prevent
// failure.
const DEFAULT_MODIFICATION_DATE = 662688059000;

// We need to explicitly stipulate our HTTP Accept header so that we favour
// Turtle, as some vocabs can default to returning RDFa triples that are a
// smaller, and very different, set of triples (e.g., the LDP vocab).
// We can't provide the 'q' values in the SinkMap of formats, since the parser
// to use is looked up from the response content-type, which won't have the 'q'
// parameter (so the parser lookup won't match).
const RDF_ACCEPT_HEADER =
  "text/turtle;q=1.0, application/x-turtle;q=1.0, text/n3;q=0.8, application/ld+json;q=0.7, text/html;q=0.4, text/plain;q=0.3, application/rdf+xml;q=0.1";

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
  schema: "https://schema.org/",
  dcterms: "http://purl.org/dc/terms/",
  time: "http://www.w3.org/2006/time#",
};

module.exports = class Resource {
  /**
   *
   * @param inputResources
   * @param termSelectionResource
   * @param vocabAcceptHeaderOverride the HTTP Accept header value to use (some
   * vocab servers don't respect the `q` qualifier, e.g.,
   * "https://w3id.org/survey-ontology#")
   * @param vocabContentTypeHeaderOverride HTTP Content Type header override
   * (some vocab servers (e.g., Resume-RDF) return a content type of
   * 'text/plain' even though the response is RDF/XML. This value allows us
   * override the server header so that we can use the correct parser.
   * @param vocabContentTypeHeaderFallback HTTP Content Type header (some vocab
   * servers (e.g., DOAP) don't return a Content Type header, meaning we can't
   * know how to parse (apart from sniffing the response, which is very
   * error-prone) so this param allows us provide one explicitly)
   */
  constructor(
    inputResources,
    termSelectionResource,
    vocabAcceptHeaderOverride,
    vocabContentTypeHeaderOverride,
    vocabContentTypeHeaderFallback,
  ) {
    this.inputResources = inputResources;
    this.termSelectionResource = termSelectionResource;
    this.vocabAcceptHeaderOverride = vocabAcceptHeaderOverride;
    this.vocabContentTypeHeaderOverride = vocabContentTypeHeaderOverride;
    this.vocabContentTypeHeaderFallback = vocabContentTypeHeaderFallback;
  }

  async processInputs(config) {
    const datasets = [];

    for (let i = 0; i < this.inputResources.length; i++) {
      const inputResource = this.inputResources[i];
      try {
        const resource = await Resource.readResourceViaCache(
          inputResource,
          this.vocabAcceptHeaderOverride,
          this.vocabContentTypeHeaderOverride,
          this.vocabContentTypeHeaderFallback,
        );

        datasets.push(resource);
      } catch (rootCause) {
        datasets.push(
          await Resource.attemptToReadGeneratedResource(
            config,
            inputResource,
            rootCause,
          ),
        );
      }
    }

    let termsSelectionDataset;
    if (this.termSelectionResource) {
      termsSelectionDataset = await Resource.readResourceViaCache(
        this.termSelectionResource,
      );

      // We also add the terms from this resource to our collection of input
      // datasets, since we expect it to contain possible extensions (e.g.,
      // translations of labels or comments into new languages, or possibly
      // completely new terms).
      datasets.push(termsSelectionDataset);
    }

    return { datasets, termsSelectionDataset };
  }

  // WIP - commenting out for now...
  // async readResourceUsingLocalCache(config, inputResource) {
  //   let resource;
  //   try {
  //     resource = await this.readResource(
  //       inputResource,
  //       this.vocabAcceptHeaderOverride,
  //       this.vocabContentTypeHeaderFallback
  //     );
  //
  //     if (inputResource.startsWith("http") && config.storeLocalCopyOfVocabDirectory) {
  //       Resource.storeLocalCopyOfResource(config.storeLocalCopyOfVocabDirectory, resource);
  //     }
  //   } catch (error) {
  //     resource = attemptToReadGeneratedResource(config, inputResource, error);
  //   }
  //
  //   return resource;
  // }

  static attemptToReadGeneratedResource(config, inputResource, rootCause) {
    const cacheDirectory = config.storeLocalCopyOfVocabDirectory;
    if (cacheDirectory === undefined) {
      throw new Error(
        `No local cached vocab directory to fallback to when processing resource [${inputResource}] - root cause of failure: [${rootCause}]`,
      );
    }

    debug(
      `Attempting to use previously cached vocab file for resource [${inputResource}] from directory [${cacheDirectory}]...`,
    );

    // Assume the input resource is actually the vocab namespace (which it
    // should be, generally!).
    const formatNamespace =
      Resource.formatUrlWithFilenameCharacters(inputResource);

    // Scan our provided directory for any pre-existing copies of this
    // vocabulary, sorting alphabetically which will get us the most recently
    // cached version...
    try {
      const expectedCacheResource =
        Resource.addTurtleExtensionIfNeeded(formatNamespace);
      const files = fs
        .readdirSync(cacheDirectory)
        .filter((filename) => filename.endsWith(`__${expectedCacheResource}`))
        .sort((a, b) => b.localeCompare(a));

      // ...if no existing copies of this vocabulary, report the original problem.
      if (files.length === 0) {
        throw new Error(
          `No locally cached resources in directory [${cacheDirectory}] ending with [${expectedCacheResource}]`,
        );
      }

      // Get the latest cached version...
      return Resource.loadTurtleFileIntoDatasetPromise(
        path.join(cacheDirectory, files[0]),
      );
    } catch (error) {
      throw new Error(
        `Context: [${rootCause}] - cache lookup failure: [${error}]`,
      );
    }
  }

  static async readResourceViaCache(
    inputResource,
    vocabAcceptHeaderOverride,
    vocabContentTypeHeaderOverride,
    vocabContentTypeHeaderFallback,
  ) {
    const cacheLookup = cachedResources.get(inputResource);
    if (cacheLookup) {
      debug(`Loading resource from cache: [${inputResource}]`);
      return cacheLookup;
    }

    const resource = await Resource.readResource(
      inputResource,
      vocabAcceptHeaderOverride,
      vocabContentTypeHeaderOverride,
      vocabContentTypeHeaderFallback,
    );
    debug(
      `Storing resource in in-memory cache: [${inputResource}] (has [${resource.size.toLocaleString()}] triples)`,
    );
    cachedResources.set(inputResource, resource);
    return resource;
  }

  /**
   * Reads resources, either from a local file or a remote IRI.
   * @param {string} inputResource path to the file, or IRI.
   * @param {string} vocabAcceptHeaderOverride the HTTP Accept header value to
   * use (some vocab servers don't respect the `q` qualifier, e.g.,
   * "https://w3id.org/survey-ontology#")
   * @param vocabContentTypeHeaderOverride HTTP Content Type header override
   * (some vocab servers (e.g., Resume-RDF) return a content type of
   * 'text/plain' even though the response is RDF/XML. This value allows us
   * override the server header so that we can use the correct parser.
   * @param {string} vocabContentTypeHeaderFallback HTTP Content Type header
   * (some vocab servers (e.g., DOAP) don't return a Content Type header,
   * meaning we can't know how to parse (apart from sniffing the response, which
   * is very error-prone) so this param allows us provide one explicitly)
   */
  static readResource(
    inputResource,
    vocabAcceptHeaderOverride,
    vocabContentTypeHeaderOverride,
    vocabContentTypeHeaderFallback,
  ) {
    debug(`Loading resource from source: [${inputResource}]`);
    if (Resource.isOnline(inputResource)) {
      const formats = this.createParserFormats(inputResource);

      let acceptHeader;
      if (vocabAcceptHeaderOverride) {
        acceptHeader = vocabAcceptHeaderOverride;
        debug(`Overriding Accept header with: [${vocabAcceptHeaderOverride}].`);
      } else {
        acceptHeader = RDF_ACCEPT_HEADER;
      }

      return rdfFetch(inputResource, {
        factory: rdf,
        headers: {
          accept: acceptHeader,
          // In Oct-2022, suddenly the OMG vocab
          // (http://www.omg.org/techprocess/ab/SpecificationMetadata/)
          // started to fail with a "403: Forbidden" error. Investigating with
          // Postman showed that this was due to missing the 'User-Agent' HTTP
          // header, so including one now.
          "User-Agent": "Inrupt Artifact Generator",
        },
        formats,
      })
        .then((rdfResponse) => {
          // Check if we were given a 'Content-Type' override value (can be
          // needed when a vocab server returns the wrong type (e.g., the
          // Resume/CV vocab server returns 'text/plain' when in fact the data
          // returned is RDF/XML!).
          if (vocabContentTypeHeaderOverride) {
            rdfResponse.headers.set(
              "content-type",
              vocabContentTypeHeaderOverride,
            );
          } else {
            // The vocab server may not provide a HTTP Content-Type header (e.g.,
            // the DOAP server). So if we weren't provided with an explicit
            // fallback content type (e.g., RDF/XML in the case of DOAP), then we
            // can't reliably know which RDF parser to use, and therefore need to
            // bomb out.
            if (!rdfResponse.headers.get("content-type")) {
              if (vocabContentTypeHeaderFallback) {
                rdfResponse.headers.set(
                  "content-type",
                  vocabContentTypeHeaderFallback,
                );
              } else {
                throw new Error(
                  `Successfully fetched input resource [${inputResource}], but response does not contain a Content-Type header. Our configuration did not provide a fallback value (using the 'vocabContentTypeHeaderFallback' option), so we cannot reliably determine the correct RDF parser to use to process this response`,
                );
              }
            }
          }

          debug(
            `About to process fetched input resource [${inputResource}] as a dataset...`,
          );
          return rdfResponse.dataset();
        })
        .catch((error) => {
          const message = `Encountered error while attempting to fetch or process resource [${inputResource}]: ${error}`;
          debug(message);
          throw new Error(message);
        });
    }

    return new Promise((resolve) => {
      resolve(this.loadTurtleFileIntoDatasetPromise(inputResource));
    });
  }

  // We need to create instances of some parsers per vocab due to the need to
  // set a base IRI for certain vocabs, which we can only do in the constructor.
  static createParserFormats(inputResource) {
    const parserN3 = new ParserN3({ baseIRI: inputResource });

    const formats = {
      parsers: new SinkMap([
        ["text/turtle", parserN3],
        ["text/n3", parserN3], // The iCal vocab requires this content type, and the OLO vocab returns it.
        ["application/x-turtle", parserN3], // This is needed as schema.org returns this as the content type.
        ["application/ld+json", parserJsonld], // Activity streams only supports JSON-LD and HTML.
        ["application/rdf+xml", new ParserRdfXml({ baseIRI: inputResource })],
        ["text/html", new ParserRdfa({ baseIRI: inputResource })],

        // The vocab
        // 'https://raw.githubusercontent.com/UKGovLD/publishing-statistical-data/master/specs/src/main/vocab/cube.ttl'
        // returns a 'Content-Type' header of 'text/plain' even though we
        // request and receive Turtle!
        ["text/plain", parserN3],
      ]),
    };

    return formats;
  }

  /**
   * Stores the specified RDF resource as a local file in the specified
   * directory.
   *
   * Note: this saves the union of all input resources and also unions in
   * any term selection resources that may apply (since those term selection
   * resources can also add extra metadata (e.g., label or comment
   * translations, see-also links, etc.)). So do not expect the local copy
   * to be an exact representation of just a single source vocabulary.
   * A consequence of this is that our local copy can represent many remote
   * input resources, which can be very convenient (however, at the moment,
   * if the term selection resources are remote (which we don't expect right
   * now), or generation process will (probably) fail somehow!).
   *
   * The format of the locally save filename is as follows:
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
    doneCallback,
  ) {
    const writer = new N3.Writer({
      baseIRI: vocabNamespace,
      format: "text/turtle",
      prefixes: { ...prefixes, [vocabName]: vocabNamespace },
    });

    // We can't simply digest (or hash) the serialized RDF, due to the
    // potential of having pesky Blank Nodes (whose value will differ on each
    // parse). So as we serialize, we also need to explicitly ignore Blank
    // Nodes.
    let vocabDigestInput = "";

    dataset.forEach((quad) => {
      writer.addQuad(quad);
      vocabDigestInput = vocabDigestInput.concat(
        Resource.quadToStringIgnoringBNodes(quad),
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
      const formatNamespace =
        Resource.formatUrlWithFilenameCharacters(vocabNamespace);

      // Scan our provided directory for any pre-existing copies of this
      // vocabulary with a matching digest...
      const namespaceFilename =
        Resource.addTurtleExtensionIfNeeded(formatNamespace);
      const files = fs
        .readdirSync(directory)
        .filter((filename) =>
          filename.endsWith(`-${vocabDigest}__${namespaceFilename}`),
        );

      // ...if no existing copies of this vocabulary, store a copy now.
      if (files.length === 0) {
        const outputFilename = path.join(
          directory,
          `${vocabName}-${moment().format()}-${vocabDigest}__${namespaceFilename}`,
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
   * Simply adds a default Turtle extension if needed to the specific resource
   * name.
   * @param resourceName name of resource to process
   * @returns {*|string}
   */
  static addTurtleExtensionIfNeeded(resourceName) {
    return resourceName.endsWith(".ttl") ? resourceName : `${resourceName}.ttl`;
  }

  /**
   * For our purposes here, we just need a simple hash of an RDF vocab, and of
   * course Blank Nodes complicate hashing - so we just ignore them!
   *
   * @param quad the quad to string-ify
   * @returns {string}
   */
  static quadToStringIgnoringBNodes(quad) {
    return (
      quad.subject.termType === "BlankNode" ? "BNode" : quad.subject.value
    )
      .concat(quad.predicate.value)
      .concat(
        quad.object.termType === "BlankNode" ? "BNode" : quad.object.value,
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
    // The N3 parser is, apparently, a one-time use parser, so we should
    // instantiate a new one for each file we process.
    const parserN3 = new ParserN3();

    const data = fs.readFileSync(filename, "utf8");
    const quadStream = parserN3.import(stringToStream(data));

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
          `Failed to lookup Last Modification Time for resource [${resource}]. Error: ${error}`,
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
module.exports.clearResourceFromCache = clearResourceFromCache;
