require("mock-local-storage");

const FileGenerator = require("./FileGenerator");

describe("File Generator", () => {
  it("should throw if source code template file not found", () => {
    const doesNotExistTemplateFile = "not exist template file";
    const progLanguage = "Some programming language";
    const fileExtension = "file.extension";
    const outputDirectory = "./someOutputDirectory";

    let errorMessage;
    try {
      FileGenerator.createSourceCodeFile(
        {},
        {
          programmingLanguage: progLanguage,
          sourceCodeTemplate: doesNotExistTemplateFile,
          sourceFileExtension: fileExtension,
          outputDirectoryForArtifact: outputDirectory,
        },
        {}
      );
    } catch (error) {
      errorMessage = error.message;
    }

    expect(errorMessage).toContain("Failed to generate");
    expect(errorMessage).toContain(progLanguage);
    expect(errorMessage).toContain(doesNotExistTemplateFile);
    expect(errorMessage).toContain(fileExtension);
    expect(errorMessage).toContain(outputDirectory);
  });

  it("should throw if template file not found", () => {
    const doesNotExistTemplateFile = "not exist template file";
    const outputFile = "SomeOutputFile.js";
    let errorMessage;
    try {
      FileGenerator.createFileFromTemplate(
        doesNotExistTemplateFile,
        {},
        outputFile
      );
    } catch (error) {
      errorMessage = error.message;
    }

    expect(errorMessage).toContain("Failed to read template file");
    expect(errorMessage).toContain(doesNotExistTemplateFile);
    expect(errorMessage).toContain(outputFile);
  });

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
