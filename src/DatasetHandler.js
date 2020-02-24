const debug = require("debug")("lit-artifact-generator:DatasetHandler");

const {
  RDF_NAMESPACE,
  RDF,
  RDFS,
  SCHEMA_DOT_ORG,
  OWL,
  VANN,
  DCTERMS,
  SKOS
} = require("./CommonTerms");

const FileGenerator = require("./generator/FileGenerator");

const KNOWN_DOMAINS = new Map([
  ["http://xmlns.com/foaf/0.1", "foaf"],
  ["http://www.w3.org/1999/02/22-rdf-syntax-ns", "rdf"],
  ["http://www.w3.org/2000/01/rdf-schema", "rdfs"],
  ["http://www.w3.org/2006/vcard/ns", "vcard"],
  ["https://schema.org", "schema"],
  ["http://schema.org", "schema"],
  ["http://www.w3.org/2002/07/owl", "owl"],
  ["http://rdf-extension.com#", "rdf-ext"]
]);

// TODO: Special case here for Schema.org. The proper way to address this I
// think is to allow use of inference, which would find automatically that
// 'PaymentStatusType' is actually an RDFS:Class - SCHEMA.PaymentStatusType.
const SUPPORTED_CLASSES = [
  RDFS.Class,
  OWL.Class,
  SKOS.Concept,
  SCHEMA_DOT_ORG.PaymentStatusType
];

const SUPPORTED_PROPERTIES = [
  RDF.Property,
  RDFS.Datatype,
  OWL.ObjectProperty,
  OWL.NamedIndividual,
  OWL.AnnotationProperty,
  OWL.DatatypeProperty
];

const SUPPORTED_LITERALS = [RDFS.Literal];

module.exports = class DatasetHandler {
  constructor(fullDataset, subjectsOnlyDataset, vocabData) {
    this.fullDataset = fullDataset;
    this.subjectsOnlyDataset = subjectsOnlyDataset;
    this.vocabData = vocabData;

    this.termsProcessed = new Map();
  }

  /**
   * Handles a specific term.
   *
   * NOTE: Term may need to be ignored, in which case we can return 'null'.
   *
   * @param quad
   * @param namespace
   * @returns {{comments: *, nameEscapedForLanguage: *, name: *, comment: *, definitions: *, labels: *}}
   */
  handleTerm(quad, namespace) {
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
      // ...but some vocabs reference terms from other very common
      // vocabs (like ActivityStreams 2.0 having the following two triples:
      //   rdf:langString a rdfs:Datatype .
      //   xsd:duration a rdfs:Datatype .
      // ...that are referring to terms from the RDF and XML Schema
      // vocabularies)! For terms from these very common vocabs, simply
      // ignore them...
      if (
        fullName.startsWith(RDF_NAMESPACE) ||
        fullName.startsWith("http://www.w3.org/2001/XMLSchema#")
      ) {
        return null;
      }

      throw new Error(
        `Vocabulary term [${fullName}] found that is not in our namespace [${namespace}] or in the namespace override [${this.vocabData.namespaceOverride}] - currently this is disallowed (as it indicates a probable typo!)`
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

    const nameEscapedForLanguage = name
      .replace(/-/g, "_")
      // TODO: Currently these alterations are required only for Java-specific
      //  keywords (i.e. VCard defines a term 'class', and DCTERMS defines the
      //  term 'abstract'). But these should only be applied for Java-generated
      //  code, but right now it's awkward to determine the current artifact
      //  we're generating for right here, so leaving that until the big
      //  refactor to clean things up. In the meantime, I've added the concept
      //  of 'list of keywords to append an underscore for in this programming
      //  language' to the current YAML files.
      .replace(/^class$/, "class_")
      .replace(/^abstract$/, "abstract_")
      .replace(/^default$/, "default_");

    this.subjectsOnlyDataset
      .match(quad.subject, SCHEMA_DOT_ORG.alternateName, null)
      .forEach(subQuad => {
        DatasetHandler.add(labels, subQuad);
      });

    this.subjectsOnlyDataset
      .match(quad.subject, RDFS.label, null)
      .forEach(subQuad => {
        DatasetHandler.add(labels, subQuad);
      });

    this.fullDataset.match(quad.subject, RDFS.label, null).forEach(subQuad => {
      DatasetHandler.add(labels, subQuad);
    });

    this.fullDataset
      .match(quad.subject, SCHEMA_DOT_ORG.alternateName, null)
      .forEach(subQuad => {
        DatasetHandler.add(labels, subQuad);
      });

    const comments = [];

    this.subjectsOnlyDataset
      .match(quad.subject, RDFS.comment, null)
      .forEach(subQuad => {
        DatasetHandler.add(comments, subQuad);
      });

    this.fullDataset
      .match(quad.subject, RDFS.comment, null)
      .forEach(subQuad => {
        DatasetHandler.add(comments, subQuad);
      });

    const definitions = [];

    this.subjectsOnlyDataset
      .match(quad.subject, SKOS.definition, null)
      .forEach(subQuad => {
        DatasetHandler.add(definitions, subQuad);
      });

    this.fullDataset
      .match(quad.subject, SKOS.definition, null)
      .forEach(subQuad => {
        DatasetHandler.add(definitions, subQuad);
      });

    const comment = DatasetHandler.getTermDescription(
      comments,
      definitions,
      labels
    );

    return {
      name,
      nameEscapedForLanguage,
      comment,
      labels,
      comments,
      definitions
    };
  }

  static add(array, quad) {
    if (DatasetHandler.doesNotContainValueForLanguageAlready(array, quad)) {
      array.push({
        value: quad.object.value,
        valueEscapedForJavascript: FileGenerator.escapeStringForJavascript(
          quad.object.value
        ),
        valueEscapedForJava: FileGenerator.escapeStringForJava(
          quad.object.value
        ),
        language: quad.object.language
      });
    }
  }

  static doesNotContainValueForLanguageAlready(array, quad) {
    return (
      array.length === 0 ||
      !array.some(e => e.language === quad.object.language)
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
    let result = collection.find(e => e.language === "en");

    if (result === undefined) {
      result = collection.find(e => e.language === "");
    }

    return result;
  }

  buildTemplateInput() {
    const result = {};

    result.webpackVersion = this.vocabData.webpackVersion;
    result.webpackCliVersion = this.vocabData.webpackCliVersion;
    result.babelCoreVersion = this.vocabData.babelCoreVersion;
    result.babelLoaderVersion = this.vocabData.babelLoaderVersion;

    result.generatedTimestamp = this.vocabData.generatedTimestamp;
    result.generatorName = this.vocabData.generatorName;
    result.artifactGeneratorVersion = this.vocabData.artifactGeneratorVersion;
    result.sourceRdfResources = this.vocabData.vocabListFile
      ? `Vocabulary built from vocab list file: [${this.vocabData.vocabListFile}].`
      : `Vocabulary built from input${
          this.vocabData.inputResources.length === 1 ? "" : "s"
        }: [${this.vocabData.inputResources.join(", ")}].`;

    result.classes = [];
    result.properties = [];
    result.literals = [];

    result.inputResources = this.vocabData.inputResources;
    result.vocabListFile = this.vocabData.vocabListFile;
    result.namespace = this.vocabData.namespaceOverride || this.findNamespace();
    // Useful when overriding the local namespace, because this is the namespace
    // that is actually used in the terms from the vocab, and that is used
    // when splitting the IRI to get the local part for instance.
    result.localNamespace = this.findNamespace();
    result.gitRepository = this.vocabData.gitRepository;
    result.repository = this.vocabData.repository;

    result.artifactName = this.artifactName();
    result.vocabName =
      this.vocabData.nameAndPrefixOverride ||
      this.findPreferredNamespacePrefix();
    result.vocabNameUpperCase = DatasetHandler.vocabNameUpperCase(
      result.vocabName
    );
    result.description = this.findDescription();
    result.artifactVersion = this.vocabData.artifactVersion;
    result.litVocabTermVersion = this.vocabData.litVocabTermVersion;
    result.npmRegistry = this.vocabData.npmRegistry;
    result.outputDirectory = this.vocabData.outputDirectory;
    result.authorSet = this.findAuthors();
    result.runNpmInstall = this.vocabData.runNpmInstall;
    result.runMavenInstall = this.vocabData.runMavenInstall;
    result.runNpmPublish = this.vocabData.runNpmPublish;
    result.bumpVersion = this.vocabData.bumpVersion;
    result.runWidoco = this.vocabData.runWidoco;
    result.noprompt = this.vocabData.noprompt;
    result.supportBundling = this.vocabData.supportBundling;

    let subjectSet = DatasetHandler.subjectsOnly(this.subjectsOnlyDataset);
    if (subjectSet.length === 0) {
      subjectSet = DatasetHandler.subjectsOnly(this.fullDataset);
    }
    if (subjectSet.length === 1 && subjectSet[0] === result.namespace) {
      throw new Error(`[${result.namespace}] does not contain any terms.`);
    }

    subjectSet.forEach(subject => {
      this.handleClasses(subject, result);
      this.handleProperties(subject, result);
      this.handleLiterals(subject, result);
    });

    return result;
  }

  handleClasses(subject, result) {
    SUPPORTED_CLASSES.forEach(classType => {
      this.fullDataset.match(subject, RDF.type, classType).forEach(quad => {
        if (this.isNewTerm(quad.subject.value)) {
          result.classes.push(this.handleTerm(quad, result.localNamespace));
        }
      });
    });
  }

  handleProperties(subject, result) {
    SUPPORTED_PROPERTIES.forEach(propertyType => {
      this.fullDataset.match(subject, RDF.type, propertyType).forEach(quad => {
        const term = this.handleTerm(quad, result.localNamespace);
        if (term) {
          if (this.isNewTerm(quad.subject.value)) {
            result.properties.push(term);
          }
        }
      });
    });
  }

  handleLiterals(subject, result) {
    SUPPORTED_LITERALS.forEach(literalType => {
      this.fullDataset.match(subject, RDF.type, literalType).forEach(quad => {
        if (this.isNewTerm(quad.subject.value)) {
          result.literals.push(this.handleTerm(quad, result.localNamespace));
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

    let namespace = this.findOwlOntology(owlOntologyTerms => {
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
      // uses the namespace IRI but without the trailing hash or slash.
      // We also provide the ontology IRI (if there was one), to only include
      // terms that start with that IRI (this was added specifically for the
      // strange HTTPH namespace document, that defines a term for the author
      // which is actually longer than the IRI of the only other term defined
      // (i.e. the HTTP Content-Type header).
      //
      // BUT NOTE: as described above, the ontology IRI and the actual
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
    }

    return namespace;
  }

  static findLongestTermName(terms, ontologyIri) {
    debug(`Searching for longest term: [${terms}]...`);

    return terms
      .filter(a => (ontologyIri ? a.startsWith(ontologyIri) : true))
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

  findPreferredNamespacePrefix() {
    const namespace = this.vocabData.namespaceOverride || this.findNamespace();
    let prefix =
      this.vocabData.nameAndPrefixOverride ||
      this.findOwlOntology(owlOntologyTerms => {
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
      throw new Error(`No prefix defined for[ ${namespace}]. There are three options to resolve this:
      - If you control the vocabulary, add a triple [${namespace} http://purl.org/vocab/vann/preferredNamespacePrefix "prefix"].
      - If you do not control the vocabulary, you can set create the 'termSelectionResource' option to point to an extension file including the same triple.
      - If you use a configuration file, you can set the 'nameAndPrefixOverride' option for the vocabulary.`);
    }
    return prefix;
  }

  artifactName() {
    return (
      this.vocabData.artifactName ||
      this.vocabData.moduleNamePrefix +
        this.findPreferredNamespacePrefix()
          .toLowerCase()
          .replace(/_/g, "-")
    );
  }

  static vocabNameUpperCase(name) {
    return name.toUpperCase().replace(/-/g, "_");
  }

  findDescription() {
    return this.findOwlOntology(owlOntologyTerms => {
      const onologyComments = this.fullDataset.match(
        owlOntologyTerms.subject,
        DCTERMS.description,
        null
      );

      return DatasetHandler.firstDatasetValue(onologyComments, "");
    });
  }

  findAuthors() {
    return this.findOwlOntology(owlOntologyTerms => {
      const onologyAuthors = this.fullDataset.match(
        owlOntologyTerms.subject,
        DCTERMS.creator,
        null
      );

      return new Set(
        onologyAuthors.size === 0
          ? []
          : onologyAuthors.toArray().map(authorQuad => authorQuad.object.value)
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
    const terms = dataset.filter(quad => {
      return quad.subject.value !== OWL.Ontology;
    });

    const termSubjects = [];
    terms.forEach(quad => {
      termSubjects.push(quad.subject.value);
    });

    return [...new Set(termSubjects)];
  }

  static firstDatasetValue(dataset, defaultValue) {
    const first = dataset.toArray().shift();
    return first ? first.object.value : defaultValue;
  }
};
