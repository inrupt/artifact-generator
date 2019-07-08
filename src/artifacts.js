const fs = require('fs');
const Handlebars = require('handlebars');

function createArtifact(templateFile, outputFile, templateData) {
  const data = fs.readFileSync(templateFile);

  const template = Handlebars.compile(data.toString());
  const contents = template(templateData);

  fs.writeFileSync(outputFile, contents);
  console.log(`Created artifiact: [${outputFile}]`);
}

function createArtifacts(argv, templateData) {
  if (!fs.existsSync(argv.outputDirectory)) {
    fs.mkdirSync(argv.outputDirectory);
  }

  createArtifact('templates/template.hbs', `${argv.outputDirectory}/index.ts`, templateData);
  createArtifact('templates/package.hbs', `${argv.outputDirectory}/package.json`, templateData);
}

module.exports.createArtifacts = createArtifacts;
