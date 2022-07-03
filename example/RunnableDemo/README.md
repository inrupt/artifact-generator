# Artifact Generator Demo

The Artifact Generator is a tool to generate deployable source-code artifacts
_for various programming languages_, that provide convenient access to the terms
from Linked Data vocabularies (and optionally the _meta-data_ associated with
those terms).

Here we'll demonstrate generating and using a vocabulary artifact with
JavaScript, generated from a demo [Pet Rock](Vocab/PetRock.ttl) vocabulary.

## Quick Setup

- Run `npm ci` in this demo folder.
- Run `npx @inrupt/artifact-generator generate --vocabListFile ./Vocab/sample-vocab-bundle.yml --noPrompt --force`
- Run `node index.js`...
- ...you should see a set of self-explanatory questions and answers.

## Command Line Interface (CLI)

The easiest way to get started is with the Command-Line Interface (CLI), which
will generate JavaScript using defaults.

- We start with a local RDF vocabulary: [./PetRock.ttl](Vocab/PetRock.ttl).
- Generate JavaScript artifact from this vocabulary: 
  - Using the command-line options: 
    - `--noPrompt` no interactive prompting (we're happy with defaults).
    - `--supportBundling=false` no bundling (keep it simple during this demo, no
      need to run any `build` commands).
    - `--runNpmInstall` install our generated package locally.
    - `--force` to ensure re-generation with each example.

```
npx @inrupt/artifact-generator generate --inputResources ./PetRock.ttl --noPrompt --supportBundling=false --runNpmInstall --force
```

- See the generated code in `./Generated`.
- See our `./package.json` - which depends on the local generated folder as 
  `my-generated-vocab`.
- Run `node index.js`.

# YAML example

- If you want generation for other, or multiple, programming languages, or
  non-default templates/options, you'll need a YAML configuration file.
- Example YAML file [./Vocab/sample-vocab-bundle.yml](Vocab/sample-vocab-bundle.yml):
  - Generates both Java and JavaScript artifacts.
  - Bundles a remote vocab with our local Pet Rock vocab (in this case vCard).

```
npx @inrupt/artifact-generator generate --vocabListFile ./Vocab/sample-vocab-bundle.yml --noPrompt --force
```

- See the newly generated Java folder, and extra source-code files for new
  remote vocab.


# Watcher mode

- We can also run the Artifact Generator in a Watcher mode, using the `watch`
  command to trigger real-time regeneration of local vocab source-code files:

```
npx @inrupt/artifact-generator watch --vocabListFile ./Vocab/sample-vocab-bundle.yml --noPrompt --force
```

- Change something, e.g., add how very expensive Pet Rocks have become!
- Watcher detects vocabulary change...
- ...re-run `node index.js`, or see real-time updates in your IDE!

# Generate HTML documentation

If you have the open-source Java tool [Widoco](../../documentation/feature-overview.md#to-generate-human-readable-documentation-for-a-vocabulary-using-widoco) installed locally, we can use it
here by simply adding the `--runWidoco` command line option:

```
npx @inrupt/artifact-generator generate --inputResources ./PetRock.ttl --noPrompt --supportBundling=false --runWidoco --force
```

Browse to [./Generated/Widoco/index-en.html](./Generated/Widoco/index-en.html).
