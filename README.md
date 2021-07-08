# Artifact Generator

This tool automatically generates deployable artifacts for various programming
languages (e.g., npm Node.js modules for JavaScript, JARs for Java, assemblies
for C#, etc.). These artifacts contain source-code files defining
programming-language constants for the terms (e.g., the Classes, Properties and
Constants) found in RDF vocabularies (such as Schema.org, FOAF, Activity
Streams, Solid vocabularies, or your own custom vocabularies).

# Prerequisites

## npm

To install the Artifact Generator you will need `npm` (although it can also
be run via `npx`).

We highly recommend the use of Node.js Version Manager (nvm) to manage multiple
versions of `npm`, and also to set up your npm permissions properly. To install
nvm, follow the instructions [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-version-manager-to-install-node-js-and-npm).

**Note on `npm` permissions:**

If you do not use `nvm`, and you try to install the Artifact Generator globally,
you may encounter **EACCES** permission errors, or other permission-related
errors, when trying to run `npm install -g`. If so, please refer to this npm
[document](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)
on how to set your permissions correctly.

## Webpack

If you wish to bundle generated artifacts for use in browsers, you will need to
install Webpack, e.g., `npm install webpack webpack-cli --save-dev`

# Table of contents

- [Introduction](./documentation/introduction.md)
- [Quickstart](#quickstart)
- [Feature overview](./documentation/feature-overview.md)
- [Advanced configuration](./documentation/advanced-configuration.md)

<a id="quickstart"></a>

# Quick start

---
**__Temporarily,__** until we release the Artifact Generator to a public npm
repository, you'll need to manually clone down the source code (which would be
the easiest option (see option 1 below), or reference the private Inrupt GitHub
npm registry to be able to install the Artifact Generator module that we
currently publish there.

#### Accessing private GitHub registries

To access the private Inrupt GitHub npm registry, you'll need to first generate
a Personal Access Token (PAT) from your personal GitHub account (under the
'Developer settings' tab on your profile page).

Note that when generating a new PAT for accessing the Artifact Generator module,
you need only select the scopes of 'repo', and just the 'read:packages' option
under the 'write:packages' scope.

Also note that the generated PAT value (i.e., a random-looking token string such
as `7a2c9c64b2d90a1da4eec92d0fe2c46b706a7a15`) will be displayed once,
**_and only once_**, by GitHub, so if you want to use this PAT repeatedly,
you'll need to store a copy of it somewhere secure (such as 1Password). We'd
recommend adding a note of where you've stored in it the 'Note' text field
available when you generate the PAT in the first place!

You now need to use the value of the generated PAT token as the 'Password' value
to log into the GitHub registry, using the `npm login` command, for example:

```bash
> npm login --registry https://npm.pkg.github.com
Username: <Your GitHub User Name>
Password: <The generated PAT value>
Email: (this IS public) <Your EMail as registered in your GitHub account>
Logged in as <Your GitHub User Name> on https://npm.pkg.github.com/.
>
```

And now you'll be able to install (either globally or locally) that Artifact
Generator module on your local machine by explicitly referencing the GitHub npm
registry (see options 1 and 2 below).

---

You have a number of options for running the Artifact Generator:

1. Install it globally (convenient if you plan to use it a lot, and don't mind
   globally installed packages).
2. Install it locally (convenient for regular use, but you want to avoid
   globally installed packages).   
3. Clone the repo and execute it from the install directory (slightly less
   convenient than a global install, but still useful if you plan to use it
   often).
4. Unfortunately `npx` cannot be used to run the generator from a private GitHub
   registry, even when logged into that registry using a PAT:
   
   ```bash
   > npm_config_registry=https://npm.pkg.github.com/ npx @inrupt/artifact-generator --version
   Need to install the following packages:
   @inrupt/artifact-generator
   Ok to proceed? (y) y
   npm ERR! code E404
   npm ERR! 404 Not Found - GET https://npm.pkg.github.com/@rdfjs%2ffetch-lite - npm package "fetch-lite" does not exist under owner "rdfjs"
   npm ERR! 404
   npm ERR! 404  '@rdfjs/fetch-lite@^2.1.0' is not in the npm registry.
   npm ERR! 404 You should bug the author to publish it (or use the name yourself!)
   npm ERR! 404
   npm ERR! 404 Note that you can also install from a
   npm ERR! 404 tarball, folder, http url, or git url.
   
   npm ERR! A complete log of this run can be found in:
   npm ERR!     /home/pmcb55/.npm/_logs/2021-03-09T12_35_47_281Z-debug.log
   ```

### 1. Global install

We don't recommend installing any Node.js packages globally, but if you do want
to run the Artifact Generator easily from any directory on your local machine,
you can do so by running:

```shell
npm -g install @inrupt/artifact-generator  --registry https://npm.pkg.github.com/inrupt
```

Ensure the installation completed successfully:
```shell
artifact-generator --help
```

### 2. Local install

Create a new npm project and install the Artifact Generator as a dependency. You
can then run it by referencing it's `index.js` from within the `node_modules`
directory. For example:

```bash
> npm init
This utility will walk you through creating a package.json file.
:
:
Is this OK? (yes) 
>
> npm install @inrupt/artifact-generator --registry https://npm.pkg.github.com/inrupt
:
:
+ @inrupt/artifact-generator@0.13.3
added 204 packages from 247 contributors in 25.349s

17 packages are looking for funding
  run `npm fund` for details
>
> node node_modules/@inrupt/artifact-generator/index.js --version
0.13.3
>
```


### 3. Clone the GitHub repository

If you wish to clone, build and run the Artifact Generator instead of installing
it as a pre-built module, then follow these steps:

```script
> git clone git@github.com:inrupt/artifact-generator.git
> cd artifact-generator
> npm install
```

You can now run the Artifact Generator from the root of the cloned directory by
simply executing:

```script
> node index.js <Normal Command-Line Options>
>
> node index.js --version
0.13.3
>
```

You can now replace all the example references below that begin with
`artifact-generator ...` with `node index.js ...` instead.


## Create a Node.js artifact

We can very quickly demonstrate the generator using any publicly available RDF
vocabulary.

In this example we'll use a simple Pet Rock vocabulary provided publicly by
Inrupt, asking the generator not to prompt us for any manual input during the
generation process (i.e., by using the `--noprompt` option):

```shell
artifact-generator generate --inputResources https://team.inrupt.net/public/vocab/PetRock.ttl --noprompt
```

This should generate a JavaScript artifact inside the default `Generated`
directory. Specifically it should generate a JavaScript file named PET_ROCK.js
in the directory `Generated/SourceCodeArtifacts/JavaScript/GeneratedVocab` that 
provides constants for all the terms described within the public Pet Rock
vocabulary.

We can now use this JavaScript artifact directly in our applications, both
Node.js and browser based. For example, for Node.js manually create a new 
`package.json` file using the following content that references the Pet Rock
artifact we just generated:

```javascript
{
  "name": "Artifact-Generator-Demo",
  "description": "Tiny demo application using generated JavaScript artifact from a custom Pet Rock RDF vocabulary.",
  "license": "MIT",
  "private": true,
  "dependencies": {
    "mock-local-storage": "^1.1.8",
    "@inrupt/generated-vocab-pet-rock": "file:Generated/SourceCodeArtifacts/JavaScript"
  }
}
``` 

...and create this trivial application as `index.js`:

```javascript
require('mock-local-storage');
const { PET_ROCK } = require('@inrupt/generated-vocab-pet-rock');

console.log(`What is Pet Rock 'shinyness'?\n`);

console.log(`Our vocabulary describes it as:`);
console.log(`"${PET_ROCK.shinyness.comment}"\n`);

console.log(`Or in Spanish (our Pet Rock vocab has Spanish translations!):`);
console.log(`"${PET_ROCK.shinyness.asLanguage('es').comment}"`);
``` 

Now simply `npm install`...
```shell script
npm install
```

...and execute this super-simple Node.js application...
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

Run the Artifact Generator using a public demo vocabulary, in this case
the simple Pet Rock vocabulary provided by Inrupt, telling it not to prompt 
for any input (i.e., `--noprompt`), and asking for a bundled (i.e., WebPack'ed)
JavaScript artifact (i.e., via the `--supportBundling` command-line flag):

```shell
artifact-generator generate --inputResources https://team.inrupt.net/public/vocab/PetRock.ttl --noprompt --supportBundling
```

This generates an artifact, and runs Webpack to bundle all of it's dependencies.
Everything is generated into the default `Generated` directory,
and bundled into the `Generated/SourceCodeArtifacts/JavaScript/dist` directory.

If you copy-and-paste the following HTML into a new file in the directory
from which you ran the Artifact Generator (i.e., the directory which should now
have a `Generated` directory within it)...

```html
<html>
	<body>
		<p>My Pet Rock shinyness "<span id="shinyness-comment"></span>" by <span id="petrock-iri"></span></p>
	
	<script src="./Generated/SourceCodeArtifacts/JavaScript/dist/index.js" type="text/javascript"/></script>
	
	<script type="text/javascript">
		document.getElementById("shinyness-comment").innerHTML = `${PET_ROCK.shinyness.comment}`;
		document.getElementById("petrock-iri").innerHTML = `${PET_ROCK.NAMESPACE}`;
	</script>
	
	</body>
</html>
```

...and open this HTML file with a web browser, you should see:

```
My Pet Rock shinyness is defined as "How wonderfully shiny a rock is." by https://team.inrupt.net/public/vocab/PetRock.ttl#
```

# The relationship between generated source code artifacts and RDF vocabularies

Source code artifacts (e.g., Java JARs, Node.js modules, C# assemblies, etc.)
can be generated from individual RDF vocabularies, or from collections of
multiple RDF vocabularies. For example, in the case of Java, a single generated
Java JAR may contain multiple Java Classes, with each Class representing the
'terms' (i.e., the Classes, Properties and Constants) described within a single
RDF vocabulary. In other words, each Java Class within that JAR would define
static constants for each of the defined terms within a corresponding RDF
vocabulary.

Perhaps the single most important, and widely used, vocabulary today is
Schema.org, from Google, Mircosoft, Yaoo and Yandex. The official RDF for
Schema.org is defined here: `https://schema.org/version/latest/schemaorg-current-http.ttl`.

But any individual or company is completely free to use the Artifact
Generator (or any other generator!) to generate their own source code artifacts
to represent the terms defined in Schema.org. And of course, they are also free
to use the Artifact Generator to generate source code artifacts (e.g., a
Java JAR containing Java classes) that represents any available RDF
vocabularies, including their own purely internal and/or proprietary
vocabularies.

So anyone is completely free to define their own RDF vocabularies. Likewise,
anyone is completely free to run the Artifact Generator against any available
RDF vocabulary, meaning it's perfectly fine to have a multitude of generated
artifacts claiming to represent the terms from any RDF vocabulary.

In other words, it's important to remember that it's not necessary to control
an RDF vocabulary in order to generate useful source code artifacts from it.

For instance, IBM could choose to generate their own JavaScript module from
the Schema.org vocabulary, and publish their generated module for others to
depend on as follows:
```json
dependencies: {
  "@ibm/generated-from-schema.org": "^1.5.3"
}
```

...whereas Accenture (a major competitor to IBM) are completely free to also
publish their generated JavaScript (or Java, or C#, or Scala, etc.) source
code artifacts representing exactly the same Schema.org vocabulary, e.g.:
```json
dependencies: {
  "@accenture/generated-from-schema.org-but-different-than-IBM-version": "^0.0.9"
}
```

The Artifact Generator allows each of these entities to configure their
generated artifacts as they see fit, e.g., perhaps IBM augments their version
with translations for various languages (that Schema.org does not provide
today), or Accenture augments their version with references to related resources
(e.g., via `rdfs:seeAlso` references) to similar terms in existing Accenture
glossaries or data dictionaries.

Of course, individuals or companies are always completely free to choose
between reusing existing generated artifacts from entities that they trust,
or generating their own internal-only artifacts. Or they could choose to 
create their own programming-language-specific Classes containing constants
for the terms in existing common RDF vocabularies (but why would anyone
choose to do that... :) ?).
