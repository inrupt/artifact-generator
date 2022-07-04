# Demo of how to add your own Custom templates

This repository shows how you can add your own custom templates to generate
source-code, and packaging for that source-code, in whatever ways work best for
you (examples of 'packaging' would be a `pom.xml` file for Java source-code that
uses Maven, or `package.json` for packaging JavaScript or TypeScript using
`npm` or `yarn`).

## Quick Setup

- Run:
  ```
  npx @inrupt/artifact-generator generate --vocabListFile ./custom-template-elixir.yml --noPrompt --force
  ```
- ...you should see a collection of generated source-code artifacts in:
  `./Generated/SourceCodeArtifacts/`, including:
  - Elixir
  - TypeScript

## Why use custom templates?

The ability to use custom templates allows you to use the Artifact Generator to
generate code for programming languages not yet supported internally by the
Artifact Generator itself, or to alter the structure or layout of generated code
even for programming languages that are supported today.

We use the example of generating source-code and packaging for Elixir, using
local custom templates.

We also show the generation of TypeScript from the existing internal templates
that come bundled with the Artifact Generator, just so you can see the
generation of source-code for _multiple_ programming languages in a single run,
where one of those languages is being generated from local custom templates
(i.e., Elixir), and the other from internal templates (i.e., TypeScript).

## Options for running the Artifact Generator

If we want more options for running the Artifact Generator (beyond using `npx`),
see the [Quick Start](../../README.md#quick-start) section of the main README.

## Running with a local YAML configuration file

To configure the Artifact Generator to generate source code from custom
templates we need to create and configure our own YAML file. This YAML file will
also reference all the vocabularies we wish to code-generate source-code and
packaging for.

We have provided a sample YAML file named `custom-template-elixir.yml`, which
defines two sections under `artifactToGenerate`, one for Elixir and one for
TypeScript, and under `vocabList` we provide references to all the vocabularies
we wish to generate source-code for (i.e., the common vocabularies vCard, RDF,
RDFS, and OWL).

Now, all we need to do is to tell the Artifact Generator to execute in
`generate` mode, tell it our YAML filename, and provide the `--noPrompt` switch
so that it doesn't run in interactive mode (which is useful when we're using the
defaults to generate just JavaScript).

```
npx @inrupt/artifact-generator generate --vocabListFile ./custom-template-elixir.yml --noPrompt
```

**Note:**: We could also provide the `--force` option here if we wished to force
a re-generation, but generally that shouldn't be necessary, as the Artifact
Generator will detect file changes in the YAML (or any changes in any of the
source vocabularies we list under `vocabList` within the YAML), and therefore it
knows whether a re-generate is necessary or not.

### Generated output

After running the Artifact Generator, we will see a newly created `Generated`
directory, and inside there a `SourceCodeAtifacts` directory, and _inside there_
a directory for all the generated Elixir code, and another directory for all the
generated TypeScript code.

Inside the `Elixir` directory we should see the generated packaging code (as was
configured in our YAML file, which we'll see below), and a `GeneratedVocab`
directory. Inside this `GeneratedVocab` directory we will see Elixir-specific
source-code for each of the vocabularies we listed in the `vocabList` section
of our YAML file.

## How does this work?

The configuration we need to do can be seen in the first block under the 
`artifactToGenerate` section of our YAML file `./custom-template-elixir.yml`.

In particular, we can see the use of the `templateCustom` field here:

```
    templateCustom: ./template/stringLiteral/elixir/vocab.hbs
```

Similarly, we configure the Elixir-specific packaging files under the
`packaging` field of the YAML file.

**Note**: The directory structure we suggest for the template files themselves
is merely an example of how we choose to organize the internal templates
within the Artifact Generator itself. You are of course completely free to
organize your own template files however you please.
