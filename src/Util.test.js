const path = require("path");
const {
  DEFAULT_DIRECTORY_ROOT,
  DEFAULT_DIRECTORY_SOURCE_CODE,
  artifactDirectoryRoot,
  artifactDirectorySourceCode
} = require("./Util");

describe("Test override root", () => {
  it("should return default if no input data", async () => {
    expect(artifactDirectoryRoot()).toEqual(DEFAULT_DIRECTORY_ROOT);
  });

  it("should return default if override no in input data", async () => {
    expect(artifactDirectoryRoot({})).toEqual(DEFAULT_DIRECTORY_ROOT);
  });

  it("should override default", async () => {
    const override = "Whatever_Dir";
    expect(
      artifactDirectoryRoot({ artifactDirectoryRootOverride: override })
    ).toEqual(override);
  });
});

describe("Test override source code", () => {
  it("should return default if no input data", async () => {
    expect(artifactDirectorySourceCode()).toEqual(
      path.join(DEFAULT_DIRECTORY_ROOT, DEFAULT_DIRECTORY_SOURCE_CODE)
    );
  });

  it("should return default if override no in input data", async () => {
    expect(artifactDirectorySourceCode({})).toEqual(
      path.join(DEFAULT_DIRECTORY_ROOT, DEFAULT_DIRECTORY_SOURCE_CODE)
    );
  });

  it("should override default", async () => {
    const override = "Whatever_Dir";
    expect(
      artifactDirectorySourceCode({
        artifactDirectoryRootOverride: override
      })
    ).toEqual(path.join(override, DEFAULT_DIRECTORY_SOURCE_CODE));
  });
});
