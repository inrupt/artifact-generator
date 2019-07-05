const fs = require('fs');
const Handlebars = require('handlebars');

function createArtifacts(templateData) {
  const generatedDirectory = 'generated';

  if (!fs.existsSync(generatedDirectory)) {
    fs.mkdirSync(generatedDirectory);
  }

  createArtifact('templates/template.hbs', 'generated/index.ts', templateData);
  createArtifact(
    'templates/package.hbs',
    'generated/package.json',
    templateData
  );
}

function createArtifact(template, outputFile, templateData) {
  let data = fs.readFileSync(template);

  var template = Handlebars.compile(data.toString());
  var contents = template(templateData);

  fs.writeFileSync(outputFile, contents);
  console.log(`Created artifiact: ${outputFile}`);
}

module.exports.createArtifacts = createArtifacts;
