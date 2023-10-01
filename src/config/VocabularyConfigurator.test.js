jest.mock("inquirer");
const inquirer = require("inquirer");

require("mock-local-storage");
const {
  VocabularyConfigurator,
  splitInputResources,
} = require("./VocabularyConfigurator");

const DUMMY_VOCAB = {
  inputResources: ["test", "anotherTest"],
};

describe("VocabularyConfig Generator", () => {
  it("should split input resources according to the separator", () => {
    expect(splitInputResources("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("should return the values prompted by the user", () => {
    inquirer.prompt.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(DUMMY_VOCAB)),
    );
    expect(VocabularyConfigurator.prompt()).resolves.toEqual(DUMMY_VOCAB);
  });
});
