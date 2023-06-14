# Artifact Generator

This tool automatically generates deployable artifacts for various programming
languages (e.g., npm Node.js modules for JavaScript, JARs for Java, assemblies
for C#, etc.). These artifacts contain source-code files defining
programming-language constants for the terms (e.g., the Classes, Properties,
and Constants) found in RDF vocabularies (such as Schema.org, FOAF, Activity
Streams, Solid vocabularies, or your own custom vocabularies).

## Quick start demo

To immediately appreciate some of the major capabilities enabled by the Artifact
Generator, you can easily run our very simple 
[Runnable Demo](example/demo-DisplayVocabTermMetadata/README.md), which simply
displays some very intuitive questions, with the answers coming directly from
vocabulary metadata.

# Prerequisites

## npm

To install the Artifact Generator you will need `npm` (although it can also
be run via `npx`).

We highly recommend the use of Node.js Version Manager (nvm) to manage multiple
versions of `npm`, and also to set up your npm permissions properly. To install
nvm, follow the instructions
[here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-version-manager-to-install-node-js-and-npm).

**Note on `npm` permissions:**

If you do not use `nvm`, and you try to install the Artifact Generator globally,
you may encounter **EACCES** permission errors, or other permission-related
errors, when trying to run `npm install -g`. If so, please refer to this npm
[document](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)
on how to set your permissions correctly.

# Table of contents

- [RunnableDemo](example/demo-DisplayVocabTermMetadata/README.md)
- [Quickstart](#quickstart)
- [Introduction](./documentation/introduction.md)
- [Feature overview](./documentation/feature-overview.md)
- [Generated directory structure](./documentation/generated-directory-structure.md)  
- [Multiple forms of generated artifact](./documentation/multiple-forms-of-artifact.md)
- [Generated source-code documentation](./documentation/generated-source-code-documentation.md)
- [The relationship between generated source-code artifacts and RDF vocabularies](./documentation/relationship-artifact-vocab.md)
- [Advanced configuration](./documentation/advanced-configuration.md)

<a id="quickstart"></a>

# Quick start

There are a number of options for running the Artifact Generator:

1. Install it globally (convenient if you plan to use it a lot, and you don't
   mind globally installed packages).
2. Install it locally (convenient for regular use, but you want to avoid
   globally installed packages).   
3. Clone the repo and execute it from the install directory (slightly less
   convenient than a global install, but still useful if you plan to use it
   often).
4. Use `npx` (very convenient for single time use, or just to try it out).

### 1. Global install

We don't recommend installing any Node.js packages globally, but if you do want
to run the Artifact Generator easily from any directory on your local machine,
you can do so by running:

```shell
npm -g install @inrupt/artifact-generator
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
> npm install @inrupt/artifact-generator
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
> node src/index.js <Normal Command-Line Options>
>
> node src/index.js --version
2.0.0
>
```

You can now replace all the example references below that begin with
`artifact-generator ...` with `node src/index.js ...` instead.

### 4. Use `npx`

If you just want to try out the Artifact Generator, or don't like installing
packages, then you can run it very easily using `npx`:

```bash
> npm_config_registry=https://npm.pkg.github.com/ npx @inrupt/artifact-generator --version
```

## Create a Node.js artifact

We can very quickly demonstrate the generator using any publicly available RDF
vocabulary.

In this example we'll use a simple Pet Rock vocabulary provided publicly by
Inrupt, asking the generator not to prompt us for any manual input during the
generation process (i.e., by using the `--noPrompt` option):

```shell
artifact-generator generate --inputResources https://team.inrupt.net/public/vocab/PetRock.ttl --noPrompt
```

This should generate a JavaScript artifact inside the default `Generated`
directory. Specifically it should generate a JavaScript file named PET_ROCK.js
in the directory `Generated/SourceCodeArtifacts/JavaScript/GeneratedVocab` that 
provides constants for all the terms described within the public Pet Rock RDF
vocabulary.

By default, this will include Rollup configuration to bundle all of
its dependencies and produce UMD and ES modules, which should be usable
across Node.js and browsers. To build those, you need to run the `install`
and `build` commands from inside the `Generated/SourceCodeArtifacts/JavaScript/`
directory:

```shell
npm install
```

```shell
npm run build
```

The output will be bundled into the `Generated/SourceCodeArtifacts/JavaScript/dist`
directory.

If you'd prefer not to produce a bundled JavaScript artifact, you can run the
`generate` command with the `--supportBundling` option set to `false`:

```shell
artifact-generator generate --inputResources https://team.inrupt.net/public/vocab/PetRock.ttl --noPrompt --supportBundling=false
```

We can now use this JavaScript artifact directly in our applications, both
Node.js and browser-based. For example, for Node.js manually create a new 
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

console.log(`What is Pet Rock 'shininess'?\n`);

console.log(`Our vocabulary describes it as:`);
console.log(PET_ROCK.shininess.comment);

console.log(`Or in Spanish (our Pet Rock vocab has Spanish translations!):`);
console.log(PET_ROCK.shininess.asLanguage('es').comment);
``` 

Now simply `npm install`...
```shell script
npm install
```

...and execute this super-simple Node.js application...
```shell script
node index.js 
```

...and you should see the following output:
```
[demo]$ node index.js 
What is Pet Rock 'shininess'?

Our vocabulary describes it as:
"How wonderfully shiny a rock is."

Or in Spanish (our Pet Rock vocab has Spanish translations!):
"Qué maravillosamente brillante es una roca."
[demo]$ 
```

## Create a front-end JavaScript artifact

If a bundled artifact is generated, it can be used directly in a
`<script>` tag. If you copy-and-paste the following HTML into a
new file in the directory from which you ran the Artifact Generator
(i.e., the directory which should now have a `Generated` directory
within it)...

```html
<html>
	<body>
		<p>My Pet Rock shininess is defined as: "<span id="shininess-comment"></span>"<p>
        <p>in vocab [<span id="petrock-iri"></span>].</p>
	
	<script src="./Generated/SourceCodeArtifacts/JavaScript/dist/index.js" type="text/javascript"/></script>
	
	<script type="text/javascript">
		document.getElementById("shininess-comment").innerHTML = PET_ROCK.shininess.comment;
		document.getElementById("petrock-iri").innerHTML = PET_ROCK.NAMESPACE;
	</script>
	
	</body>
</html>
```

...and open this HTML file with a web browser, you should see:

```
My Pet Rock shininess is defined as: "How wonderfully shiny a rock is."
in vocab [https://team.inrupt.net/public/vocab/PetRock.ttl#].
```

# There's more!

Don't forget, there's a **_lot_** more documentation related to the Artifact
Generator, all contained under the `/documentation` directory of this
repository, but also linked to from the [Table of Contents](#table-of-contents)
section above!
