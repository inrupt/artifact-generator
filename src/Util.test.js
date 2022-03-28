const path = require("path");
const {
  DEFAULT_DIRECTORY_ROOT,
  DEFAULT_DIRECTORY_SOURCE_CODE,
  getArtifactDirectoryRoot,
  getArtifactDirectorySourceCode,
  normalizePath,
} = require("./Util");

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
      getArtifactDirectoryRoot({ artifactDirectoryRootOverride: override })
    ).toEqual(override);
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
      path.join(DEFAULT_DIRECTORY_ROOT, DEFAULT_DIRECTORY_SOURCE_CODE)
    );
  });

  it("should return default if override no in input data", async () => {
    expect(getArtifactDirectorySourceCode({})).toEqual(
      path.join(DEFAULT_DIRECTORY_ROOT, DEFAULT_DIRECTORY_SOURCE_CODE)
    );
  });

  it("should override default", async () => {
    const override = "Whatever_Dir";
    expect(
      getArtifactDirectorySourceCode({
        artifactDirectoryRootOverride: override,
      })
    ).toEqual(path.join(override, DEFAULT_DIRECTORY_SOURCE_CODE));
  });
});
