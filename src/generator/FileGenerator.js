const fs = require('fs');
const Handlebars = require('handlebars');

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
  createDirectory(`${argv.outputDirectory}/Generated`);

  createFileFromTemplate(
    '../../templates/javascript-rdf-ext.hbs',
    templateData,
    `${argv.outputDirectory}/Generated/${templateData.vocabName}.js`
  );
}

function createPackagingFiles(argv) {
  createDirectory(argv.outputDirectory);

  createFileFromTemplate('../../templates/index.hbs', argv, `${argv.outputDirectory}/index.js`);

  createFileFromTemplate(
    '../../templates/package.hbs',
    argv,
    `${argv.outputDirectory}/package.json`
  );

  return argv;
}

module.exports.createSourceCodeFile = createSourceCodeFile;
module.exports.createPackagingFiles = createPackagingFiles;
