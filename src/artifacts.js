const fs = require('fs');
const Handlebars = require('handlebars');

function createArtifact(template, outputFile, templateData) {
  const data = fs.readFileSync(template);

  const templateCompiled = Handlebars.compile(data.toString());
  const contents = templateCompiled(templateData);

  fs.writeFileSync(outputFile, contents);
  console.log(`Created artifiact: ${outputFile}`);
}

function createArtifacts(templateData) {
  const generatedDirectory = 'generated';

  if (!fs.existsSync(generatedDirectory)) {
    fs.mkdirSync(generatedDirectory);
  }

  createArtifact('templates/template.hbs', 'generated/index.ts', templateData);
  createArtifact('templates/package.hbs', 'generated/package.json', templateData);
}

module.exports.createArtifacts = createArtifacts;
