const path = require("path");
const {
  DEFAULT_DIRECTORY_ROOT,
  DEFAULT_DIRECTORY_SOURCE_CODE,
  getArtifactDirectoryRoot,
  getArtifactDirectorySourceCode,
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
