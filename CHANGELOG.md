# Changelog

This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

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
