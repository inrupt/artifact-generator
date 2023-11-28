# Changelog

This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Deprecation notice

- In the next major version, support for Node 14 will be removed.

### New features

## 3.1.1 2023-10-02

- Release with correct tag aligned with package.json version number.

## 3.1.0 2023-10-02

- Support has been added for Node 18 and Node 20.
- Updated JS/TS templates to provide RDF type metadata for vocab terms if
  generating using Solid Common Vocab JS.

## 3.0.2 2023-04-13 (removed tag 3.0.1)

- Bug reported by Pete Edwards where 'vocabularyIriOverride' is not being reset
  once set.
- Updated example IRis and code.

## 3.0.0 2023-03-05

- Add vocab counts to generated comments.
- Add debug message when prefix is found from hard-coded internal vocab list.
- Replaced FOAF with RDFS for unit test for online vocabs (FOAF has gone down).
- Added intuitive Demo example - to highlight many of the benefits of the AG
  very quickly and easily.
- Improved handling of Widoco HTML generation (skipping use-cases needing
  multiple input resources, or a term selection resource).
- Added simple demo of using Custom Templates for a different programming
  language (using Elixir as the example).
- Added vocab namespace IRI to descriptions.
- Added keyword 'this' to reserved keyword handling for Java (defined in SHACL).
- Look for vocab description even if no explicit 'owl:Ontology' triple given, by
  using the determined namespace IRI (even if determined heuristically) as the
  Subject.
- Added 'dcterms:title' as predicate to look for as vocab description (DCTerms
  itself uses this predicate (but doesn't provide an 'a owl:Ontology' triple)).
- Added 'User-Agent' HTTP header (Object Management Group (OMG) vocab started
  failing with '403: Forbidden' without it!).
- Fix tests so that we still get 100% even if running online.
- Provide set of 'rdfs:isDefinedBy' values now (to properly document vocabs like
  QUDT that provide multiple version IRIs for the defining vocab).
- Tidied up template reporting of vocab namespace IRI.
- Major tidy up and simplification of code to determine a vocab's namespace IRI.
- Started to add completely new capability to report on Best Practices
  guidelines compliance (similar in intent to OOPS! and FOOPS!).
- Add support for SHACL PrefixDeclarations for namespace details (e.g., a
  vocab's namespace IRI and prefix), as used now by 'gist'.
- Encoded clear distinction between the Vocabulary/Ontology IRI and the
  namespace IRI.
- **BREAKING CHANGE** Renamed the configuration parameter of 'namespaceOverride'
  to be 'namespaceIriOverride', to better align with the new 
  'vocabularyIriOverride' parameter, and also to distinguish it more clearly
  from other namespace details (such as the namespace prefix).
- **BREAKING CHANGE** Renamed the configuration parameter of 'description' to be
  consistent with internal code use of 'descriptionFallback' (which better
  communicates its intent as a fallback in case the vocab itself does not
  explicitly provide its own description). 
- **BREAKING CHANGE** Changed Inrupt Artifact Generator vocab namespace IRI to
  use a trailing slash instead of a trailing hash.
- Ignore Verdaccio 'npm unpublish' errors on retry now (useful for local
  testing, where I was hitting intermittent E404 errors, even on retry).
- The FAIR vocab has term IRIs with dots/full-stops, so replace those dots with
  underscores for programming language constant names.
- NOTE: temporarily excluding the Best Practice reporting code from test
  coverage for the moment, as it's very much a work-in-progress (and should
  affect the overall generation process at all (apart from the report output at
  the top of generated source files, of course!).

## 2.0.0 2022-06-03

- Moved all the command-line processing code to also now be included in code
  coverage statistics.
- Report mistaken trailing colons for input resources in YAML.
- Major refactor to use synchronous processing, which allows us to cache
  fetched resources, resulting in a drastic reduction of fetches. This fixes
  the long-standing problem of blowing up when processing more than ~43 vocabs
  (since we had too many concurrent (and duplicated) connections). This also
  makes the code far more readable and debuggable.
- Renamed the command-line option of 'noprompt' to be 'noPrompt' to have
  a consistent naming convention across all options.
- Bumped major version number, due to command-line switch change being a
  breaking change.
- Added test for missing 'inputResources' field in vocab list entry.
- Switched default generation from command-line to be just StringLiteral to
  remove dependencies on any other libraries (default was using VocabTerm).
- Fix slash encoding for Java (detected by QUDT comments).
- Typo and tweaks to Skydiving example Turtle.
- Include DCELEMENTS.title (RDF and RDFS) and RDFS.label (QUDT) as allowable
  predicates for vocabulary descriptions. 
- Throws now if no vocab description found, or specified in config.
- Cleaned up use of vocab namespace IRI override - if one is specified, it's
  used, full stop (previous behaviour was a confused mixture of trying to
  support both the detected namespace IRI and the override).
- Convert the slash '/' character in vocab term names to underscore '_' in
  generated source-code constant names (example thrown up by the BIBO ontology
  that defines terms named 'degrees/phd' and 'degrees/ma').
- Added SKOS:definition to allowable vocab description predicates (Gist uses
  it).
- Prefix terms with leading digits (like '0To60Mph' from the Auto vocab) with
  underscores, so that they are legal programming language variable names. 

## 1.0.4 2021-10-01

- Added an optional `widocoLanguages` configuration option for each vocabulary
  to stipulate that Widoco (if it's configured to run at all) should attempt
  to generate documentation in multiple languages (which assumes the vocab
  contains labels in those specified languages, but falls back to English if
  not).

## 1.0.3 2021-09-28

- Updated configuration field names from `artifactPrefix` and `artifactSuffix`
  to `artifactNamePrefix` and `artifactNameSuffix` respectively, to better
  convey their intent, and to align them better with the `artifactName` field
  that they both apply to.
- Updating Jest to v27 necessitated new test-specific timeout syntax in
  `VocabGeneration.test.js`.

## 1.0.2 2021-09-27

- Updated to js-yaml v4 (breaking change of `safeLoad()` to just `load()`).
- Include 'rdfs:Resource' as a vocab term property (should be rarely, if ever,
  needed, but no harm in adding).
- Added SKOS-XL support (for glossaries, acronyms, etc.).
- Improved error reporting for missing template files.
- Added support for running Widoco for each vocabulary in a configuration file.
- Changed missing template variables from a warning to an exception (that
  forced a lot of test clean-up!).
- Effectively `artifactPrefix` and `artifactSuffix` are now mandatory, as they
  are referenced in all templates (this always makes it explicit how artifacts
  will be named now).

## 1.0.1 2021-08-20

- Note: there was a mistaken v1.1.0 release here in the Git history 
  (commit: adefc1bae0e3e5b006ed32853d130e3d5a2abf65), but we caught this and
  cleaned it up before any release to npm. 
- Term description metadata now always displayed for all terms (regardless of
  it being non-English or not), and more detailed descriptions provided too
  (and all with full test coverage).
- Fix artifact regeneration tests for cases where timestamp based comparison
  is unreliable.
- Added documentation around the different forms of generated artifacts.
- Split up the README/introduction documentation to better organize it.
- Added description of the generated directory structure to the docs.
- Removed unused Whitesource resources.
- Always try and use the English description for a vocab (instead of just the
  first one).
- Update version of rdf-datafactory.
- Pull in RDF/JS types from the new types package (not DefinitelyTyped
  anymore).
- Removed trailing comma marker from JavaScript/TypeScript templates (not
  needed anymore).
- README doc links fixed.

## 1.0.0 2021-08-11

- Change default npm registry to local Verdaccio.

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
    `node index.js watch --vocabListFile ./example/vocab/CopyOf-Vocab-List-Common.yml`
  ...or run this multiple times to see re-generation ignored after first time,
  but then edit YAML file and re-run to see re-generation again (due to the
  generator detecting the config file change):
    `node index.js generate --vocabListFile ./example/vocab/CopyOf-Vocab-List-Common.yml --noPrompt`
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
