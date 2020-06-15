
# Artifact Generator

This tool automatically generates deployable artifacts for various programming
languages (e.g. NPM Node modules for JavaScript, JARs for Java, assemblies for
C#, etc.) that contain source-code files defining programming-language
constants for the terms (e.g. the Classes, Properties and Literals) found in
RDF vocabularies (such as Schema.org, FOAF, Activity Streams, or your own
custom vocabularies).

# Prerequisites

## npm

To install the Artifact Generator you will need `npm` (although it can also
be run via `npx`).

We highly recommend the use of Node Version Manager (nvm) to manage multiple
versions of `npm` and also to set up your npm permissions properly. To install
nvm, follow the instructions [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-version-manager-to-install-node-js-and-npm).

**Note on `npm` permissions:**

If you do not use `nvm`, and you try to install the Artifact Generator globally,
you may encounter **EACCES** permission errors, or other permission-related
errors, when trying to run `npm install -g`. If so, please refer to this npm
[document](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)
on how to set your permissions correctly.

## Webpack

If you wish to bundle generated artifacts for use in browsers, you will need to
install Webpack, e.g. `npm install webpack webpack-cli --save-dev`

# Table of contents

- [Introduction](./documentation/introduction.md)
- [Quickstart](#quickstart)
- [Feature overview](./documentation/feature-overview.md)
- [Advanced configuration](./documentation/advanced-configuration.md)

<a id="quickstart"></a>

# Quick start

---
**__Temporarily__** until we release the LIT Artifact Generator to a public NPM 
repository, we need to manually reference a private GitHub NPM registry. You will
need to generate a Personal Access Token (PAT) from your GitHub account (under the
'Developer settings' tab on your profile page), and use it to authenticate with 
the command `npm login --registry https://npm.pkg.github.com`.  NOTE: You'll also
need to add the `--registry` switch (with the suffix of `/inrupt`) when installing
too.
---

To install globally (so that you can run the LIT Artifact Generator from any
directory):
```shell
npm -g install @solid/lit-artifact-generator
```

Ensure the installation completed successfully:
```shell
lit-artifact-generator --help
```

If you wish to clone the repository instead of installing the LIT Artifact
Generator, you can run it from the cloned directory by simply replacing all the
example references below to `lit-artifact-generator ...` with 
`node index.js ...`.

## Create a NodeJS artifact

We can quickly demonstrate the generator using any publicly available RDF
vocabulary. In this case we'll use a simple Pet Rock vocabulary that we provide,
telling the generator not to prompt us for any manual input during the generation
process (i.e. `--noprompt`):

```shell
lit-artifact-generator generate --inputResources https://team.inrupt.net/public/vocab/PetRock.ttl --noprompt
```

This should generate a JavaScript artifact inside the default `Generated`
directory. Specfically it should generate a JavaScript file named PET_ROCK.js in
the directory `Generated/SourceCodeArtifacts/JavaScript/GeneratedVocab` that 
provides constants for all the 'things' described within the Pet Rock RDF
vocabulary.

We can now use this JavaScript artifact directly in our applications, both
NodeJS and browser based. For example, for NodeJS manually create a new 
`package.json` file using the following content that references the Pet Rock
artifact we just generated:

```javascript
{
  "name": "LIT-Artifact-Generator-Demo",
  "description": "Tiny demo application using generated JavaScript artifact from a custom Pet Rock RDF vocabulary.",
  "license": "MIT",
  "private": true,
  "dependencies": {
    "mock-local-storage": "^1.1.8",
    "@lit/generated-vocab-pet-rock": "file:Generated/SourceCodeArtifacts/JavaScript"
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

Now simply `npm install`...
```shell script
npm install
```

...and execute this super-simple NodeJS application...
```shell script
node index.js 
```

...we should see the following output:
```
[demo]$ node index.js 
What is Pet Rock 'shinyness'?

Our vocabulary describes it as:
"How wonderfully shiny a rock is."

Or in Spanish (our Pet Rock vocab has Spanish translations!):
"Qué maravillosamente brillante es una roca."
[demo]$ 
```

## Create a front-end JavaScript artifact

Run the LIT Artifact Generator using a public demo vocabulary, in this case
the simple Pet Rock vocabulary provided by Inrupt, telling it not to prompt 
for any input (i.e. `--noprompt`), and asking for a bundled (i.e. WebPack'ed)
JavaScript artifact (i.e. via the `--supportBundling` command-line flag):

```shell
lit-artifact-generator generate --inputResources https://team.inrupt.net/public/vocab/PetRock.ttl --noprompt --supportBundling
```

This generates an artifact, and runs Webpack to bundle all of it's
dependencies. Everything is generated into the default `Generated` directory,
and bundled into the `Generated/SourceCodeArtifacts/JavaScript/dist`
directory.

If you copy-and-paste the following HTML into a new file in the directory
from which you ran the Artifact Generator (i.e. te directory which should now
have a `Generated` directory within it)...

```html
<html>
	<body>
		<p>My Pet Rock shinyness "<span id="shinyness-comment"></span>" by <span id="petrock-iri"></span></p>
	
	<script src="./Generated/SourceCodeArtifacts/JavaScript/dist/index.js" type="text/javascript"/></script>
	
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

# The relationship between LIT-generated source code artifacts and RDF vocabularies

Source code artifacts (e.g. Java JARs, Node modules, C# assemblies, etc.) can
be generated from individual RDF vocabularies, or from collections of multiple
RDF vocabularies. For example, in the case of Java, a single generated Java JAR
may contain multiple Java Classes, with each Class representing the 'terms'
(i.e. the Classes, Properties and Literals) within a single RDF vocabulary. In
other words, each Java Class within that JAR would define static constants for
each of the defined terms within a corresponding RDF vocabulary.

Perhaps the single most important, and widely used, vocabulary today is
Schema.org, from Google, Mircosoft, Yaoo and Yandex. The official RDF for
Schema.org is defined here: https://schema.org/version/latest/schema.ttl.

But any individual or company is completely free to use the LIT Artifact
Generator (or any other generator!) to generate their own source code artifacts
to represent the terms defined in Schema.org. And of course, they are also free
to use the LIT Artifact Generator to generate source code artifacts (e.g. a
Java JAR containing Java classes) that represent any available RDF
vocabularies, including their own, purely internal and proprietary
vocabularies.

So any individual or company is completely free to define their own RDF
vocabularies. Likeswise, any individual or company is completely free to run
the LIT Artifact Generator against any available RDF vocabulary, meaning
it's perfectly fine to have a multitude of generated artifacts claiming to
represent the terms in any RDF vocabulary.

In other words, it's important to remember that it's not necessary to control
an RDF vocabulary in order to generate useful source code artifacts from it.

For instance, IBM could choose to generate their own JavaScript module from
the Schema.org vocabulary, and publish their generated module for others to
depend on as follows:
```json
dependencies: {
  "@ibm/generated-from-schema.org":"^1.5.3"
}
```

...whereas Accenture (a major competitor to IBM) are completely free to also
publish their generated JavaScript (or Java, or C#, or Scala, etc.) source
code artifacts representing exactly the same Schema.org vocabulary, e.g.:
```json
dependencies: {
  "@accenture/generated-from-schema.org-but-different-than-IBM-version":"^0.0.9"
}
```

The LIT Artifact Generator allows each of these entities to configure their
generated artifacts as they see fit, e.g. perhaps IBM augments their
version with translations for various languages (that Schema.org does not
provide today), or Accenture augments their version with references to
related resources (e.g. via `rdfs:seeAlso` references) to similar terms in
existing Accenture gloassaries or data dictionaries.

Of course, individuals or companies are always completely free to choose
between reusing existing generated artifacts from entities that they trust,
or generating their own internal-only artifacts (or they could choose to 
create their own programming-language-specific Classes containing constants
for the terms in existing common RDF vocabularies (but why would anyone
choose to do that... :) ?)).
