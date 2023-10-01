require("mock-local-storage");

const FileGenerator = require("./FileGenerator");
const path = require("path");

const ARTIFACTS_INFO_TEMPLATE = path.join(
  __dirname,
  "..",
  "..",
  "template",
  "artifacts-info.hbs",
);

describe("File Generator", () => {
  it("should throw if source code template file not found", () => {
    const doesNotExistTemplateFile = "not exist template file";
    const progLanguage = "Some programming language";
    const fileExtension = "file.extension";
    const outputDirectory = "./Generated/SomeOutputDirectory";

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
        {},
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
        outputFile,
      );
    } catch (error) {
      errorMessage = error.message;
    }

    expect(errorMessage).toContain("Failed to read template file");
    expect(errorMessage).toContain(doesNotExistTemplateFile);
    expect(errorMessage).toContain(outputFile);
  });

  it("should throw if template refers to missing variable (from input resource)", () => {
    const inputTurtle = "SomeVocab.ttl";
    let errorMessage;
    try {
      FileGenerator.createFileFromTemplate(
        ARTIFACTS_INFO_TEMPLATE,
        { inputResources: inputTurtle, templateFile: ARTIFACTS_INFO_TEMPLATE },
        "SomeOutputFile.js",
      );
    } catch (error) {
      errorMessage = error.message;
    }

    expect(errorMessage).toContain("Undefined template variable");
    expect(errorMessage).toContain(inputTurtle);
    expect(errorMessage).toContain(ARTIFACTS_INFO_TEMPLATE);
  });

  it("should throw if template refers to missing variable (from configuration file)", () => {
    const configFile = "someConfigFile.yml";
    let errorMessage;
    try {
      FileGenerator.createFileFromTemplate(
        ARTIFACTS_INFO_TEMPLATE,
        { vocabListFile: configFile, templateFile: ARTIFACTS_INFO_TEMPLATE },
        "SomeOutputFile.js",
      );
    } catch (error) {
      errorMessage = error.message;
    }

    expect(errorMessage).toContain("Undefined template variable");
    expect(errorMessage).toContain(configFile);
    expect(errorMessage).toContain(ARTIFACTS_INFO_TEMPLATE);
  });

  it("should escape all characters in JavaScript", () => {
    expect(
      FileGenerator.escapeStringForJavaScript(
        "There are ` lots ` of backticks in ` here!",
      ),
    ).toEqual("There are \\` lots \\` of backticks in \\` here!");
  });

  it("should escape all characters in Java", () => {
    expect(
      FileGenerator.escapeStringForJava(
        "There are\nlots\nof\n new lines in \nhere!",
      ),
    ).toEqual(`There are\\n" +
"lots\\n" +
"of\\n" +
" new lines in \\n" +
"here!`);
  });

  // Test slash encoding.
  const exampleQudtComment = `<p class=\"lm-para\">A  <em>Quantity Kind Dimension Vector</em> describes the dimensionality of a quantity kind in the context of a system of units. In the SI system of units, the dimensions of a quantity kind are expressed as a product of the basic physical dimensions mass (\\(M\\)), length (\\(L\\)), time (\\(T\\)) current (\\(I\\)), amount of substance (\\(N\\)), luminous intensity (\\(J\\)) and absolute temperature (\\(\\theta\\)) as \\(dim \\, Q = L^{\\alpha} \\, M^{\\beta} \\, T^{\\gamma} \\, I ^{\\delta} \\, \\theta ^{\\epsilon} \\, N^{\\eta} \\, J ^{\\nu}\\).</p>`;
  expect(FileGenerator.escapeStringForJava(exampleQudtComment)).toEqual(
    `<p class=\\"lm-para\\">A  <em>Quantity Kind Dimension Vector</em> describes the dimensionality of a quantity kind in the context of a system of units. In the SI system of units, the dimensions of a quantity kind are expressed as a product of the basic physical dimensions mass (\\\\\\\\(M\\\\\\\\)), length (\\\\\\\\(L\\\\\\\\)), time (\\\\\\\\(T\\\\\\\\)) current (\\\\\\\\(I\\\\\\\\)), amount of substance (\\\\\\\\(N\\\\\\\\)), luminous intensity (\\\\\\\\(J\\\\\\\\)) and absolute temperature (\\\\\\\\(\\\\\\\\theta\\\\\\\\)) as \\\\\\\\(dim \\\\\\\\, Q = L^{\\\\\\\\alpha} \\\\\\\\, M^{\\\\\\\\beta} \\\\\\\\, T^{\\\\\\\\gamma} \\\\\\\\, I ^{\\\\\\\\delta} \\\\\\\\, \\\\\\\\theta ^{\\\\\\\\epsilon} \\\\\\\\, N^{\\\\\\\\eta} \\\\\\\\, J ^{\\\\\\\\nu}\\\\\\\\).</p>`,
  );
});
