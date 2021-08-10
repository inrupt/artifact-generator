# Changelog

This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.15.1 2021-08-10

- Move ES Module wrapper file into npm packaging, rather than adding as separate
  packing tool.
- Add logging to highlight missing values used in handlebars templates.
- Fixed typo in example Pet Rock vocab and README.
- Updated YAML filenames for generation tests.
- Removed '@types/rdf-js' and 'rdfjsTypesVersion' from templates (it's
  deprecated now).
- Local instance names prefixed with underscore in vocab templates to
  try and prevent potential name clashes with vocab terms.
- Bump version CLI option removed.  

## 0.15.0 2021-07-30

- Repo renamed to be simply 'artifact-generator'.
- Added local vocabulary (PetRock.ttl) to example vocab list. Useful for testing
  watcher detecting changes in YAML file (i.e., just run from the repo root and
  edit that vocab to see real-time re-generation:
    `node index.js watch --vocabListFile ./example/CopyOf-Vocab-List-Common.yml`
  ...or run this multiple times to see re-generation ignored after first time,
  but then edit YAML file and re-run to see re-generation again (due to the
  generator detecting the config file change):
    `node index.js generate --vocabListFile ./example/CopyOf-Vocab-List-Common.yml --noprompt`
- Add artifactName to required properties in YAML validation
- Add ES module support to generated JavaScript artifacts:
  - Adds sideEffects: false to package templates
  - Adds module entrypoint exposing ES module wrapper
  - Switch default bundler from webpack -> rollup, for consistency within the
    AG and with other Inrupt libraries
  - When supportBundling===true, use ES module import/exports internally for
    generated vocabs, to enable effective tree-shaking by consuming applications
- Sort list of generated vocabs alphabetically, in e.g. generated README
- Add missing parentheses to vocab templates
- No longer push to Git the locally generated Turtle files (we need to ensure
  we use proper graph isomorphism - current code only deals with BNodes, and
  not parser-dependent ordering changes in terms, or ordering of literal values
  by language)

## 0.14.0 2021-07-27

- Add option 'vocabContentTypeHeaderOverride' as a HTTP Content Type header
  override, as (some vocab servers (e.g., Resume-RDF 
  "http://rdfs.org/resume-rdf/cv.rdfs#")) return a content type of 'text/plain'
  even though the response is XML/RDF. This value allows us override the
  server header so that we can use the correct parser.
- Add options 'vocabContentTypeHeaderOverride', 'vocabContentTypeHeaderFallback'
- Update default javascript solidVocabVersion
- Updates and fixes to documentation
- Remove /demo folder, incorporate some examples into Advanced Configuration docs
- Added instructions to run Widoco.
- Tidied up some circular dependencies on command-line constants.
- Updates to new namespace for the Artifact Generator's own vocab, and picks up
  major YAML reorganization.
- Removed type 'any' from generated vocabs in TS

## 0.13.4

- Added namespace override to command line (needed to support generation
  of GIST from custom generation test).
- Tidied up test generation directory names to have all unit tests generated
  under a UNIT_TEST directory.
- Changed GitHub default branch to 'main'.
- Added support for 'ignoreNonVocabTerms' option (for vocabs that define terms
  not within their namespace (this should be rare, but can be done to add
  vocab-specific context (see https://www.w3.org/TR/dx-prof-conneg/altr.ttl
  for an example, defining 'rdf:Resource', 'dcterms:conformsTo', etc.))).
- Split the README for individual artifacts from the README for the overall
  generation operation (which now lists all individual artifact generated).
- If configured (using 'storeLocalCopyOfVocabDirectory' option) we can store all
  vocabs read as Turtle in local files. Convenient for seeing vocabs locally,
  some of which may be in less-readable serializations (like RDFa, or RDF/XML).
  Also provides a basis for still generating artifacts even if offline and
  remote vocabs are not available, as we can use cached copies instead
  (although of course these could be out-of-date in relation to the 'live'
  vocab!). 
- Add description of term translations for labels and comments (if any).
- Add option (`vocabAcceptHeaderOverride`) to override the HTTP Accept header
  sent when requesting vocabs as some vocabs (such as https://w3id.org/survey-ontology#)
  may not process the `q` parameter correctly, or at all!
- Add option (`vocabContentTypeHeaderFallback`) for vocabs (such as DOAP http://usefulinc.com/ns/doap#)
  that fail to respond with a HTTP Content-Type header (meaning we can't
  reliably know which RDF parser to use to parse the response).
- Don't share parser format instances across vocab processing, since we need to
  provide base IRI values to parser constructors.

## Bug fixes

- README of generated artifacts didn't have the full artifact name, just the
  name of the overall artifact (i.e., it was missing (if specified at all) the
  npm module name, the prefix and suffix).

## 0.13.3

- Use the vocabulary description from the YAML configuration file as a fallback
  description if the vocabulary itself doesn't provide a description that we
  can detect.
  
- Re-instate the generation of the RDF vocabulary (it was temporarily removed
  due to name clashes).

## 0.13.2

- Allow repository in package.json to be optional on whether an URL is provided
  in the YAML.

## 0.13.1

- Added string literal templates for Java and JavaScript.

## 0.10.27

### New features

- Support for a new CLI option: `--clearOutputDirectory`
