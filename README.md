
# Artifact Generator

This tool generates deployable artifacts for various programming languages
(e.g. NPM Node modules for Javascript, JARs for Java, assemblies for C#, etc.).
These artifacts contain source files defining programming-language constants
for the terms (e.g. the Classes and properties) found in RDF vocabularies (such
as Schema.org, or FOAF, or our own custom vocabularies).

# Prerequisites

## npm

To install the Artifact Generator you will need `npm`, if you don't already have
it.

We highly recommend the use of node version manager (nvm) to manage multiple
versions of npm and also set to up your npm permissions properly. To install
nvm, follow the instructions [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-version-manager-to-install-node-js-and-npm).

**Note on `npm` permissions:**

If you do not use `nvm`, and you try to install the Artifact Generator globally,
then you may receive **EACCES** permission errors, or other permission-related
errors, when trying to run `npm install -g`.

Please refer to this npm [document](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)
on how to set your permissions correctly.

## Webpack

If you want to bundle artifacts to make them usable into the browser, you will need to install Webpack: `npm install webpack webpack-cli --save-dev`

# Table of contents

- [Introduction](./documentation/introduction.md)
- [Quickstart](#quickstart)
- [Feature overview](./documentation/feature-overview.md)
- [Advanced configuration](./documentation/advanced-configuration.md)

<a id="quickstart"></a>

# Quick start

---
**__Temporarily__**, until we release the Artifact Generator to the public NPM 
repository, we manually reference the github NPM registry. You will need to generate
a Personal Access Token from you Github account developer's settings, and use it
to authenticate with the command `npm login --registry https://npm.pkg.github.com` 
---

Install globally (so you can run the Artifact Generator from any directory):
```shell
npm -g install @inrupt/lit-artifact-generator --registry https://npm.pkg.github.com/inrupt
```

Ensure the installation completed successfully: 
```shell
lit-artifact-generator --help
```

If you cloned the repository, you can replace all the example references below to `lit-artifact-generator ...` with `node index.js ...`.

## Create a NodeJS artifact

Run the generator using a public demo vocabulary, in this case a simple Pet
Rock vocabulary, telling it not to prompt us for any input (i.e. `--noprompt`):

```shell
lit-artifact-generator generate --inputResources https://team.inrupt.net/public/vocab/PetRock.ttl --noprompt
```

This should generate a Javascript artifact inside the default `Generated`
directory that provides constants for the things described within the Pet Rock
vocabulary.

We can now use this Javascript artifact directly in our applications, both
NodeJS and browser. For example, for NodeJS manually create a new `package.json` 
file using the following content, that references the local Pet Rock artifact 
we just generated:

```javascript
{
  "name": "LIT-Artifact-Generator-Demo",
  "description": "Tiny demo application using generated Javascript artifact from a custom Pet Rock RDF vocabulary.",
  "license": "MIT",
  "private": true,
  "dependencies": {
    "mock-local-storage": "^1.1.8",
    "@lit/generated-vocab-pet-rock": "file:Generated/SourceCodeArtifacts/Javascript"
  }
}
``` 

...and create this trivial application as `index.js`:

```javascript
require('mock-local-storage');
const { PET_ROCK } = require('@lit/generated-vocab-pet-rock');

console.log(`What is Pet Rock 'shinyness'?\n`);

console.log(`Our vocabulary describes it as:`);
console.log(`"${PET_ROCK.shinyness.comment}"\n`);

console.log(`Or in Spanish (our Pet Rock vocab has Spanish translations!):`);
console.log(`"${PET_ROCK.shinyness.commentInLang('es')}"`);
``` 

Finally, simply run `npm install`...
```shell script
npm install
```

...and run our simple NodeJS application...
```shell script
node index.js 
```

...we should see this output:
```
[demo]$ node index.js 
What is Pet Rock 'shinyness'?

Our vocabulary describes it as:
"How wonderfully shiny a rock is."

Or in Spanish (our Pet Rock vocab has Spanish translations!):
"Qué maravillosamente brillante es una roca."
[demo]$ 
```

## Create a front-end Javascript artifact

Run the generator using a public demo vocabulary, in this case a simple Pet
Rock vocabulary provided by inrupt, telling it not to prompt for any input
(i.e. `--noprompt`), and asking for a bundled Javascript artifact (i.e.
`supportBundling`):

```shell
lit-artifact-generator generate --inputResources https://team.inrupt.net/public/vocab/PetRock.ttl --noprompt --supportBundling
```

This generates an artifact, and runs Webpack to bundle all of it's dependencies. 
Everything is generated into the default `Generated` directory, and bundled
into the `Generated/SourceCodeArtifacts/Javascript/dist` directory.

If you copy-and-paste the following HTML into a new file in the directory from which you ran the Artifact Generator (i.e. te directory which should now have a `Generated` directory within it)...

```html
<html>
	<body>
		<p>My Pet Rock shinyness "<span id="shinyness-comment"></span>" by <span id="petrock-iri"></span></p>
	
	<script src="./Generated/SourceCodeArtifacts/Javascript/dist/index.js" type="text/javascript"/></script>
	
	<script type="text/javascript">
		document.getElementById("shinyness-comment").innerHTML = `${PR.shinyness.comment}`;
		document.getElementById("petrock-iri").innerHTML = `${PR.NAMESPACE}`;
	</script>
	
	</body>
</html>
```

...and open this HTML file with a web browser, you should see:

```
My Pet Rock shinyness is defined as "How wonderfully shiny a rock is." by https://team.inrupt.net/public/vocab/PetRock.ttl#
```
