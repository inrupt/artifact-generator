const path = require("path");

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
    DEFAULT_DIRECTORY_SOURCE_CODE
  );
}

// We don't assume input will always be a file location, so we explicitly try
// to ignore HTTP URLs.
function normalizePath(resource) {
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

module.exports.DEFAULT_DIRECTORY_ROOT = DEFAULT_DIRECTORY_ROOT;
module.exports.DEFAULT_DIRECTORY_SOURCE_CODE = DEFAULT_DIRECTORY_SOURCE_CODE;
module.exports.getArtifactDirectoryRoot = getArtifactDirectoryRoot;
module.exports.getArtifactDirectorySourceCode = getArtifactDirectorySourceCode;
module.exports.normalizePath = normalizePath;
module.exports.describeInput = describeInput;
