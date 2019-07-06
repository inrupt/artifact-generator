const fs = require('fs');
const Handlebars = require('handlebars');

function createArtifacts(argv, templateData) {
  const outputDirectory = argv.outputDirectory;

  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
  }

  createArtifact('templates/template.hbs', `${outputDirectory}/index.ts`, templateData);
  createArtifact(
    'templates/package.hbs',
    `${outputDirectory}/package.json`,
    templateData
  );
}

function createArtifact(templateFile, outputFile, templateData) {
  const data = fs.readFileSync(templateFile);

  const template = Handlebars.compile(data.toString());
  const contents = template(templateData);

  fs.writeFileSync(outputFile, contents);
  console.log(`Created artifiact: [${outputFile}]`);
}

module.exports.createArtifacts = createArtifacts;
