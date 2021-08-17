const debug = require("debug")("artifact-generator:DatasetHandler");

const {
  RDF_NAMESPACE,
  RDF,
  RDFS,
  RDFS_NAMESPACE,
  SCHEMA_DOT_ORG,
  OWL,
  OWL_NAMESPACE,
  XSD,
  VANN,
  DCTERMS,
  SKOS,
  ARTIFACT_GENERATOR,
} = require("./CommonTerms");

const Resource = require("./Resource");
const FileGenerator = require("./generator/FileGenerator");
const { describeInput } = require("./Util");

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
const SUPPORTED_CLASSES = [
  RDFS.Class,
  OWL.Class,
  SKOS.Concept,
  SCHEMA_DOT_ORG.PaymentStatusType,
];

const SUPPORTED_PROPERTIES = [
  RDF.Property,
  RDF.List,
  RDFS.Datatype,
  OWL.ObjectProperty,
  OWL.NamedIndividual,
  OWL.AnnotationProperty,
  OWL.DatatypeProperty,
];

// The original intent of using this Class was for constants, but in fact in
// pure RDF it refers to an RDF Literal (i.e. an object with an optional
// language tag or datatype). This is extremely useful for defining application
// message strings, such as error messages, or informational text in multiple
// languages.
const SUPPORTED_LITERALS = [RDFS.Literal];

// Useful for defining constant strings. We specifically prevent having multiple
// values for these constants, since the whole point is that the value is a
// 'constant'.
const SUPPORTED_CONSTANT_STRINGS = [ARTIFACT_GENERATOR.ConstantString];

// Useful for defining constant IRIs that are not intended to be related to the
// vocabulary itself - for example, the Inrupt test vocabulary defines a number
// of constant IRIs to represent a test Pod, and test Containers within that Pod
// and test Resources within Containers within that Pod. None of those IRIs are
// related to the IRI of the test vocabulary itself. We specifically prevent
// having multiple values for these constants, since the whole point is that the
// value is a 'constant'.
const SUPPORTED_CONSTANT_IRIS = [ARTIFACT_GENERATOR.ConstantIri];

module.exports = class DatasetHandler {
  /**
   * Note: The term selection dataset we provide is used to selectively choose terms to generate
   * from a source vocabulary (for instance to cherry-pick specific terms from the huge
   * collection of terms in Schema.org). But the extension can can also add more meta-data for
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

    // The namespace can manually be overridden in the configuration file.
    if (
      !fullName.startsWith(namespace) &&
      !fullName.startsWith(this.vocabData.namespaceOverride)
    ) {
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
          `Ignoring vocabulary term [${fullName}] of RDF type [${rdfType.value}], as it's not in our namespace [${namespace}] (perhaps you need to provide to the 'namespaceOverride' option to detect terms from the correct namespace).`
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
          `Ignoring common RDF vocabulary term [${fullName}], as it's not in our namespace [${namespace}]${DatasetHandler.mentionNamespaceOverrideIfPresent(
            this.vocabData
          )}`
        );
        return null;
      }

      throw new Error(
        `Vocabulary term [${fullName}] found that is not in our namespace [${namespace}]${DatasetHandler.mentionNamespaceOverrideIfPresent(
          this.vocabData
        )} - currently this is disallowed (as it indicates a probable typo!)`
      );
    }

    // We need to have the term name, but also that name escaped to be a valid
    // variable name in our target programming languages. For example, DCTERMS
    // defines the term 'http://purl.org/dc/terms/ISO639-2', but 'ISO639-2' is
    // an invalid variable name. So we need to 'escape' it to be 'ISO639_2',
    // but also have access (in our templates) to the actual term for use in
    // the actual IRI. (We also have to 'replaceAll' for examples like VCARD's
    // term 'http://www.w3.org/2006/vcard/ns#post-office-box'!)

    let splitIri = fullName.split(namespace);
    // If the split failed (i.e. the term IRI is not in our namespace), then
    // try again with the overriding namespace (we already ensured that the
    // IRI was in one of them!).
    if (splitIri.length === 1) {
      splitIri = fullName.split(this.vocabData.namespaceOverride);
    }
    const name = splitIri[1];

    // A vocab may define the vocabulary itself using a predicate we use for
    // properties, for example the Survey ontology
    // (https://w3id.org/survey-ontology#) defines itself as an
    // `owl:NamedIndividual`.
    if (name.length === 0) {
      return null;
    }
    const nameEscapedForLanguage = name.replace(/-/g, "_");

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
      .replace(/^implements$/, "implements_"); // From the DOAP vocab.

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
      null
    );

    if (
      rdfType.equals(ARTIFACT_GENERATOR.ConstantIri) ||
      rdfType.equals(ARTIFACT_GENERATOR.ConstantString)
    ) {
      if (skosMatches.length > 1) {
        throw new Error(
          `Vocabulary term [${fullName}] in our namespace [${namespace}]${DatasetHandler.mentionNamespaceOverrideIfPresent(
            this.vocabData
          )} - found [${skosMatches.length}] values for constant of type [${
            rdfType.value
          }] when one, and only one, value is required`
        );
      }

      if (rdfType.equals(ARTIFACT_GENERATOR.ConstantIri)) {
        skosMatches.forEach((quad) => {
          if (!this.isValidIri(quad.object.value)) {
            throw new Error(
              `Vocabulary term [${fullName}] in our namespace [${namespace}]${DatasetHandler.mentionNamespaceOverrideIfPresent(
                this.vocabData
              )} - constant IRI value [${
                quad.object.value
              }] does not appear to be a valid IRI`
            );
          }
        });
      }
    }

    skosMatches.forEach((subQuad) => {
      DatasetHandler.add(definitions, subQuad);
    });

    const seeAlsoValues = new Set();
    this.termSelectionDataset
      .match(quad.subject, RDFS.seeAlso, null)
      .forEach((subQuad) => {
        seeAlsoValues.add(subQuad.object.value);
      });

    this.fullDataset
      .match(quad.subject, RDFS.seeAlso, null)
      .forEach((subQuad) => {
        seeAlsoValues.add(subQuad.object.value);
      });

    // Copy our set of strings into a set of objects.
    let seeAlsos;
    if (seeAlsoValues.size > 0) {
      seeAlsos = new Set();
      seeAlsoValues.forEach((value) => seeAlsos.add({ seeAlso: value }));
    }

    let isDefinedBy = undefined;
    this.fullDataset
      .match(quad.subject, RDFS.isDefinedBy, null)
      .forEach((subQuad) => {
        // Even if we have multiple values, just keep overwriting.
        isDefinedBy = subQuad.object.value;
      });

    const comment = DatasetHandler.getTermDescription(
      comments,
      definitions,
      labels
    );

    let translationDescription =
      DatasetHandler.buildCompositeTranslationDescription(labels, comments);

    return {
      name,
      nameEscapedForLanguage,
      nameEscapedForJava,
      comment,
      labels,
      comments,
      definitions,
      seeAlsos,
      isDefinedBy,
      translationDescription,
    };
  }

  static mentionNamespaceOverrideIfPresent(vocabData) {
    return vocabData.namespaceOverride === undefined
      ? ""
      : ` or in the namespace override [${vocabData.namespaceOverride}]`;
  }

  /**
   * This function builds a single string description of the translation values provided for the
   * specified term metadata.
   *
   * @param labels the collection of label literals
   * @param comments the collection of comment literals
   * @returns {any}
   */
  static buildCompositeTranslationDescription(labels, comments) {
    let translationDescription = undefined;

    // We're only interested in language string translations from English, so filter accordingly.
    const nonEnglishLabels = labels.filter(
      (elem) => elem.language && !elem.language.startsWith("en")
    );

    // We're only interested in language string translations from English, so filter accordingly.
    const nonEnglishComments = comments.filter(
      (elem) => elem.language && !elem.language.startsWith("en")
    );

    const translationsLabel =
      DatasetHandler.sortedListOfTranslations(nonEnglishLabels);
    const translationsComment =
      DatasetHandler.sortedListOfTranslations(nonEnglishComments);

    if (translationsLabel !== undefined || translationsComment !== undefined) {
      if (translationsLabel === translationsComment) {
        const singular = nonEnglishLabels.length === 1;
        translationDescription = `This term has [${
          nonEnglishLabels.length
        }] label${singular ? "" : "s"} and comment${
          singular ? "" : "s"
        }, in the language${singular ? "" : "s"} [${translationsLabel}].`;
      } else {
        const labelLanguages =
          translationsLabel === undefined
            ? ""
            : ` in ${
                nonEnglishLabels.length === 1 ? "the language" : "languages"
              } [${translationsLabel}]`;

        const labelDetails = `[${nonEnglishLabels.length}] label${
          nonEnglishLabels.length === 1 ? "" : "s"
        }${labelLanguages}`;

        const commentLanguages =
          translationsComment === undefined
            ? ""
            : ` in ${
                nonEnglishComments.length === 1 ? "the language" : "languages"
              } [${translationsComment}]`;

        const commentDetails = `[${nonEnglishComments.length}] comment${
          nonEnglishComments.length === 1 ? "" : "s"
        }${commentLanguages}`;

        translationDescription = `This term provides non-English descriptions, but a mismatch between labels and comments, with ${labelDetails}, but ${commentDetails}.`;
      }
    }

    return translationDescription;
  }

  static sortedListOfTranslations(literals) {
    // If we have no literals at, just return.
    if (literals.length === 0) {
      return undefined;
    }

    const sortedByLang = literals
      .sort((a, b) => a.language.localeCompare(b.language))
      .map((elem) => elem.language);

    return sortedByLang.toString().split(",").join(", ");
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
          quad.object.value
        ),
        valueEscapedForJava: FileGenerator.escapeStringForJava(
          quad.object.value
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

  buildTemplateInput() {
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
      this.vocabData
    )}.`;

    result.classes = [];
    result.properties = [];
    result.literals = [];
    result.constantIris = [];
    result.constantStrings = [];

    result.inputResources = this.vocabData.inputResources;
    result.vocabListFile = this.vocabData.vocabListFile;
    result.vocabListFileIgnore = this.vocabData.vocabListFileIgnore;
    // Useful when overriding the local namespace, because this is the namespace
    // that is actually used in the terms from the vocab, and that is used
    // when splitting the IRI to get the local part for instance.
    result.localNamespace = this.findNamespace();
    result.namespace =
      this.vocabData.namespaceOverride || result.localNamespace;
    result.gitRepository = this.vocabData.gitRepository;
    result.repository = this.vocabData.repository;

    // Note: for these values we must have already determined the vocab
    // namespace we are going to use, as that can determine the vocabulary name
    // we use, and that in turn can determine the name of the artifact we use.
    result.vocabName =
      this.vocabData.nameAndPrefixOverride ||
      this.findPreferredNamespacePrefix(result.namespace);
    result.artifactName = this.artifactName(result.vocabName);

    result.vocabNameUpperCase = DatasetHandler.vocabNameUpperCase(
      result.vocabName
    );
    result.description = this.findDescription(
      this.vocabData.descriptionFallback
    );
    result.artifactVersion = this.vocabData.artifactVersion;
    result.solidCommonVocabVersion = this.vocabData.solidCommonVocabVersion;
    result.npmRegistry = this.vocabData.npmRegistry;
    result.outputDirectory = this.vocabData.outputDirectory;
    result.authorSet = this.findAuthors();
    result.authorSetFormatted = Array.from(result.authorSet).join(", ");
    result.runNpmInstall = this.vocabData.runNpmInstall;
    result.runMavenInstall = this.vocabData.runMavenInstall;
    result.runNpmPublish = this.vocabData.runNpmPublish;
    result.runWidoco = this.vocabData.runWidoco;
    result.noprompt = this.vocabData.noprompt;
    result.supportBundling = this.vocabData.supportBundling;
    result.supportBundling = this.vocabData.supportBundling;

    if (this.vocabData.storeLocalCopyOfVocabDirectory) {
      result.storeLocalCopyOfVocabDirectory =
        this.vocabData.storeLocalCopyOfVocabDirectory;

      Resource.storeLocalCopyOfResource(
        result.storeLocalCopyOfVocabDirectory,
        result.vocabName,
        result.namespace,
        this.fullDataset
      );
    }

    let subjectSet = DatasetHandler.subjectsOnly(this.termSelectionDataset);
    if (subjectSet.length === 0) {
      subjectSet = DatasetHandler.subjectsOnly(this.fullDataset);
    }
    if (subjectSet.length === 1 && subjectSet[0] === result.namespace) {
      throw new Error(`[${result.namespace}] does not contain any terms.`);
    }

    subjectSet.forEach((subject) => {
      this.handleClass(subject, result);
      this.handleProperty(subject, result);
      this.handleLiteral(subject, result);
      this.handleConstantIri(subject, result);
      this.handleConstantString(subject, result);
    });

    return result;
  }

  handleClass(subject, result) {
    SUPPORTED_CLASSES.forEach((classType) => {
      this.fullDataset.match(subject, RDF.type, classType).forEach((quad) => {
        if (this.isNewTerm(quad.subject.value)) {
          const termDetails = this.handleTerm(
            quad,
            result.localNamespace,
            classType
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
          result.localNamespace,
          quad.object
        );

        if (termDetails !== null) {
          result.classes.push(termDetails);
        }
      }
    });
  }

  handleProperty(subject, result) {
    SUPPORTED_PROPERTIES.forEach((propertyType) => {
      this.fullDataset
        .match(subject, RDF.type, propertyType)
        .forEach((quad) => {
          const termDetails = this.handleTerm(
            quad,
            result.localNamespace,
            propertyType
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
          result.localNamespace,
          quad.object
        );

        if (termDetails) {
          if (this.isNewTerm(quad.subject.value)) {
            result.properties.push(termDetails);
          }
        }
      });
  }

  handleLiteral(subject, result) {
    SUPPORTED_LITERALS.forEach((literalType) => {
      this.fullDataset.match(subject, RDF.type, literalType).forEach((quad) => {
        if (this.isNewTerm(quad.subject.value)) {
          result.literals.push(
            this.handleTerm(quad, result.localNamespace, literalType)
          );
        }
      });
    });
  }

  handleConstantString(subject, result) {
    SUPPORTED_CONSTANT_STRINGS.forEach((literalType) => {
      this.fullDataset.match(subject, RDF.type, literalType).forEach((quad) => {
        if (this.isNewTerm(quad.subject.value)) {
          result.constantStrings.push(
            this.handleTerm(quad, result.localNamespace, literalType)
          );
        }
      });
    });
  }

  handleConstantIri(subject, result) {
    SUPPORTED_CONSTANT_IRIS.forEach((literalType) => {
      this.fullDataset.match(subject, RDF.type, literalType).forEach((quad) => {
        if (this.isNewTerm(quad.subject.value)) {
          result.constantIris.push(
            this.handleTerm(quad, result.localNamespace, literalType)
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

  /**
   * Important to note here that there is a very distinct difference between
   * the 'ontology' and the 'namespace' for any given vocabulary. Generally
   * they are one-and-the-same (e.g. RDF, RDFS), but this is not always the
   * case (e.g. OWL, HTTP 2011, or SKOS), and we can't assume it is. Every
   * vocabulary/namespace will define a 'namespace', which is effectively the
   * prefix for all the terms defined within that vocab, but the 'ontology'
   * document itself, that describes those terms, can have a completely
   * different IRI (although if it is different, it is typically only
   * different in that it removes the trailing hash '#' symbol).
   *
   * @returns {*}
   */
  findNamespace() {
    // First see if we have an explicitly defined ontology (i.e. an entity
    // with RDF.type of 'owl:Ontology' or 'LIT:Ontology') that explicitly
    // provides its namespace IRI.
    let ontologyIri;

    let namespace = this.findOwlOntology((owlOntologyTerms) => {
      const ontologyNamespaces = this.fullDataset.match(
        owlOntologyTerms.subject,
        VANN.preferredNamespaceUri,
        null
      );

      // Store the ontology name if we got one.
      ontologyIri = owlOntologyTerms.subject.value;
      return DatasetHandler.firstDatasetValue(ontologyNamespaces);
    });

    // If no explicitly provided namespace IRI, try and determine the
    // namespace from the term names themselves.
    if (!namespace) {
      // We arbitrarily pick the term with the longest name, simply to prevent
      // cases (like OWL, HTTP 2011, VANN, HTTPH) where the ontology itself
      // uses the namespace IRI, but without the trailing hash or slash.
      // We also provide the ontology IRI (if there was one), to only include
      // terms that start with that IRI (this was added specifically for the
      // strange HTTPH namespace document, that defines a term for the author
      // which is actually longer than the IRI of the only other term defined
      // (i.e. the HTTP Content-Type header).
      //
      // But note: as described above, the ontology IRI and the actual
      // namespace for terms can be completely different, but how else can we
      // accurately determine the namespace in cases like HTTPH above!?
      const longestTermName = DatasetHandler.findLongestTermName(
        DatasetHandler.subjectsOnly(this.fullDataset),
        ontologyIri
      );

      // The namespace is simply the IRI up to the last hash or slash.
      namespace = longestTermName.substring(
        0,
        Math.max(
          longestTermName.lastIndexOf("/"),
          longestTermName.lastIndexOf("#")
        ) + 1
      );

      debug(
        `Used a simple heuristic to determine the namespace of [${namespace}] for input resources [${this.vocabData.inputResources}], using the longest term name of [${longestTermName}].`
      );
    }

    return namespace;
  }

  static findLongestTermName(terms, ontologyIri) {
    return terms
      .filter((a) => (ontologyIri ? a.startsWith(ontologyIri) : true))
      .reduce((a, b) => (a.length > b.length ? a : b), "");
  }

  /**
   * Tries to return a prefix for selected namespaces.
   * @param {*} namespace the IRI of the namespace
   */
  static getKnownPrefix(namespace) {
    let prefix;
    KNOWN_DOMAINS.forEach((value, key) => {
      if (namespace.startsWith(key)) {
        prefix = value;
      }
    });
    return prefix;
  }

  findPreferredNamespacePrefix(namespace) {
    let prefix =
      this.vocabData.nameAndPrefixOverride ||
      this.findOwlOntology((owlOntologyTerms) => {
        const ontologyPrefixes = this.fullDataset.match(
          owlOntologyTerms.subject,
          VANN.preferredNamespacePrefix,
          null
        );

        return DatasetHandler.firstDatasetValue(ontologyPrefixes);
      });

    if (!prefix) {
      if (!namespace) {
        debug(
          `Namespace for input resource [${this.vocabData.inputResources[0]}] is empty.`
        );
        return "";
      }
      prefix = DatasetHandler.getKnownPrefix(namespace);
    }

    if (!prefix) {
      throw new Error(`No vocabulary prefix defined for [${namespace}]. Trying to guess a prefix is very error-prone, so we suggest three options to resolve this:
      - If you control the vocabulary, we strongly recommend that you add a triple explicitly providing a preferred prefix (e.g., [${namespace} http://purl.org/vocab/vann/preferredNamespacePrefix "prefix" .]).
      - If you do not control the vocabulary but you use a configuration file, then you can set the 'nameAndPrefixOverride' option for this vocabulary.
      - If you do not control the vocabulary, you can use the 'termSelectionResource' option to point to an extension file that includes the preferred prefix triple described above.`);
    }
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

  findDescription(descriptionFallback) {
    return this.findOwlOntology((owlOntologyTerms) => {
      let onologyComments = this.fullDataset.match(
        owlOntologyTerms.subject,
        DCTERMS.description,
        null
      );

      // Check fallback description predicate...
      if (onologyComments.size === 0) {
        onologyComments = this.fullDataset.match(
          owlOntologyTerms.subject,
          RDFS.comment,
          null
        );
      }

      // Find the first match, preferably in English.
      return DatasetHandler.firstDatasetValue(
        onologyComments,
        "en",
        descriptionFallback
      );
    }, descriptionFallback);
  }

  findAuthors() {
    return this.findOwlOntology((owlOntologyTerms) => {
      const onologyAuthors = this.fullDataset.match(
        owlOntologyTerms.subject,
        DCTERMS.creator,
        null
      );

      return new Set(
        onologyAuthors.size === 0
          ? []
          : onologyAuthors
              .toArray()
              .map((authorQuad) => authorQuad.object.value)
      );
    }, new Set());
  }

  findOwlOntology(callback, defaultResult) {
    const owlOntologyTerms = this.fullDataset
      .match(null, RDF.type, OWL.Ontology)
      .toArray()
      .shift();

    if (owlOntologyTerms) {
      return callback(owlOntologyTerms);
    }

    return defaultResult || ""; // Default to return empty string
  }

  static subjectsOnly(dataset) {
    const terms = dataset.filter((quad) => {
      return quad.subject.value !== OWL.Ontology;
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
      quads.forEach((elem) => {
        if (elem.object.language.startsWith(languageTag)) {
          result = elem.object.value;
        }
      });

      if (result) {
        return result;
      }

      // Fallback to searching our matches with no language tag at all.
      quads.forEach((elem) => {
        if (XSD.string.equals(elem.object.datatype)) {
          result = elem.object.value;
        }
      });

      if (result) {
        return result;
      }
    }

    // Even if we did specify a language tag, but got no matches, then just
    // fallback to the first match, or the ultimate fallback passed in.
    const first = quads.shift();
    return first ? first.object.value : defaultValue;
  }
};
