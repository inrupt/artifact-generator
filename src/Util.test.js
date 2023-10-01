const path = require("path");
const {
  DEFAULT_DIRECTORY_ROOT,
  DEFAULT_DIRECTORY_SOURCE_CODE,
  getArtifactDirectoryRoot,
  getArtifactDirectorySourceCode,
  normalizePath,
  mergeDatasets,
  curie,
} = require("./Util");
const rdf = require("rdf-ext");
const {
  SCHEMA_DOT_ORG,
  RDF,
  RDFS,
  INRUPT_BEST_PRACTICE_NAMESPACE,
} = require("./CommonTerms");

describe("Test override root", () => {
  it("should return default if no input data", async () => {
    expect(getArtifactDirectoryRoot()).toEqual(DEFAULT_DIRECTORY_ROOT);
  });

  it("should return default if override no in input data", async () => {
    expect(getArtifactDirectoryRoot({})).toEqual(DEFAULT_DIRECTORY_ROOT);
  });

  it("should override default", async () => {
    const override = "Whatever_Dir";
    expect(
      getArtifactDirectoryRoot({ artifactDirectoryRootOverride: override }),
    ).toEqual(override);
  });
});

describe("Merge datasets", () => {
  it("should merge all triples", () => {
    const dataSetA = rdf
      .dataset()
      .add(rdf.quad(SCHEMA_DOT_ORG.Person, RDF.type, RDFS.Class));

    const dataSetB = rdf
      .dataset()
      .add(rdf.quad(SCHEMA_DOT_ORG.givenName, RDF.type, RDF.Property));

    const merged = mergeDatasets([dataSetA, dataSetB]);
    expect(
      merged.match(SCHEMA_DOT_ORG.Person, RDF.type, RDFS.Class),
    ).not.toBeNull();
    expect(
      merged.match(SCHEMA_DOT_ORG.givenName, RDF.type, RDF.Property),
    ).not.toBeNull();
  });
});

describe("Normalize paths", () => {
  it("should return normalized data", () => {
    expect(normalizePath("./test")).toEqual("test");
  });

  it("should return nothing if given nothing", () => {
    expect(normalizePath()).toBeUndefined();
    expect(normalizePath(null)).toBeNull();
  });

  it("should ignore HTTP resources", () => {
    const httpResource = "http-ignore this.././whatever";
    expect(normalizePath(httpResource)).toEqual(httpResource);
  });
});

describe("Test override source code", () => {
  it("should return default if no input data", async () => {
    expect(getArtifactDirectorySourceCode()).toEqual(
      path.join(DEFAULT_DIRECTORY_ROOT, DEFAULT_DIRECTORY_SOURCE_CODE),
    );
  });

  it("should return default if override no in input data", async () => {
    expect(getArtifactDirectorySourceCode({})).toEqual(
      path.join(DEFAULT_DIRECTORY_ROOT, DEFAULT_DIRECTORY_SOURCE_CODE),
    );
  });

  it("should override default", async () => {
    const override = "Whatever_Dir";
    expect(
      getArtifactDirectorySourceCode({
        artifactDirectoryRootOverride: override,
      }),
    ).toEqual(path.join(override, DEFAULT_DIRECTORY_SOURCE_CODE));
  });
});

describe("CURIE function", () => {
  it("should return original IRI if not registered", () => {
    const unknownVocabTerm = "https://never-heard-of-this-vocab.com/test";
    expect(curie(unknownVocabTerm)).toEqual(unknownVocabTerm);
  });

  it("should return curie'd IRI", () => {
    expect(curie(`${INRUPT_BEST_PRACTICE_NAMESPACE}test`)).toEqual(
      "inrupt_bp:test",
    );
  });
});
