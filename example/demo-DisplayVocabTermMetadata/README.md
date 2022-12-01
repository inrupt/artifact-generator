# Artifact Generator Demo

The Artifact Generator is a tool to generate deployable source-code artifacts
_for various programming languages_, that provide convenient access to the terms
from Linked Data vocabularies (and optionally the _meta-data_ associated with
those terms).

Here we'll demonstrate generating and using a vocabulary artifact with
JavaScript, generated from a demo [Pet Rock](../vocab/PetRock.ttl) vocabulary.

## Quick Setup

- Run `npm ci` in this demo folder.
- Run:
  ```
  npx @inrupt/artifact-generator generate --vocabListFile ./Vocab/sample-vocab-bundle.yml --noPrompt --force
  ```
- Run `node index.js` and ...
- ...you should see a set of self-explanatory questions and answers output to
  the console.

## Command Line Interface (CLI)

The easiest way to get started is with the Command-Line Interface (CLI), which
will generate JavaScript using defaults.

- We start with a local RDF vocabulary: [PetRock.ttl](../vocab/PetRock.ttl).
- Generate JavaScript artifact from this vocabulary: 
  - Using the command-line options: 
    - `--noPrompt` no interactive prompting (we're happy with defaults).
    - `--clearOutputDirectory`, or '-c' to clear out the target output directory
      (in case we ran the Quick Setup steps above). Generally we very rarely
      need to use this option, but here it's just to ensure we start these
      instructions with a clear output directory!).
    - `--force`, or '-f' to ensure re-generation with each example.
    - '--reportBestPracticeCompliance', or  '--bp': for each vocabulary, add a
      report on its compliance to the Inrupt vocabulary Best Practice guidelines
      (added to the file's comment header)
    
```
npx @inrupt/artifact-generator generate --inputResources ./vocab/PetRock.ttl --noPrompt --force --clearOutputDirectory
```

- See the generated code in `./Generated`.
- See our `./package.json` - which depends on the local generated folder as 
  `my-generated-vocab`.
- Run `node src/index.js`.

## Options for running the Artifact Generator

If we want more options for running the Artifact Generator (beyond using `npx`),
see the [Quick Start](../../README.md#quick-start) section of the main README.

# YAML example

- If you want generation for other, or multiple, programming languages, or
  non-default templates/options, you'll need a YAML configuration file.
- Example YAML file [./Vocab/sample-vocab-bundle.yml](Vocab/sample-vocab-bundle.yml):
  - Generates both Java and JavaScript artifacts.
  - Bundles a real remote vocab with our local Pet Rock vocab (in this case the
    W3C standard Time vocabulary that defines (as of mid-2022) 20 Classes and 61
    Properties related to 'time').
  - We also show an example of using an Inrupt-defined extension resource to
    cherry-pick popular terms from the Schema.org vocabulary (which contains (as
    of mid-2022) about 2,500 terms), and that also extends those chosen 
    Schema.org terms with translations of their labels and comments into
    multiple other languages (e.g., French, Spanish, German, etc.).

```
npx @inrupt/artifact-generator generate --vocabListFile ./Vocab/sample-vocab-bundle.yml --noPrompt --force
```

- See the newly generated Java folder, and extra source-code files for the new
  remote vocab (W3C's Time), and our cherry-picked Schema.org terms, as choosen
  by Inrupt.


# Watcher mode

- We can also run the Artifact Generator in a Watcher mode, using the `watch`
  command to trigger real-time regeneration of local vocab source-code files:

```
npx @inrupt/artifact-generator watch --vocabListFile ./Vocab/sample-vocab-bundle.yml --noPrompt --force
```

- Change something, e.g., add how very expensive Pet Rocks have become!
- The Watcher will automatically detect the vocabulary file change...
- ...re-run `node src/index.js`, or see real-time updates in your IDE!

# Generate HTML documentation

If you have the open-source Java tool
[Widoco](../../documentation/feature-overview.md#to-generate-human-readable-documentation-for-a-vocabulary-using-widoco)
installed locally, we can use it here by simply adding the `--runWidoco` command
line option to ask the Artifact Generator to automatically generate HTML
documentation for each of the vocabularies we specified:

```
npx @inrupt/artifact-generator generate --inputResources ./vocab/PetRock.ttl --noPrompt --runWidoco --force
```

Browse to 
[./Generated/Widoco/PetRock/index-en.html](./Generated/Widoco/PetRock/index-en.html)
to see the generated documentation for the Pet Rock vocbaulary (in both English
and Spanish), and
[./Generated/Widoco/time/index-en.html](./Generated/Widoco/time/index-en.html)
to see the generated documentation for the W3C's Time vocabulary (which also
just happens to provide term metadata in English and Spanish).

---

**Note**: The Artifact Generator doesn't yet support generation using Widoco for
vocabularies built from multiple input resources, or when using term selection
resources (as in both cases we first need to write the 'augmented' vocabulary to
a local Linked Data resource (such as a local Turtle file), so that Widoco can
pick that temporary file up), so we don't yet expect to see any Widoco output
for our Inrupt-chosen Schema.org terms. 

---
