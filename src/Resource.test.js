require("mock-local-storage");

const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

const axios = require("axios");
jest.mock("axios");

const rdf = require("rdf-ext");
const rdfFetch = require("@rdfjs/fetch-lite");
jest.mock("@rdfjs/fetch-lite");

const { RDF, RDFS, SKOS, OWL } = require("./CommonTerms");

const Resource = require("./Resource");

// 'Mon, 01 Jan 4000 00:00:59 GMT', in POSIX time
const MOCKED_LAST_MODIFIED = 64060588859000;
const VALID_LAST_MODIF_HTTP_RESOURCE = {
  headers: {
    // This date should always be more recent than the considered artifacts
    // (unless you are running this test 2,000 years in the future and are
    // trying to figure out what stopped working!).
    "last-modified": "Mon, 01 Jan 4000 00:00:59 GMT",
  },
};

const INVALID_LAST_MODIF_HTTP_RESOURCE = {
  headers: {
    "last-modified": "This is not a date",
  },
};

const NAMESPACE = "http://rdf-extension.com#";
const NAMESPACE_IRI = rdf.namedNode(NAMESPACE);

describe("Resources last modification", () => {
  it("should get the resource last modification for online resources", async () => {
    axios.mockImplementation(
      jest
        .fn()
        .mockReturnValue(Promise.resolve(VALID_LAST_MODIF_HTTP_RESOURCE)),
    );

    const lastmodif = await Resource.getResourceLastModificationTime(
      "http://whatever.org",
    );
    expect(lastmodif).toEqual(MOCKED_LAST_MODIFIED);
  });

  it("should return default time for unreachable online resources", async () => {
    axios.mockImplementation(
      jest
        .fn()
        .mockReturnValue(Promise.resolve(INVALID_LAST_MODIF_HTTP_RESOURCE)),
    );
    const lastModificationTime = await Resource.getResourceLastModificationTime(
      "http://whatever.org",
    );
    expect(lastModificationTime).toEqual(Resource.DEFAULT_MODIFICATION_DATE);
  });
});

describe("Fetching remote resource", () => {
  it("should return undefined when failing to fetch a resource", async () => {
    rdfFetch.mockImplementation(
      jest.fn().mockReturnValue(Promise.reject(new Error("Unreachable"))),
    );
    expect(() =>
      Resource.readResource("http://example.org/ns"),
    ).rejects.toThrow("Unreachable");
  });

  it("should handle SKOS-XL as a known exception", async () => {
    rdfFetch.mockImplementation(
      jest.fn().mockReturnValue(Promise.reject(new Error("Unreachable"))),
    );
    expect(() =>
      Resource.readResource("http://www.w3.org/2008/05/skos-xl#"),
    ).rejects.toThrow("Unreachable");
  });

  it("should use Accept header override", async () => {
    const mockedDataset = "mocked dataset response";
    const rdfFetchMock = {
      dataset: () => {
        return mockedDataset;
      },
      headers: { get: function () {}, set: function () {} },
    };
    rdfFetch.mockImplementation(() => {
      return Promise.resolve(rdfFetchMock);
    });

    expect(
      await Resource.readResource(
        "http://www.example.com",
        "mocked accept media type",
        "mocked media type",
      ),
    ).toEqual(mockedDataset);
  });

  it("should use Content Type header override", async () => {
    const mockedDataset = "mocked dataset response";
    const rdfFetchMock = {
      dataset: () => {
        return mockedDataset;
      },
      headers: { get: function () {}, set: function () {} },
    };
    rdfFetch.mockImplementation(() => {
      return Promise.resolve(rdfFetchMock);
    });

    expect(
      await Resource.readResource(
        "http://www.example.com",
        undefined,
        "mocked media type",
      ),
    ).toEqual(mockedDataset);
  });

  it("should use Content Type header fallback", async () => {
    const mockedDataset = "mocked dataset response";
    const rdfFetchMock = {
      dataset: () => {
        return mockedDataset;
      },
      headers: { get: function () {}, set: function () {} },
    };
    rdfFetch.mockImplementation(() => {
      return Promise.resolve(rdfFetchMock);
    });

    expect(
      await Resource.readResource(
        "http://www.example.com",
        undefined,
        undefined,
        "mocked media type",
      ),
    ).toEqual(mockedDataset);
  });

  it("should throw if no Content Type header, no override, and no fallback", async () => {
    const rdfFetchMock = {
      dataset: () => {
        "mocked response";
      },
      headers: { get: function () {} },
    };
    rdfFetch.mockImplementation(() => {
      return Promise.resolve(rdfFetchMock);
    });

    expect(() =>
      Resource.readResource("http://www.example.com"),
    ).rejects.toThrow("cannot reliably determine the correct RDF parser");
  });
});

describe("Touching a file", () => {
  it("should update the last modified time of file", async () => {
    const file = path.join(
      "test",
      "resources",
      "expectedOutput",
      "sample-vocab.yml",
    );
    const origModifiedTime = fs.statSync(file).mtimeMs;
    Resource.touchFile(file);
    const newModifiedTime = fs.statSync(file).mtimeMs;
    expect(newModifiedTime).toBeGreaterThan(origModifiedTime);
  });

  it("should handle file exception", async () => {
    const file = path.join(
      "test",
      "resources",
      "expectedOutput",
      "sample-vocab.yml",
    );
    const origModifiedTime = fs.statSync(file).mtimeMs;

    // Force a deliberate short time interval here to give our timestamps a
    // chance to differ.
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    // Deliberately pass an empty fileSystem.
    Resource.touchFile(file, {});
    const newModifiedTime = fs.statSync(file).mtimeMs;
    expect(newModifiedTime).toBeGreaterThan(origModifiedTime);
  });

  describe("local vocab cache", () => {
    const vocabMetadata = rdf
      .dataset()
      .add(rdf.quad(NAMESPACE_IRI, RDF.type, OWL.Ontology));

    describe("storing local copy of vocab", () => {
      it("should store local copy", (done) => {
        const testLocalCopyDirectory = path.join(
          ".",
          "test",
          "Generated",
          "UNIT_TEST",
          "LocalCopyOfVocab",
        );
        rimraf.sync(testLocalCopyDirectory);

        const dataset = rdf
          .dataset()
          .addAll(vocabMetadata)
          .add(rdf.quad(OWL.Ontology, RDFS.subClassOf, SKOS.Concept));

        Resource.storeLocalCopyOfResource(
          testLocalCopyDirectory,
          "test-vocab",
          NAMESPACE,
          dataset,
          function () {
            const matches = fs
              .readdirSync(testLocalCopyDirectory)
              .filter(
                (filename) =>
                  filename.startsWith(`test-vocab-`) &&
                  filename.endsWith(`__http---rdf-extension.com#.ttl`),
              );

            expect(matches.length).toBe(1);

            // Call again to test *not* storing again...
            Resource.storeLocalCopyOfResource(
              testLocalCopyDirectory,
              "test-vocab",
              NAMESPACE,
              dataset,
            );

            // Now write a different vocab to test multiple vocabs in the same output
            // directory.
            Resource.storeLocalCopyOfResource(
              testLocalCopyDirectory,
              "different-test-vocab",
              NAMESPACE,
              dataset,
              function () {
                const differentMatches = fs
                  .readdirSync(testLocalCopyDirectory)
                  .filter(
                    (filename) =>
                      filename.startsWith(`test-vocab-`) &&
                      filename.endsWith(`__http---rdf-extension.com#.ttl`),
                  );

                expect(differentMatches.length).toBe(1);
                done();
              },
            );
          },
        );
      });
    });

    describe("reading vocab from local", () => {
      it("should throw if directory doesn't exist", async () => {
        const rootCause = "some reason...";
        expect(() =>
          Resource.attemptToReadGeneratedResource(
            {},
            "inputResource doesn't matter",
            rootCause,
          ),
        ).toThrow(rootCause);
      });

      it("should throw if no local copy of vocab", async () => {
        const testLocalCopyDirectory = path.join(
          ".",
          "test",
          "resources",
          "localCopyOfVocab",
          "non-existent-directory",
        );

        const rootCause = "some reason...";
        expect(() =>
          Resource.attemptToReadGeneratedResource(
            { storeLocalCopyOfVocabDirectory: testLocalCopyDirectory },
            "inputResource doesn't matter",
            rootCause,
          ),
        ).toThrow(rootCause);
      });

      it("should throw if copy of vocab doesn't exist", async () => {
        const testLocalCopyDirectory = path.join(
          ".",
          "test",
          "resources",
          "localCopyOfVocab",
          "testCacheForReading-DoNotDelete",
        );

        const rootCause = "some reason...";
        expect(() =>
          Resource.attemptToReadGeneratedResource(
            { storeLocalCopyOfVocabDirectory: testLocalCopyDirectory },
            "https://does-not-exist.com/",
            rootCause,
          ),
        ).toThrow(rootCause);
      });

      it("should read local copy of vocab", async () => {
        const testLocalCopyDirectory = path.join(
          ".",
          "test",
          "resources",
          "localCopyOfVocab",
          "testCacheForReading-DoNotDelete",
        );

        const dataset = await Resource.attemptToReadGeneratedResource(
          { storeLocalCopyOfVocabDirectory: testLocalCopyDirectory },
          "http://rdf-extension.com#",
          "some reason...",
        );
        expect(dataset.size).toBe(3);
      });

      it("should read local copy of vocab with a TTL extension", async () => {
        const testLocalCopyDirectory = path.join(
          ".",
          "test",
          "resources",
          "localCopyOfVocab",
          "testCacheForReading-DoNotDelete",
        );

        const dataset = await Resource.attemptToReadGeneratedResource(
          { storeLocalCopyOfVocabDirectory: testLocalCopyDirectory },
          "http://rdf-extension.com#.ttl",
          "some reason...",
        );
        expect(dataset.size).toBe(3);
      });
    });
  });

  describe("quad as string ignoring Blank Nodes", () => {
    it("should concatenate normal quad", () => {
      expect(
        Resource.quadToStringIgnoringBNodes(
          rdf.quad(NAMESPACE_IRI, RDF.type, OWL.Ontology),
        ),
      ).toBe(
        "http://rdf-extension.com#http://www.w3.org/1999/02/22-rdf-syntax-ns#typehttp://www.w3.org/2002/07/owl#Ontology",
      );
    });

    it("should provide literal for BNode Subject and Object", () => {
      expect(
        Resource.quadToStringIgnoringBNodes(
          rdf.quad(rdf.blankNode(), RDF.type, rdf.blankNode()),
        ),
      ).toBe("BNodehttp://www.w3.org/1999/02/22-rdf-syntax-ns#typeBNode");
    });
  });

  describe("simple string hash function", () => {
    it("should hash an empty string to 0", () => {
      expect(Resource.simpleStringHash("")).toBe(0);
    });

    it("should hash string to fixed value", async () => {
      expect(Resource.simpleStringHash("test hasing string")).toBe(-103900901);
    });
  });
});
