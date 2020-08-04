require("mock-local-storage");
const path = require("path");
const fs = require("fs");

const axios = require("axios");
jest.mock("axios");

const rdfFetch = require("@rdfjs/fetch-lite");
jest.mock("@rdfjs/fetch-lite");

const Resource = require("./Resource");

// 'Mon, 01 Jan 4000 00:00:59 GMT', in POSIX time
const MOCKED_LAST_MODIFIED = 64060588859000;
const VALID_LAST_MODIF_HTTP_RESOURCE = {
  headers: {
    // This date should alway be more recent than the considered artifacts (unless you are running this test
    // 2000 years in the future and are trying to figure out what stopped working)
    "last-modified": "Mon, 01 Jan 4000 00:00:59 GMT",
  },
};

const INVALID_LAST_MODIF_HTTP_RESOURCE = {
  headers: {
    "last-modified": "This is not a date",
  },
};

describe("Resources last modification", () => {
  it("should get the resource last modification for online resources", async () => {
    axios.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(VALID_LAST_MODIF_HTTP_RESOURCE))
    );

    const lastmodif = await Resource.getResourceLastModificationTime(
      "http://whatever.org"
    );
    expect(lastmodif).toEqual(MOCKED_LAST_MODIFIED);
  });

  it("should return default time for unreachable online resources", async () => {
    axios.mockImplementation(
      jest
        .fn()
        .mockReturnValue(Promise.resolve(INVALID_LAST_MODIF_HTTP_RESOURCE))
    );
    const lastModificationTime = await Resource.getResourceLastModificationTime(
      "http://whatever.org"
    );
    expect(lastModificationTime).toEqual(Resource.DEFAULT_MODIFICATION_DATE);
  });
});

describe("Fetching remote resource", () => {
  it("should return undefined when failing to fetch a resource", async () => {
    rdfFetch.mockImplementation(
      jest.fn().mockReturnValue(Promise.reject(new Error("Unreachable")))
    );
    const resource = Resource.readResource("http://example.org/ns");
    expect(await resource).toEqual(undefined);
  });
});

describe("Touching a file", () => {
  it("should update the last modified time of file", async () => {
    const file = path.join(
      "test",
      "resources",
      "expectedOutputs",
      "sample-vocab.yml"
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
      "expectedOutputs",
      "sample-vocab-git.yml"
    );
    const origModifiedTime = fs.statSync(file).mtimeMs;
    Resource.touchFile(file, {});
    const newModifiedTime = fs.statSync(file).mtimeMs;
    expect(newModifiedTime).toBeGreaterThan(origModifiedTime);
  });
});
