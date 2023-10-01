const path = require("path");
const rdf = require("rdf-ext");

const {
  INRUPT_BEST_PRACTICE_NAMESPACE,
  INRUPT_BEST_PRACTICE_NAMESPACE_PREFIX,
} = require("./CommonTerms");

// TODO: Consider moving these functions into 'GeneratorConfiguration.js'
//  instead. The code was put here due to cyclic dependency problems when it was
//  in'ArtifactGenerator.js', but 'GeneratorConfiguration.js' seems like it
//  might be a cleaner place for these.
const DEFAULT_DIRECTORY_ROOT = "/Generated";
const DEFAULT_DIRECTORY_SOURCE_CODE = "SourceCodeArtifacts";

function getArtifactDirectoryRoot(options) {
  return options && options.artifactDirectoryRootOverride
    ? options.artifactDirectoryRootOverride
    : DEFAULT_DIRECTORY_ROOT;
}

function getArtifactDirectorySourceCode(options) {
  return path.join(
    getArtifactDirectoryRoot(options),
    DEFAULT_DIRECTORY_SOURCE_CODE,
  );
}

// Normalizes the specified resource location if it's a file path (e.g.,
// '/a/b/c/../../d' would be normalized to '/a/d'), but if it refers to an
// HTTP resource, we just return the value as-is.
function normalizeIfFilePath(resource) {
  return resource && !resource.startsWith("http")
    ? path.normalize(resource)
    : resource;
}

function describeInput(artifactInfo) {
  return artifactInfo.vocabListFile
    ? `vocab list file: [${artifactInfo.vocabListFile}]`
    : `input${
        artifactInfo.inputResources.length === 1 ? "" : "s"
      }: [${artifactInfo.inputResources.join(", ")}]`;
}

function mergeDatasets(dataSetArray) {
  let fullData = rdf.dataset();
  dataSetArray.forEach((dataset) => {
    fullData = fullData.merge(dataset);
  });

  return fullData;
}

function curie(iri) {
  if (iri.startsWith(INRUPT_BEST_PRACTICE_NAMESPACE)) {
    return `${INRUPT_BEST_PRACTICE_NAMESPACE_PREFIX}:${iri.substring(
      INRUPT_BEST_PRACTICE_NAMESPACE.length,
    )}`;
  }

  return iri;
}

module.exports.DEFAULT_DIRECTORY_ROOT = DEFAULT_DIRECTORY_ROOT;
module.exports.DEFAULT_DIRECTORY_SOURCE_CODE = DEFAULT_DIRECTORY_SOURCE_CODE;
module.exports.getArtifactDirectoryRoot = getArtifactDirectoryRoot;
module.exports.getArtifactDirectorySourceCode = getArtifactDirectorySourceCode;
module.exports.normalizePath = normalizeIfFilePath;
module.exports.describeInput = describeInput;
module.exports.mergeDatasets = mergeDatasets;
module.exports.curie = curie;
