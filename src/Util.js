const path = require("path");

// TODO: Consider moving all this code into 'GeneratorConfiguration.js' instead.
//  The code ws put here due to cyclic dependency problems when it was in
//  'ArtifactGenerator.js', but 'GeneratorConfiguration.js' seems like it might
//  be a cleaner place for these.
const DEFAULT_DIRECTORY_ROOT = "/Generated";
const DEFAULT_DIRECTORY_SOURCE_CODE = "SourceCodeArtifacts";

function artifactDirectoryRoot(options) {
  return options && options.artifactDirectoryRootOverride
    ? options.artifactDirectoryRootOverride
    : DEFAULT_DIRECTORY_ROOT;
}

function artifactDirectorySourceCode(options) {
  return path.join(
    artifactDirectoryRoot(options),
    DEFAULT_DIRECTORY_SOURCE_CODE
  );
}

module.exports.DEFAULT_DIRECTORY_ROOT = DEFAULT_DIRECTORY_ROOT;
module.exports.DEFAULT_DIRECTORY_SOURCE_CODE = DEFAULT_DIRECTORY_SOURCE_CODE;
module.exports.artifactDirectoryRoot = artifactDirectoryRoot;
module.exports.artifactDirectorySourceCode = artifactDirectorySourceCode;
