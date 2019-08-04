const fs = require('fs');
const Handlebars = require('handlebars');

const ARTIFACT_DIRECTORY_JAVASCRIPT = '/GeneratedSourceCodeArtifacts/Javascript';

function createFileFromTemplate(templateFile, templateData, outputFile) {
  // To support running from any arbitrary directory, reference our templates relative to this file, and not the
  // current working directory.
  const data = fs.readFileSync(`${__dirname}/${templateFile}`);

  const template = Handlebars.compile(data.toString());
  const contents = template(templateData);

  fs.writeFileSync(outputFile, contents);
  console.log(`Created file: [${outputFile}]`);
}

function createDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function createSourceCodeFile(argv, templateData) {
  createDirectory(`${argv.outputDirectory}${ARTIFACT_DIRECTORY_JAVASCRIPT}/GeneratedVocab`);

  createFileFromTemplate(
    '../../templates/javascript-rdf-ext.hbs',
    templateData,
    `${
      argv.outputDirectory
    }${ARTIFACT_DIRECTORY_JAVASCRIPT}/GeneratedVocab/${templateData.vocabNameAndPrefixOverride ||
      templateData.vocabName}.js`
  );
}

function createPackagingFiles(argv) {
  createDirectory(argv.outputDirectory);

  createFileFromTemplate(
    '../../templates/index.hbs',
    argv,
    `${argv.outputDirectory}${ARTIFACT_DIRECTORY_JAVASCRIPT}/index.js`
  );

  // For our README (which uses Markdown format), if our artifact was made up
  // of multiple vocabs, break up our description into a list representation.
  // (TODO: if a vocab description contains a newline, this will split it out
  // into another list item!).
  const dataWithMarkdownDescription = argv.vocabListFile
    ? { ...argv, description: argv.description.replace(/\\n/g, '\n\n  *') }
    : argv;

  createFileFromTemplate(
    '../../templates/README.hbs',
    dataWithMarkdownDescription,
    `${argv.outputDirectory}${ARTIFACT_DIRECTORY_JAVASCRIPT}/README.MD`
  );

  createFileFromTemplate(
    '../../templates/package.hbs',
    argv,
    `${argv.outputDirectory}${ARTIFACT_DIRECTORY_JAVASCRIPT}/package.json`
  );

  return argv;
}

module.exports.createSourceCodeFile = createSourceCodeFile;
module.exports.createPackagingFiles = createPackagingFiles;
module.exports.ARTIFACT_DIRECTORY_JAVASCRIPT = ARTIFACT_DIRECTORY_JAVASCRIPT;
