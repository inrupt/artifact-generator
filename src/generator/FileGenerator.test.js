require("mock-local-storage");

const FileGenerator = require("./FileGenerator");

describe("File Generator", () => {
  it("should escape all characters in JavaScript", () => {
    expect(
      FileGenerator.escapeStringForJavaScript(
        "There are ` lots ` of backticks in ` here!"
      )
    ).toEqual("There are \\` lots \\` of backticks in \\` here!");
  });

  it("should escape all characters in Java", () => {
    expect(
      FileGenerator.escapeStringForJava(
        "There are\nlots\nof\n new lines in \nhere!"
      )
    ).toEqual(`There are\\n" +
"lots\\n" +
"of\\n" +
" new lines in \\n" +
"here!`);
  });
});
