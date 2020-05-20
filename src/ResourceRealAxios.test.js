require("mock-local-storage");

const Resource = require("./Resource");

/**
 * Needed this test file to have access to Axios rather than the Jest mocks.
 */
describe("Resources last modification", () => {
  it("should log failure and return 'now' if HTTP request fails", async () => {
    const resource = "http://nonsense endpoint";
    const modified = await Resource.getHttpResourceLastModificationTime(
      resource
    );

    expect(modified.getTime()).toBeGreaterThan(new Date().getTime() - 2);
  });
});
