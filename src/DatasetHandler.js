const debug = require("debug")("artifact-generator:DatasetHandler");

const rdf = require("rdf-ext");
const {
  RDF_NAMESPACE,
  RDF,
  RDFS,
  RDFS_NAMESPACE,
  SCHEMA_DOT_ORG,
  OWL,
  OWL_NAMESPACE,
  XSD,
  SHACL,
  SKOSXL,
  VANN,
  DCELEMENTS,
  DCTERMS,
  SKOS,
  ARTIFACT_GENERATOR,
} = require("./CommonTerms");

const Resource = require("./Resource");
const FileGenerator = require("./generator/FileGenerator");
const BestPracticeReportGenerator = require("./generator/BestPracticeReportGenerator");
const { describeInput, merge } = require("./Util");

const KNOWN_DOMAINS = new Map([
  ["http://xmlns.com/foaf/0.1", "foaf"],
  ["http://www.w3.org/1999/02/22-rdf-syntax-ns", "rdf"],
  ["http://www.w3.org/2000/01/rdf-schema", "rdfs"],
  ["http://www.w3.org/2006/vcard/ns", "vcard"],
  ["https://schema.org", "schema"],
  ["http://schema.org", "schema"],
  ["http://www.w3.org/2002/07/owl", "owl"],
  ["http://rdf-extension.com#", "rdf-ext"],
]);

// TODO: Special case here for Schema.org. The proper way to address this I
//  think is to allow use of inference, which would find automatically that
//  'PaymentStatusType' is actually an RDFS:Class - SCHEMA.PaymentStatusType.
const SUPPORTED_CLASS_TYPES = [
  RDFS.Class,
  OWL.Class,
  SKOS.Concept,
  SCHEMA_DOT_ORG.PaymentStatusType,
];

const SUPPORTED_PROPERTY_TYPES = [
  // We find the use of rdfs:Resource in the wild very rare, and would
  // question it's utility generally, since it's semantics are so extremely
  // generic.
  // But since we largely treat the various 'types' of vocabulary terms (i.e.,
  // Classes, Properties, Constants) the same anyway, in that we look for the
  // same metadata and generate much the same output, we treat instances of
  // 'rdfs:Resource' as if they were just 'rdf:Property'.
  RDFS.Resource,
  RDF.Property,
  RDF.List,
  RDFS.Datatype,
  OWL.ObjectProperty,
  OWL.NamedIndividual,
  OWL.AnnotationProperty,
  OWL.DatatypeProperty,

  // We could treat SKOS-XL Labels as String Constants too, since that more
  // accurately reflects what they are, but by treating them as Properties we
  // can generate full VocabTerm instances too, thereby giving full
  // programmatic access to all the associated metadata (whereas constants
  // would just give us the value).
  SKOSXL.Label,
];

// The original intent of using this Class was for constants, but in fact in
// pure RDF it refers to an RDF Literal (i.e. an object with an optional
// language tag or datatype). This is extremely useful for defining application
// message strings, such as error messages, or informational text in multiple
// languages.
const SUPPORTED_LITERAL_TYPES = [RDFS.Literal];

// Useful for defining constant strings. We specifically prevent having multiple
// values for these constants, since the whole point is that the value is a
// 'constant'.
const SUPPORTED_CONSTANT_STRING_TYPES = [ARTIFACT_GENERATOR.ConstantString];

// Useful for defining constant IRIs that are not intended to be related to the
// vocabulary itself - for example, the Inrupt test vocabulary defines a number
// of constant IRIs to represent a test Pod, and test Containers within that Pod
// and test Resources within Containers within that Pod. None of those IRIs are
// related to the IRI of the test vocabulary itself. We specifically prevent
// having multiple values for these constants, since the whole point is that the
// value is a 'constant'.
const SUPPORTED_CONSTANT_IRI_TYPES = [ARTIFACT_GENERATOR.ConstantIri];

module.exports = class DatasetHandler {
  /**
   * Note: The term selection dataset we provide is used to selectively choose terms to generate
   * from a source vocabulary (for instance to cherry-pick specific terms from the huge
   * collection of terms in Schema.org). But the extension can can also add more metadata for
   * those selected terms (for example, to add missing labels or comments, or translations for
   * existing labels and comments, see-also links, etc.)
   *
   * @param fullDataset union of all input resources, making up the full set of terms
   * @param termSelectionDataset dataset used to selectively list the terms we wish to generate
   * from
   * @param vocabData details of the vocabulary we wish to generate
   */
  constructor(fullDataset, termSelectionDataset, vocabData) {
    this.fullDataset = fullDataset;
    this.termSelectionDataset = termSelectionDataset;
    this.vocabData = vocabData;

    this.termsProcessed = new Map();
  }

  /**
   * Handles a specific term.
   *
   * Note: Term may need to be ignored, in which case we can return 'null'.
   *
   * @param quad
   * @param namespace
   * @returns {{comments: [], isDefinedBy, seeAlsos: Set<any>, nameEscapedForJava: string, nameEscapedForLanguage: *, name: string, comment: string, definitions: [], labels: []}|null}
   */
  handleTerm(quad, namespace, rdfType) {
    const labels = [];

    const fullName = quad.subject.value;
    // Ensure we only have terms from our vocabulary's namespace (because we
    // are only generating a single artifact representing this vocabulary, so
    // having terms from two (or more!) vocabularies means we won't know what
    // to name our artifact).

    // The namespace can manually be overridden in the configuration file, so
    // use the namespace override if we have one.
    const namespaceIriToUse = this.vocabData.namespaceIriOverride || namespace;

    if (!fullName.startsWith(namespaceIriToUse)) {
      // Some vocabs define terms that are not actually defined in the
      // vocabulary itself. For instance the vocabulary defined as part of the
      // W3C Content Negotiation by Profile work
      // (https://www.w3.org/TR/dx-prof-conneg/altr.ttl)
      // defines 'rdf:Resource', and a couple of Dublin Core terms, to provide
      // extra contextual information for the vocabulary itself.
      // Normally we'd throw an error on encountering such terms, as it can
      // indicate a simple typo - but this can be overridden using this option
      // if needed.
      if (this.vocabData.ignoreNonVocabTerms) {
        debug(
          `Ignoring vocabulary term [${fullName}] of RDF type [${rdfType.value}], as it's not in our namespace [${namespaceIriToUse}] (perhaps you need to provide to the 'namespaceIriOverride' option to detect terms from the correct namespace).`,
        );
        return null;
      }

      // ...but some vocabs reference terms from other very common
      // vocabs (like ActivityStreams 2.0 having the following two triples:
      //   rdf:langString a rdfs:Datatype .
      //   xsd:duration a rdfs:Datatype .
      // ...that are referring to terms from the RDF and XML Schema
      // vocabularies)! For terms from these very common vocabs, simply
      // ignore them...
      if (
        fullName.startsWith(RDF_NAMESPACE) ||
        fullName.startsWith(RDFS_NAMESPACE) ||
        fullName.startsWith(OWL_NAMESPACE) ||
        fullName.startsWith("http://www.w3.org/2001/XMLSchema#")
      ) {
        debug(
          `Ignoring common RDF vocabulary term [${fullName}], as it's not in the namespace we're using - ${DatasetHandler.describeNamespaceInUse(
            namespace,
            this.vocabData.namespaceIriOverride,
          )}`,
        );
        return null;
      }

      throw new Error(
        `Vocabulary term [${fullName}] found that is not in the namespace we're using - ${DatasetHandler.describeNamespaceInUse(
          namespace,
          this.vocabData.namespaceIriOverride,
        )} - currently this is disallowed (as it indicates a probable typo!), but you can override this error and ignore non-vocabulary terms by setting the 'ignoreNonVocabTerms' option to 'true'`,
      );
    }

    // It is possible for a vocabulary to type itself as a type we treat as a
    // term (e.g., as a property, or Classm or NamedIndividual, etc.), e.g.:
    //   <https://ex.com/myVocab#> a owl:NamedIndividual ...
    // ...in which we want to simply ignore these properties instances (as
    // they aren't properties defined by the vocab itself, but metadata about
    // the vocab instead).
    if (fullName === namespaceIriToUse) {
      return null;
    }
    const name = fullName.substring(namespaceIriToUse.length);

    // We need to have the term name, but also that name escaped to be a valid
    // variable name in our target programming languages. For example, DCTERMS
    // defines the term 'http://purl.org/dc/terms/ISO639-2', but 'ISO639-2' is
    // an invalid variable name. So we need to 'escape' it to be 'ISO639_2',
    // but also have access (in our templates) to the actual term for use in
    // the actual IRI. (We also have to 'replaceAll' for examples like VCARD's
    // term 'http://www.w3.org/2006/vcard/ns#post-office-box'!).
    //  We also need to handle leading characters that are digits (e.g., the
    //  Auto Core vocab here:
    //    https://spec.edmcouncil.org/auto/ontology/VC/VehicleCore/
    //  ...has terms like '0to100KMH' and '0to60MPH').
    // The FAIR vocabulary uses dots/full-stops '.' to name some of its
    // sub-principle term IRIs (such as
    // "https://w3id.org/fair/principles/terms/A1.1", so explicitly replace
    // those dots with '_' too.
    const firstCharacter = name.charAt(0);
    const nameEscapedForLanguage = (
      firstCharacter >= "0" && firstCharacter <= "9" ? `_${name}` : name
    ).replace(/[-\/.]/g, "_");
    // const nameEscapedForLanguage = name.replace(/[-\/]/g, "_");

    // TODO: Currently these alterations are required only for Java-specific
    //  keywords (i.e. VCard defines a term 'class', and DCTERMS defines the
    //  term 'abstract'). But these should only be applied for Java-generated
    //  code, but right now it's awkward to determine the current artifact
    //  we're generating for right here, so leaving that until the big
    //  refactor to clean things up. In the meantime, I've added the concept
    //  of 'list of keywords to append an underscore for in this programming
    //  language' to the current YAML files.
    const nameEscapedForJava = nameEscapedForLanguage
      .replace(/^boolean$/, "boolean_")
      .replace(/^float$/, "float_")
      .replace(/^double$/, "double_")
      .replace(/^byte$/, "byte_")
      .replace(/^int$/, "int_")
      .replace(/^long$/, "long_")
      .replace(/^short$/, "short_")
      .replace(/^class$/, "class_")
      .replace(/^abstract$/, "abstract_")
      .replace(/^for$/, "for_")
      .replace(/^default$/, "default_")
      .replace(/^protected$/, "protected_") // From the JSON-LD vocab.
      .replace(/^import$/, "import_") // From the JSON-LD vocab.
      .replace(/^implements$/, "implements_") // From the DOAP vocab.
      .replace(/^extends$/, "extends_") // From the ShEx vocab.
      .replace(/^this$/, "this_"); // From the SHACL vocab.

    this.termSelectionDataset
      .match(quad.subject, SCHEMA_DOT_ORG.alternateName, null)
      .forEach((subQuad) => {
        DatasetHandler.add(labels, subQuad);
      });

    this.termSelectionDataset
      .match(quad.subject, RDFS.label, null)
      .forEach((subQuad) => {
        DatasetHandler.add(labels, subQuad);
      });

    this.fullDataset
      .match(quad.subject, RDFS.label, null)
      .forEach((subQuad) => {
        DatasetHandler.add(labels, subQuad);
      });

    this.fullDataset
      .match(quad.subject, SKOSXL.literalForm, null)
      .forEach((subQuad) => {
        DatasetHandler.add(labels, subQuad);
      });

    this.fullDataset
      .match(quad.subject, SCHEMA_DOT_ORG.alternateName, null)
      .forEach((subQuad) => {
        DatasetHandler.add(labels, subQuad);
      });

    const comments = [];

    this.termSelectionDataset
      .match(quad.subject, RDFS.comment, null)
      .forEach((subQuad) => {
        DatasetHandler.add(comments, subQuad);
      });

    this.fullDataset
      .match(quad.subject, RDFS.comment, null)
      .forEach((subQuad) => {
        DatasetHandler.add(comments, subQuad);
      });

    const definitions = [];

    this.termSelectionDataset
      .match(quad.subject, SKOS.definition, null)
      .forEach((subQuad) => {
        DatasetHandler.add(definitions, subQuad);
      });

    const skosMatches = this.fullDataset.match(
      quad.subject,
      SKOS.definition,
      null,
    );

    if (
      rdfType.equals(ARTIFACT_GENERATOR.ConstantIri) ||
      rdfType.equals(ARTIFACT_GENERATOR.ConstantString)
    ) {
      if (skosMatches.length > 1) {
        throw new Error(
          `Vocabulary term [${fullName}] in ${DatasetHandler.describeNamespaceInUse(
            namespace,
            this.vocabData.namespaceIriOverride,
          )} - found [${skosMatches.length}] values for constant of type [${
            rdfType.value
          }] when one, and only one, value is required`,
        );
      }

      if (rdfType.equals(ARTIFACT_GENERATOR.ConstantIri)) {
        skosMatches.forEach((quad) => {
          if (!this.isValidIri(quad.object.value)) {
            throw new Error(
              `Vocabulary term [${fullName}] in ${DatasetHandler.describeNamespaceInUse(
                namespace,
                this.vocabData.namespaceIriOverride,
              )} - constant IRI value [${
                quad.object.value
              }] does not appear to be a valid IRI`,
            );
          }
        });
      }
    }

    skosMatches.forEach((subQuad) => {
      DatasetHandler.add(definitions, subQuad);
    });

    const seeAlsos = this.getSetOfPredicateObjects(
      quad.subject,
      RDFS.seeAlso,
      "seeAlso",
    );

    const isDefinedBys = this.getSetOfPredicateObjects(
      quad.subject,
      RDFS.isDefinedBy,
      "isDefinedBy",
    );

    const rdfTypes = this.getSetOfPredicateObjects(
      quad.subject,
      RDF.type,
      "rdfType",
    );

    const termDescription = DatasetHandler.getTermDescription(
      comments,
      definitions,
      labels,
    );

    return {
      name,
      nameEscapedForLanguage,
      nameEscapedForJava,
      comment: termDescription,
      labels,
      comments,
      definitions,
      seeAlsos,
      isDefinedBys,
      termDescription: DatasetHandler.buildCompositeTermDescription(
        labels,
        comments,
        definitions,
      ),
      rdfTypes,
    };
  }

  /**
   * Within both our full and term selection datasets, for the specified
   * subject and predicate, returns 'undefined' if no triples with that
   * predicate, or else a set of objects where each object has the specified
   * property name and corresponding triple value.
   *  Note: We need a Set of objects, because that's what Handlebar templates
   * need to work with, and we need to access these values in those templates.
   *
   * @param subject the term's subject IRI
   * @param predicate the predicate to search for
   * @param propertyNameInObject the property name to use for each object in our result Set
   * @returns {Set<any>} undefined if none, else a Set of objects
   */
  getSetOfPredicateObjects(subject, predicate, propertyNameInObject) {
    // We have to check across multiple datasets, so just create add results
    // to a simple Set first...
    const valueSet = new Set();
    this.termSelectionDataset
      .match(subject, predicate, null)
      .forEach((subQuad) => {
        valueSet.add(subQuad.object.value);
      });

    this.fullDataset.match(subject, predicate, null).forEach((subQuad) => {
      valueSet.add(subQuad.object.value);
    });

    // Copy our result strings into a set of objects.
    let result;
    if (valueSet.size > 0) {
      result = new Set();

      valueSet.forEach((value) =>
        result.add({ [`${propertyNameInObject}`]: value }),
      );
    }

    return result;
  }

  static describeNamespaceInUse(namespace, namespaceIriOverride) {
    const override = namespaceIriOverride
      ? `, but we're using namespace OVERRIDE [${namespaceIriOverride}])`
      : "";

    return `we detected namespace [${namespace}]${override}`;
  }

  /**
   * This function builds a single string description of the translation values provided for the
   * specified term metadata.
   *
   * @param comment the single 'comment' we determined for this term
   * @param labels the collection of label literals
   * @param comments the collection of comment literals
   * @returns {any}
   */
  static buildCompositeTermDescription(labels, comments, definitions) {
    let termDescription = undefined;

    // We treat definitions as comments, so merge those two into one array.
    const allComments = [...comments, ...definitions];

    // Create simple strings to represent the sorted list of language tags we
    // have for both our term's labels and comments (can be 'undefined' if
    // nothing there at all).
    const sortedLangTagsLabel = DatasetHandler.sortListOfLangTags(labels);
    const sortedLangTagsComment =
      DatasetHandler.sortListOfLangTags(allComments);

    // If we have no comment at all, report that explicitly.
    if (labels.length === 0 && comments.length === 0) {
      termDescription =
        "This term has no descriptions at all (i.e., the vocabulary doesn't provide any " +
        "'rdfs:label', 'rdfs:comment', or 'dcterms:description', or 'skos:definition' metadata).";
    } else {
      // Having no comments is bad - so report that omission (but at least
      // describe the labels we do have).
      if (allComments.length === 0) {
        const singular = labels.length === 1;
        const labelDescription = singular
          ? "a label"
          : `[${labels.length}] labels`;

        termDescription = `This term has ${labelDescription} (in language${
          singular ? "" : "s"
        } [${sortedLangTagsLabel}]), but no long-form descriptions at all (i.e., the vocabulary doesn't provide any 'rdfs:comment' or 'dcterms:description' metadata).`;
      } else {
        // Common to only have a single label and comment, which will
        // generally be both in explicit English, or just no language tag at
        // all - so provide specific messages for each case.
        if (labels.length === 1 && allComments.length === 1) {
          if (
            labels[0].language.startsWith("en") &&
            allComments[0].language.startsWith("en")
          ) {
            termDescription =
              "This term provides descriptions only in English.";
          } else {
            if (labels[0].language === "" && allComments[0].language === "") {
              termDescription =
                "This term provides descriptions only with no explicit locale.";
            } else {
              // Here we have 1 label and 1 comment, but their tags don't
              // match - so describe the multilingual situation.
              termDescription = DatasetHandler.describeMultipleLanguages(
                labels,
                sortedLangTagsLabel,
                allComments,
                sortedLangTagsComment,
              );
            }
          }
        } else {
          termDescription = DatasetHandler.describeMultipleLanguages(
            labels,
            sortedLangTagsLabel,
            allComments,
            sortedLangTagsComment,
          );
        }
      }
    }

    return termDescription;
  }

  static describeMultipleLanguages(
    labels,
    sortedLangTagsLabel,
    comments,
    sortedLangTagsComment,
  ) {
    let termDescription = undefined;

    if (sortedLangTagsLabel === sortedLangTagsComment) {
      const singular = labels.length === 1;
      termDescription = `This term has [${labels.length}] label${
        singular ? "" : "s"
      } and comment${singular ? "" : "s"}, in the language${
        singular ? "" : "s"
      } [${sortedLangTagsLabel}].`;
    } else {
      const labelLanguages =
        sortedLangTagsLabel === undefined
          ? ""
          : ` in ${
              labels.length === 1 ? "the language" : "languages"
            } [${sortedLangTagsLabel}]`;

      const labelDetails = `[${labels.length}] label${
        labels.length === 1 ? "" : "s"
      }${labelLanguages}`;

      // No need to check for comment languages or not here, as we would have
      // reporting on no comments beforehand ever being able to get here.
      const commentLanguages = ` in ${
        comments.length === 1 ? "the language" : "languages"
      } [${sortedLangTagsComment}]`;

      const commentDetails = `[${comments.length}] comment${
        comments.length === 1 ? "" : "s"
      }${commentLanguages}`;

      // Here we are checking if the mismatch is based purely on a difference
      // caused by having different @en vs NoLocale values (since we treat
      // NoLocale values as implicitly 'English').
      const removeEnglishLabel =
        DatasetHandler.filterOutEnglishAnNoLocale(labels);
      const removeEnglishComments =
        DatasetHandler.filterOutEnglishAnNoLocale(comments);

      // Here we check if there is a difference in non-English/NoLocale values
      // (if so, it's a definite mismatch), but we also have to check that if
      // one has English and/or NoLocale, then the other side must have at
      // least one of those two too.
      const mismatch =
        removeEnglishLabel !== removeEnglishComments ||
        DatasetHandler.countEnglishAnNoLocale(labels) === 0 ||
        DatasetHandler.countEnglishAnNoLocale(comments) === 0;

      const onlyEnglish =
        removeEnglishLabel === "" && removeEnglishComments === "";

      const descriptionIntro = onlyEnglish
        ? `The term has a description only in English`
        : `This term provides multilingual descriptions`;

      termDescription = `${descriptionIntro}, ${
        mismatch ? "but has a mismatch between its labels and comments, " : ""
      }with ${labelDetails}, but ${commentDetails}${
        mismatch
          ? ""
          : " (so the difference is only" +
            " between English and NoLocale, which we consider the same)"
      }.`;
    }

    return termDescription;
  }

  /**
   * Extracts the language tags from the array of specified language objects
   * and returns a sorted list of those languages as a single comma separated
   * string.
   *
   * @param literals Array of objects describing literals (NOT RDF Literal instances)
   * @returns {string|undefined} Comma separated string of sorted language tags
   */
  static sortListOfLangTags(literals) {
    // If we have no literals at, just return.
    if (literals.length === 0) {
      return undefined;
    }

    const sortedByLang = literals
      .sort((a, b) => a.language.localeCompare(b.language))
      .map((elem) => elem.language);

    return sortedByLang
      .toString()
      .split(",")
      .map((elem) => (elem === "" ? "NoLocale" : elem))
      .join(", ");
  }

  static filterOutEnglishAnNoLocale(literals) {
    return literals
      .filter(
        (elem) => !(elem.language === "" || elem.language.startsWith("en")),
      )
      .map((elem) => elem.language)
      .toString()
      .split(",")
      .join(", ");
  }

  static countEnglishAnNoLocale(literals) {
    return literals.filter(
      (elem) => elem.language === "" || elem.language.startsWith("en"),
    ).length;
  }

  isValidIri(str) {
    try {
      new URL(str);
    } catch (error) {
      return false;
    }
    return true;
  }

  static add(array, quad) {
    if (DatasetHandler.doesNotContainValueForLanguageAlready(array, quad)) {
      array.push({
        value: quad.object.value,
        valueEscapedForJavaScript: FileGenerator.escapeStringForJavaScript(
          quad.object.value,
        ),
        valueEscapedForJava: FileGenerator.escapeStringForJava(
          quad.object.value,
        ),
        language: quad.object.language,
      });
    }
  }

  static doesNotContainValueForLanguageAlready(array, quad) {
    return (
      array.length === 0 ||
      !array.some((e) => e.language === quad.object.language)
    );
  }

  /**
   * Finds a comment from the comments array. First check if there is an
   * English comment, next check for a default language comment (''), then
   * just get the first comment, or finally default to empty string.
   * @param comments An array of comments containing comments and their
   * language.
   * @returns {string} Returns a string of the comment if found, else an empty
   * string is returned.
   */
  static getTermDescription(comments, definitions, labels) {
    let result = DatasetHandler.lookupEnglishOrNoLanguage(comments);
    if (result === undefined) {
      result = DatasetHandler.lookupEnglishOrNoLanguage(definitions);

      if (result === undefined) {
        result = DatasetHandler.lookupEnglishOrNoLanguage(labels);
      }

      if (result === undefined) {
        result = comments[0] ? comments[0] : { value: "" };
      }
    }

    return result.value;
  }

  static lookupEnglishOrNoLanguage(collection) {
    let result = collection.find((e) => e.language === "en");

    if (result === undefined) {
      result = collection.find((e) => e.language === "");
    }

    return result;
  }

  async buildTemplateInput() {
    const result = {};

    result.rollupVersion = this.vocabData.rollupVersion;
    result.rollupBabelPluginVersion = this.vocabData.rollupBabelPluginVersion;
    result.rollupCommonjsPluginVersion =
      this.vocabData.rollupCommonjsPluginVersion;
    result.rollupNodeResolveVersion = this.vocabData.rollupNodeResolveVersion;

    result.webpackVersion = this.vocabData.webpackVersion;
    result.webpackCliVersion = this.vocabData.webpackCliVersion;
    result.babelCoreVersion = this.vocabData.babelCoreVersion;
    result.babelLoaderVersion = this.vocabData.babelLoaderVersion;

    result.generatedTimestamp = this.vocabData.generatedTimestamp;
    result.generatorName = this.vocabData.generatorName;
    result.artifactGeneratorVersion = this.vocabData.artifactGeneratorVersion;
    result.sourceRdfResources = `Vocabulary built from ${describeInput(
      this.vocabData,
    )}.`;

    result.classes = [];
    result.properties = [];
    result.literals = [];
    result.constantIris = [];
    result.constantStrings = [];

    result.inputResources = this.vocabData.inputResources;
    result.vocabListFile = this.vocabData.vocabListFile;
    result.vocabListFileIgnore = this.vocabData.vocabListFileIgnore;

    // It's important to note here that there is a very distinct difference
    // between the IRI used to identify the 'ontology' (or 'vocab') and the
    // IRI used to identify the 'namespace' within which terms are defined.
    //  Generally they are one-and-the-same (e.g. RDF, RDFS), but this is not
    // always the case (e.g. OWL, HTTP 2011, or SKOS), and we can't assume it
    // is. Every ontology/vocabulary should define a 'namespace', which is
    // effectively the IRI 'within which' all the terms defined within that
    // vocab are defined (and whose term-identifying IRIs all start with),
    // but this need *NOT NECESSARILY BE* the IRI that identifies the
    // 'ontology/vocab' itself.
    //  So a vocab can have a completely different IRI (although if it is
    // different, it is often only different in that it removes the trailing
    // slash '/' or hash '#' symbol (e.g. OWL or SKOS) - but in fact, the W3C
    // PROV vocabulary is a great example of a single namespace (i.e.,
    // http://www.w3.org/ns/prov#) that defines terms from multiple different
    // PROV-related vocabs (i.e., PROV, PROV-O, PROV-LINKS, PROV-DQ,
    // PROV-DICTIONARY, PROV_O_INVERSES, etc.).
    //  So first see if we have any explicitly defined ontologies (e.g.,
    // entities with RDF.type of 'owl:Ontology') that may then explicitly
    // provide namespace details (like the namespace IRI and/or prefix).
    const vocabularyIri = this.lookupVocabularyIri(
      this.vocabData.vocabularyIriOverride,
    );

    const namespaceDetails = this.lookupNamespaceDetails(
      vocabularyIri,
      this.vocabData.namespaceIriOverride,
      this.vocabData.nameAndPrefixOverride,
    );

    // Big assumption here, but we're saying that a vocab with no
    // 'a owl:Ontology' triple at all can assume a vocab IRI of the namespace
    // IRI (when perhaps we should be forcing the use of a
    // 'vocabularyIriOverride' instead - let's see)...
    result.vocabularyIri = vocabularyIri || namespaceDetails.namespaceIri;

    // Useful when overriding the local namespace, because this is the
    // namespace that is actually used in the terms from the vocab, and that
    // is used when splitting the IRI to get a term's local part, for
    // instance.
    result.localNamespaceIri = namespaceDetails.detectedNamespaceIri;

    result.vocabName = namespaceDetails.namespacePrefix;
    result.vocabNameUpperCase = DatasetHandler.vocabNameUpperCase(
      result.vocabName,
    );

    result.namespaceIriOverride = this.vocabData.namespaceIriOverride;
    result.namespaceIri =
      result.namespaceIriOverride || result.localNamespaceIri;
    result.gitRepository = this.vocabData.gitRepository;
    result.repository = this.vocabData.repository;

    result.artifactName = this.artifactName(result.vocabName);

    result.description = this.findDescription(
      result.vocabularyIri,
      this.vocabData.descriptionFallback,
    );
    if (
      !result.description ||
      result.description === "[Generator provided] - undefined"
    ) {
      throw new Error(
        `Cannot find a description of this vocabulary [${result.vocabName}] with IRI [${result.vocabularyIri}] and namespace IRI [${result.namespaceIri}] for artifact [${result.artifactName}], not in the vocab itself (e.g., via properties 'dcterms:title', 'dcterms:description', 'dcelements:title', 'rdfs:comment', or 'rdfs:label'), and our configuration doesn't provide one.`,
      );
    }
    result.description = `${result.description}`;

    result.artifactVersion = this.vocabData.artifactVersion;
    result.solidCommonVocabVersion = this.vocabData.solidCommonVocabVersion;
    result.npmRegistry = this.vocabData.npmRegistry;
    result.outputDirectory = this.vocabData.outputDirectory;
    result.authorSet = this.findAuthors(result.vocabularyIri);
    result.authorSetFormatted = Array.from(result.authorSet).join(", ");
    result.runNpmInstall = this.vocabData.runNpmInstall;
    result.runMavenInstall = this.vocabData.runMavenInstall;
    result.runNpmPublish = this.vocabData.runNpmPublish;
    result.runWidoco = this.vocabData.runWidoco;
    result.noPrompt = this.vocabData.noPrompt;
    result.supportBundling = this.vocabData.supportBundling;
    result.supportBundling = this.vocabData.supportBundling;

    if (this.vocabData.storeLocalCopyOfVocabDirectory) {
      result.storeLocalCopyOfVocabDirectory =
        this.vocabData.storeLocalCopyOfVocabDirectory;

      await Resource.storeLocalCopyOfResource(
        result.storeLocalCopyOfVocabDirectory,
        result.vocabName,
        result.namespaceIri,
        this.fullDataset,
      );
    }

    let subjectSet = DatasetHandler.subjectsOnly(this.termSelectionDataset);
    if (subjectSet.length === 0) {
      subjectSet = DatasetHandler.subjectsOnly(this.fullDataset);
    }

    // Check we have at least one vocab term (ignoring the vocab itself (i.e.,
    // '<vocab-iri> a owl:Ontology' triples)).
    if (subjectSet.length === 1 && subjectSet[0] === result.namespaceIri) {
      throw new Error(`[${result.namespaceIri}] does not contain any terms.`);
    }

    subjectSet.forEach((subject) => {
      this.handleClass(subject, result);
      this.handleProperty(subject, result);
      this.handleLiteral(subject, result);
      this.handleConstantIri(subject, result);
      this.handleConstantString(subject, result);
    });

    if (this.vocabData.reportBestPracticeCompliance) {
      result.complianceReport =
        BestPracticeReportGenerator.buildComplianceReport(result);
    }

    return result;
  }

  handleClass(subject, result) {
    SUPPORTED_CLASS_TYPES.forEach((classType) => {
      this.fullDataset.match(subject, RDF.type, classType).forEach((quad) => {
        if (this.isNewTerm(quad.subject.value)) {
          const termDetails = this.handleTerm(
            quad,
            result.localNamespaceIri,
            classType,
          );

          if (termDetails !== null) {
            result.classes.push(termDetails);
          }
        }
      });
    });

    // We can automatically treat anything marked as a 'sub-class of' as a
    // class too, regardless of what it's a sub-class of!
    this.fullDataset.match(subject, RDFS.subClassOf, null).forEach((quad) => {
      if (this.isNewTerm(quad.subject.value)) {
        const termDetails = this.handleTerm(
          quad,
          result.localNamespaceIri,
          quad.object,
        );

        if (termDetails !== null) {
          result.classes.push(termDetails);
        }
      }
    });
  }

  handleProperty(subject, result) {
    SUPPORTED_PROPERTY_TYPES.forEach((propertyType) => {
      this.fullDataset
        .match(subject, RDF.type, propertyType)
        .forEach((quad) => {
          const termDetails = this.handleTerm(
            quad,
            result.localNamespaceIri,
            propertyType,
          );

          if (termDetails) {
            if (this.isNewTerm(quad.subject.value)) {
              result.properties.push(termDetails);
            }
          }
        });
    });

    // We can automatically treat anything marked as a 'sub-property of' as a
    // property too, regardless of what it's sub-property of!
    this.fullDataset
      .match(subject, RDFS.subPropertyOf, null)
      .forEach((quad) => {
        const termDetails = this.handleTerm(
          quad,
          result.localNamespaceIri,
          quad.object,
        );

        if (termDetails) {
          if (this.isNewTerm(quad.subject.value)) {
            result.properties.push(termDetails);
          }
        }
      });
  }

  handleLiteral(subject, result) {
    SUPPORTED_LITERAL_TYPES.forEach((literalType) => {
      this.fullDataset.match(subject, RDF.type, literalType).forEach((quad) => {
        if (this.isNewTerm(quad.subject.value)) {
          result.literals.push(
            this.handleTerm(quad, result.localNamespaceIri, literalType),
          );
        }
      });
    });
  }

  handleConstantString(subject, result) {
    SUPPORTED_CONSTANT_STRING_TYPES.forEach((literalType) => {
      this.fullDataset.match(subject, RDF.type, literalType).forEach((quad) => {
        if (this.isNewTerm(quad.subject.value)) {
          result.constantStrings.push(
            this.handleTerm(quad, result.localNamespaceIri, literalType),
          );
        }
      });
    });
  }

  handleConstantIri(subject, result) {
    SUPPORTED_CONSTANT_IRI_TYPES.forEach((literalType) => {
      this.fullDataset.match(subject, RDF.type, literalType).forEach((quad) => {
        if (this.isNewTerm(quad.subject.value)) {
          result.constantIris.push(
            this.handleTerm(quad, result.localNamespaceIri, literalType),
          );
        }
      });
    });
  }

  isNewTerm(term) {
    const result = this.termsProcessed.has(term);
    if (!result) {
      this.termsProcessed.set(term, null);
    }

    return !result;
  }

  static findLongestTermName(terms) {
    return terms.reduce((a, b) => (a.length > b.length ? a : b), "");
  }

  /**
   * Tries to return a prefix for selected namespaces.
   * @param {*} namespaceIri the IRI of the namespace
   */
  static lookupKnownNamespacePrefix(namespaceIri) {
    let prefix;
    KNOWN_DOMAINS.forEach((value, key) => {
      if (namespaceIri.startsWith(key)) {
        prefix = value;
      }
    });

    return prefix;
  }

  artifactName(vocabName) {
    return (
      this.vocabData.artifactName ||
      this.vocabData.moduleNamePrefix +
        vocabName.toLowerCase().replace(/_/g, "-")
    );
  }

  static vocabNameUpperCase(name) {
    return name.toUpperCase().replace(/-/g, "_");
  }

  findDescription(vocabularyIri, descriptionFallback) {
    const vocabNamedNode = rdf.namedNode(vocabularyIri);

    let ontologyComments = this.fullDataset.match(
      vocabNamedNode,
      DCTERMS.description,
      null,
    );

    // Fallback to dcterms:title...
    if (ontologyComments.size === 0) {
      ontologyComments = this.fullDataset.match(
        vocabNamedNode,
        DCTERMS.title,
        null,
      );
    }

    // Fallback to rdfs:comment...
    if (ontologyComments.size === 0) {
      ontologyComments = this.fullDataset.match(
        vocabNamedNode,
        RDFS.comment,
        null,
      );
    }

    // Fallback to legacy description...
    if (ontologyComments.size === 0) {
      ontologyComments = this.fullDataset.match(
        vocabNamedNode,
        DCELEMENTS.title,
        null,
      );
    }

    // Fallback to SKOS definition (Gist uses this)...
    if (ontologyComments.size === 0) {
      ontologyComments = this.fullDataset.match(
        vocabNamedNode,
        SKOS.definition,
        null,
      );
    }

    // Fallback to rdfs:label (QUDT uses this)...
    if (ontologyComments.size === 0) {
      ontologyComments = this.fullDataset.match(
        vocabNamedNode,
        RDFS.label,
        null,
      );
    }

    if (ontologyComments.size === 0) {
      return descriptionFallback;
    }

    // Find the first match, preferably in English.
    return DatasetHandler.firstDatasetValue(
      ontologyComments,
      "en",
      descriptionFallback,
    );
  }

  findAuthors(vocabularyIri) {
    const vocabAuthors = this.fullDataset.match(
      rdf.namedNode(vocabularyIri),
      DCTERMS.creator,
      null,
    );

    return new Set(
      vocabAuthors.size === 0
        ? []
        : vocabAuthors.toArray().map((authorQuad) => authorQuad.object.value),
    );
  }

  /**
   * Attempts to lookup the vocabulary IRI. Starts by looking for an explicit
   * triple of type 'owl:Ontology', but if none found (e.g., the DCTerms
   * vocab), then it can query for the provided namespace (if any, as it can
   * be NULL too).
   *
   * @param vocabularyIriOverride if not NULL will be used as a fallback Subject if no 'owl:Ontology' triple found
   * @returns {string|*}
   */
  lookupVocabularyIri(vocabularyIriOverride) {
    const allOwlOntologies = this.fullDataset
      .match(null, RDF.type, OWL.Ontology)
      .toArray();

    if (allOwlOntologies.length === 0) {
      if (vocabularyIriOverride) {
        debug(
          `Found no 'rdf:type owl:Ontology' triples, but we were given a 'vocabularyIriOverride' of [${vocabularyIriOverride}], so we'll use that.`,
        );
        return vocabularyIriOverride;
      }

      debug(
        `Found no 'rdf:type owl:Ontology' triples, and no 'vocabularyIriOverride' configuration provided.`,
      );
      return undefined;
    }

    if (allOwlOntologies.length > 1) {
      if (vocabularyIriOverride) {
        debug(
          `Found [${
            allOwlOntologies.length
          }] 'rdf:type owl:Ontology' instances (we can only process 1): [${allOwlOntologies
            .map((quad) => quad.subject.value)
            .join(
              ", ",
            )}], but we were given a 'vocabularyIriOverride' of [${vocabularyIriOverride}], so we'll use that.`,
        );

        return vocabularyIriOverride;
      }

      throw new Error(
        `Found [${
          allOwlOntologies.length
        }] 'rdf:type owl:Ontology' instances (we can only process 1): [${allOwlOntologies
          .map((quad) => quad.subject.value)
          .join(
            ", ",
          )}], and we weren't configured with a 'vocabularyIriOverride' so we can't know which one to use.`,
      );
    }

    const owlOntologyQuad = allOwlOntologies.shift();
    if (
      vocabularyIriOverride &&
      vocabularyIriOverride === owlOntologyQuad.subject.value
    ) {
      debug(
        `Found just the one 'rdf:type owl:Ontology' instance, which our matched 'vocabularyIriOverride' of [${vocabularyIriOverride}], so seems override was superfluous.`,
      );
    }

    return owlOntologyQuad.subject.value;
  }

  /**
   * Attempts to lookup our vocab's namespace details. Even if we are given
   * overrides, we still perform lookups for reporting purposes (e.g., to
   * report on the vocab's Best Practice guideline compliance).
   *
   * @param vocabularyIri the IRI of our vocabulary itself
   * @param namespaceIriOverride configured override (optional)
   * @returns {*}
   */
  lookupNamespaceDetails(
    vocabularyIri,
    namespaceIriOverride,
    namespacePrefixOverride,
  ) {
    const result = {};

    result.vannNamespaceIri = this.lookupOneAndOnlyOnePredicate(
      vocabularyIri,
      namespaceIriOverride,
      VANN.preferredNamespaceUri,
    );
    result.vannNamespacePrefix = this.lookupOneAndOnlyOnePredicate(
      vocabularyIri,
      namespacePrefixOverride,
      VANN.preferredNamespacePrefix,
    );

    // Check if our vocab has a SHACL 'declare' triple - if so, only then
    // should we even bother to lookup that declaration for namespace details.
    result.shaclDeclareIri = this.lookupOneAndOnlyOnePredicate(
      vocabularyIri,
      undefined,
      SHACL.declare,
    );
    if (result.shaclDeclareIri) {
      result.shaclNamespaceIri = this.lookupOneAndOnlyOnePredicate(
        result.shaclDeclareIri,
        namespaceIriOverride,
        SHACL.namespace,
      );

      result.shaclNamespacePrefix = this.lookupOneAndOnlyOnePredicate(
        result.shaclDeclareIri,
        namespacePrefixOverride,
        SHACL.prefix,
      );
    }

    result.heuristicNamespaceIri = this.heuristicForNamespaceIri();

    // Use our arbitrary precedence to determine the detected namespace IRI.
    result.detectedNamespaceIri =
      result.vannNamespaceIri ||
      result.shaclNamespaceIri ||
      result.heuristicNamespaceIri;

    // If we were given an override, then use it, regardless of any explicit
    // namespace details from the vocab itself.
    result.namespaceIri = namespaceIriOverride || result.detectedNamespaceIri;

    result.namespacePrefix =
      namespacePrefixOverride ||
      result.vannNamespacePrefix ||
      result.shaclNamespacePrefix;

    if (!result.namespaceIri) {
      throw new Error(
        `Namespace IRI could not be determined for vocabulary with IRI [${
          vocabularyIri ||
          "--Could not be determined, as not explicitly provided and not overridden by configuration--"
        }] and no 'namespaceIriOverride' was configured, so we can't continue (it's possible we failed to parse any triples at all from the 'inputResources' provided, possibly due to content negotiation problems on the vocab-serving server).`,
      );
    }

    if (!result.namespacePrefix) {
      const knownPrefix = DatasetHandler.lookupKnownNamespacePrefix(
        result.namespaceIri,
      );

      if (knownPrefix) {
        result.namespacePrefix = knownPrefix;
        debug(
          `Determined vocabulary prefix [${knownPrefix}] from hard-coded list of well known vocabularies.`,
        );
      } else {
        throw new Error(`No prefix defined for vocabulary IRI [${
          vocabularyIri ||
          "--Could not be determined, as not explicitly provided, not overridden by configuration, and namespace IRI couldn't be 'guessed' either--"
        }]. Trying to guess a prefix is very error-prone, so we suggest three options to resolve this:
      - If you control the vocabulary, we strongly recommend that you either:
        - Add a triple explicitly providing a preferred prefix (e.g., [${vocabularyIri} http://purl.org/vocab/vann/preferredNamespacePrefix "prefix" .]) to your vocabulary.
        - Add a SHACL:PrefixDeclaration (see [SHACL Prefix Declaration](https://www.w3.org/TR/shacl/#sparql-prefixes)) to your vocabulary. 
      - If you do not control the vocabulary but you use a configuration file, then you can set the 'nameAndPrefixOverride' option for this vocabulary.
      - If you do not control the vocabulary, you can use the 'termSelectionResource' option to point to an extension file that includes a preferred prefix as described above.`);
      }
    }

    return result;
  }

  lookupOneAndOnlyOnePredicate(
    vocabularyIri,
    predicateValueOverride,
    predicate,
  ) {
    const allPredicateQuads = this.fullDataset
      .match(rdf.namedNode(vocabularyIri), predicate, null)
      .toArray();

    if (allPredicateQuads.length === 0) {
      debug(
        `Found no [${predicate.value}] triples for our vocabulary IRI [${vocabularyIri}]`,
      );
      return undefined;
    }

    if (allPredicateQuads.length > 1) {
      if (predicateValueOverride) {
        debug(
          `Found [${allPredicateQuads.length}] [${
            predicate.value
          }] triples for our vocabulary IRI [${vocabularyIri}] (we can only process 1): [${allPredicateQuads
            .map((quad) => quad.object.value)
            .join(", ")}].`,
        );

        return undefined;
      }

      throw new Error(
        `Found [${allPredicateQuads.length}] [${
          predicate.value
        }] triples for our vocabulary IRI [${vocabularyIri}] (we can only process 1): [${allPredicateQuads
          .map((quad) => quad.object.value)
          .join(
            ", ",
          )}], and we weren't configured with an Override, so we can't know which one to use.`,
      );
    }

    const predicateQuad = allPredicateQuads.shift();
    if (
      predicateValueOverride &&
      predicateValueOverride === predicateQuad.object.value
    ) {
      debug(
        `Found just the one [${predicate.value}] triple for our vocabulary IRI [${vocabularyIri}], which matched our Override of [${predicateValueOverride}], so it seems the override was superfluous.`,
      );
    }

    return predicateQuad.object.value;
  }

  /**
   * We arbitrarily pick the term with the longest name, simply to prevent
   * cases (like OWL, HTTP 2011, VANN, HTTPH) where the vocabulary itself
   * uses the namespace IRI, but without the trailing hash or slash.
   *
   * @param namespaceIriOverride
   * @returns {string}
   */
  heuristicForNamespaceIri() {
    const longestTermName = DatasetHandler.findLongestTermName(
      DatasetHandler.subjectsOnly(this.fullDataset),
    );

    // The namespace is simply the IRI up to the last hash or slash.
    const namespaceIri = longestTermName.substring(
      0,
      Math.max(
        longestTermName.lastIndexOf("/"),
        longestTermName.lastIndexOf("#"),
      ) + 1,
    );

    debug(
      `Used a simple heuristic to determine the namespace IRI of [${namespaceIri}] for input resources [${this.vocabData.inputResources}], using the longest term name of [${longestTermName}].`,
    );

    return namespaceIri;
  }

  static subjectsOnly(dataset) {
    const terms = dataset.filter((quad) => {
      return quad.subject.value !== OWL.Ontology.value;
    });

    const termSubjects = [];
    terms.forEach((quad) => {
      termSubjects.push(quad.subject.value);
    });

    return [...new Set(termSubjects)];
  }

  static firstDatasetValue(dataset, languageTag, defaultValue) {
    const quads = dataset.toArray();
    let result;

    if (languageTag !== undefined) {
      // Search our matches for language tags that start with the explicitly
      // specified language tag.
      result = quads.find((elem) =>
        elem.object.language.startsWith(languageTag),
      );
      if (result) {
        return result.object.value;
      }

      // Fallback to searching our matches with no language tag at all.
      result = quads.find((elem) => XSD.string.equals(elem.object.datatype));
      if (result) {
        return result.object.value;
      }
    }

    // Even if we did specify a language tag, but got no matches, then just
    // fallback to the first match, or the ultimate fallback passed in.
    const first = quads.shift();
    return first ? first.object.value : defaultValue;
  }
};
