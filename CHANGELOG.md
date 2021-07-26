# Changelog

This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

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
