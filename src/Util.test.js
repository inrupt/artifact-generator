const path = require("path");
const {
  DEFAULT_DIRECTORY_ROOT,
  DEFAULT_DIRECTORY_SOURCE_CODE,
  ARTIFACT_DIRECTORY_ROOT,
  ARTIFACT_DIRECTORY_SOURCE_CODE
} = require("./Util");

describe("Test override root", () => {
  it("should return default if no input data", async () => {
    expect(ARTIFACT_DIRECTORY_ROOT()).toEqual(DEFAULT_DIRECTORY_ROOT);
  });

  it("should return default if override no in input data", async () => {
    expect(ARTIFACT_DIRECTORY_ROOT({})).toEqual(DEFAULT_DIRECTORY_ROOT);
  });

  it("should override default", async () => {
    const override = "Whatever_Dir";
    expect(
      ARTIFACT_DIRECTORY_ROOT({ artifactDirectoryRootOverride: override })
    ).toEqual(override);
  });
});

describe("Test override source code", () => {
  it("should return default if no input data", async () => {
    expect(ARTIFACT_DIRECTORY_SOURCE_CODE()).toEqual(
      path.join(DEFAULT_DIRECTORY_ROOT, DEFAULT_DIRECTORY_SOURCE_CODE)
    );
  });

  it("should return default if override no in input data", async () => {
    expect(ARTIFACT_DIRECTORY_SOURCE_CODE({})).toEqual(
      path.join(DEFAULT_DIRECTORY_ROOT, DEFAULT_DIRECTORY_SOURCE_CODE)
    );
  });

  it("should override default", async () => {
    const override = "Whatever_Dir";
    expect(
      ARTIFACT_DIRECTORY_SOURCE_CODE({
        artifactDirectoryRootOverride: override
      })
    ).toEqual(path.join(override, DEFAULT_DIRECTORY_SOURCE_CODE));
  });
});
