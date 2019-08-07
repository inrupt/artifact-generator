const { RDF, RDFS, SCHEMA, OWL, VANN, DCTERMS, SKOS } = require('@lit/generated-vocab-common');
const { LitUtils } = require('@lit/vocab-term');

const DEFAULT_AUTHOR = '@lit/artifact-generator-js';

// TODO: Special case here for Schema.org. The proper way to address this I
// think is to allow use of inference, which would find automatically that
// 'PaymentStatusType' is actually an RDFS:Class - SCHEMA.PaymentStatusType.
const SUPPORTED_CLASSES = [RDFS.Class, OWL.Class, SKOS.Concept, SCHEMA.PaymentStatusType];

const SUPPORTED_PROPERTIES = [
  RDF.Property,
  RDFS.Datatype,
  OWL.ObjectProperty,
  OWL.NamedIndividual,
  OWL.AnnotationProperty,
  OWL.AnnotationProperty,
  OWL.DatatypeProperty,
];

const SUPPORTED_LITERALS = [RDFS.Literal];

module.exports = class DatasetHandler {
  constructor(fullDataset, subjectsOnlyDataset, vocabData) {
    this.fullDataset = fullDataset;
    this.subjectsOnlyDataset = subjectsOnlyDataset;
    this.vocabData = vocabData;
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
    // to name our artifact?
    if (!fullName.startsWith(namespace)) {
      // ...but some vocabs reference terms from other vocabs (like ActivityStreams 2.0)!
      if (
        fullName.startsWith(RDF.NAMESPACE) ||
        fullName.startsWith('http://www.w3.org/2001/XMLSchema#')
      ) {
        return null;
      }

      throw new Error(
        `Vocabulary term [${fullName}] found that is not in our namespace [${namespace}] - currently this is disallowed (as it indicates a probable typo!)`
      );
    }

    // We need to have the term name, but also that name escaped to be a valid
    // variable name in our target programming languages. For example, DCTERMS
    // defines the term 'http://purl.org/dc/terms/ISO639-2', but 'ISO639-2' is
    // an invalid variable name. So we need to 'escape' it to be 'ISO639_2',
    // but also have access (in our templates) to the actual term for use in
    // the actual IRI. (We also have to 'replaceAll' for examples like VCARD's
    // term 'http://www.w3.org/2006/vcard/ns#post-office-box'!)
    const name = fullName.split(namespace)[1];
    const nameEscapedForLanguage = name.replace(/-/g, '_');

    this.subjectsOnlyDataset.match(quad.subject, SCHEMA.alternateName, null).forEach(subQuad => {
      DatasetHandler.add(labels, subQuad);
    });

    this.subjectsOnlyDataset.match(quad.subject, RDFS.label, null).forEach(subQuad => {
      DatasetHandler.add(labels, subQuad);
    });

    this.fullDataset.match(quad.subject, RDFS.label, null).forEach(subQuad => {
      DatasetHandler.add(labels, subQuad);
    });

    this.fullDataset.match(quad.subject, SCHEMA.alternateName, null).forEach(subQuad => {
      DatasetHandler.add(labels, subQuad);
    });

    const comments = [];

    this.subjectsOnlyDataset.match(quad.subject, RDFS.comment, null).forEach(subQuad => {
      DatasetHandler.add(comments, subQuad);
    });

    this.fullDataset.match(quad.subject, RDFS.comment, null).forEach(subQuad => {
      DatasetHandler.add(comments, subQuad);
    });

    const definitions = [];

    this.subjectsOnlyDataset.match(quad.subject, SKOS.definition, null).forEach(subQuad => {
      DatasetHandler.add(definitions, subQuad);
    });

    this.fullDataset.match(quad.subject, SKOS.definition, null).forEach(subQuad => {
      DatasetHandler.add(definitions, subQuad);
    });

    const comment = DatasetHandler.getTermDescription(comments, definitions, labels);

    return { name, nameEscapedForLanguage, comment, labels, comments, definitions };
  }

  static add(array, quad) {
    if (DatasetHandler.doesNotContainValueForLanguageAlready(array, quad)) {
      array.push({
        value: quad.object.value,
        valueEscapedForJavascript: DatasetHandler.escapeStringForJavascript(quad.object.value),
        language: quad.object.language,
      });
    }
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
        result = comments[0] ? comments[0] : { value: '' };
      }
    }

    return result.value;
  }

  static lookupEnglishOrNoLanguage(collection) {
    let result = collection.find(e => e.language === 'en');

    if (result === undefined) {
      result = collection.find(e => e.language === '');
    }

    return result;
  }

  static doesNotContainValueForLanguageAlready(array, quad) {
    return array.length === 0 || !array.some(e => e.language === quad.object.language);
  }

  buildTemplateInput() {
    const result = {};

    result.versionWebpack = this.vocabData.versionWebpack;
    result.versionWebpackCli = this.vocabData.versionWebpackCli;
    result.versionBabelCore = this.vocabData.versionBabelCore;
    result.versionBabelLoader = this.vocabData.versionBabelLoader;

    result.generatedTimestamp = this.vocabData.generatedTimestamp;
    result.generatorName = this.vocabData.generatorName;
    result.generatorVersion = this.vocabData.generatorVersion;
    result.sourceRdfResources = this.vocabData.vocabListFile
      ? `Vocabulary built from vocab list file: [${this.vocabData.vocabListFile}].`
      : `Vocabulary built from input${
          this.vocabData.inputFiles.length === 1 ? '' : 's'
        }: [${this.vocabData.inputFiles.join(', ')}].`;

    result.classes = [];
    result.properties = [];
    result.literals = [];

    result.inputFiles = this.vocabData.inputFiles;
    result.vocabListFile = this.vocabData.vocabListFile;
    result.namespace = this.findNamespace();

    result.artifactName = this.artifactName();
    result.vocabName = this.vocabData.nameAndPrefixOverride || this.findPreferredNamespacePrefix();
    result.vocabNameUpperCase = DatasetHandler.vocabNameUpperCase(result.vocabName);
    result.description = this.findDescription();
    result.artifactVersion = this.vocabData.artifactVersion;
    result.litVocabTermVersion = this.vocabData.litVocabTermVersion;
    result.npmRegistry = this.vocabData.npmRegistry;
    result.outputDirectory = this.vocabData.outputDirectory;
    result.authorSet = this.findAuthors();
    result.runNpmInstall = this.vocabData.runNpmInstall;
    result.runYalcCommand = this.vocabData.runYalcCommand;
    result.runNpmPublish = this.vocabData.runNpmPublish;
    result.bumpVersion = this.vocabData.bumpVersion;
    result.runWidoco = this.vocabData.runWidoco;
    result.noprompt = this.vocabData.noprompt;
    result.supportBundling = this.vocabData.supportBundling;

    let subjectSet = DatasetHandler.subjectsOnly(this.subjectsOnlyDataset);
    if (subjectSet.length === 0) {
      subjectSet = DatasetHandler.subjectsOnly(this.fullDataset);
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
        result.classes.push(this.handleTerm(quad, result.namespace));
      });
    });
  }

  handleProperties(subject, result) {
    SUPPORTED_PROPERTIES.forEach(propertyType => {
      this.fullDataset.match(subject, RDF.type, propertyType).forEach(quad => {
        const term = this.handleTerm(quad, result.namespace);
        if (term) {
          result.properties.push(term);
        }
      });
    });
  }

  handleLiterals(subject, result) {
    SUPPORTED_LITERALS.forEach(literalType => {
      this.fullDataset.match(subject, RDF.type, literalType).forEach(quad => {
        result.literals.push(this.handleTerm(quad, result.namespace));
      });
    });
  }

  findNamespace() {
    let namespace = this.findOwlOntology(owlOntologyTerms => {
      const ontologyNamespaces = this.fullDataset.match(
        owlOntologyTerms.subject,
        VANN.preferredNamespaceUri,
        null
      );
      return LitUtils.firstDatasetValue(ontologyNamespaces);
    });

    if (!namespace) {
      const first = DatasetHandler.subjectsOnly(this.fullDataset)[0] || '';

      // Special-case handling for OWL, since it explicitly marks the IRI 'http://www.w3.org/2002/07/owl' as being the
      // ontology, and not 'http://www.w3.org/2002/07/owl#', which I think it should be!
      if (first === 'http://www.w3.org/2002/07/owl') {
        namespace = 'http://www.w3.org/2002/07/owl#';
      } else {
        namespace = first.substring(
          0,
          Math.max(first.lastIndexOf('/'), first.lastIndexOf('#')) + 1
        );
      }
    }

    return namespace;
  }

  findPreferredNamespacePrefix() {
    let prefix = this.findOwlOntology(owlOntologyTerms => {
      const ontologyPrefixes = this.fullDataset.match(
        owlOntologyTerms.subject,
        VANN.preferredNamespacePrefix,
        null
      );

      return LitUtils.firstDatasetValue(ontologyPrefixes);
    });

    if (!prefix) {
      const first = DatasetHandler.subjectsOnly(this.fullDataset)[0] || '';
      prefix = first.substring(first.lastIndexOf('//') + 2, first.lastIndexOf('.'));
    }

    return prefix;
  }

  artifactName() {
    return (
      this.vocabData.artifactName ||
      this.vocabData.moduleNamePrefix +
        this.findPreferredNamespacePrefix()
          .toLowerCase()
          .replace(/_/g, '-')
    );
  }

  static vocabNameUpperCase(name) {
    return name.toUpperCase().replace(/-/g, '_');
  }

  findDescription() {
    return this.findOwlOntology(owlOntologyTerms => {
      const onologyComments = this.fullDataset.match(
        owlOntologyTerms.subject,
        DCTERMS.description,
        null
      );

      return DatasetHandler.escapeStringForJson(LitUtils.firstDatasetValue(onologyComments, ''));
    });
  }

  /**
   * Simple utility function that encodes the specified value for use within JSON (e.g. escapes newline characters).
   * NOTE: It simply returns the value ready to be placed into a JSON value string, so it does NOT include delimiting
   * quotes!
   *
   * @param value The value to escape
   * @returns {string} The escaped string
   */
  static escapeStringForJson(value) {
    // Just use JSON.stringify, but make sure we strip off the enclosing quotes!
    const escaped = JSON.stringify(value);
    return escaped.substr(1, escaped.length - 2);
  }

  static escapeStringForJavascript(value) {
    return value.replace('`', '\\`');
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
          ? [DEFAULT_AUTHOR]
          : onologyAuthors.toArray().map(authorQuad => authorQuad.object.value)
      );
    }, new Set([DEFAULT_AUTHOR]));
  }

  findOwlOntology(callback, defaultResult) {
    const owlOntologyTerms = this.fullDataset
      .match(null, RDF.type, OWL.Ontology)
      .toArray()
      .shift();
    if (owlOntologyTerms) {
      return callback(owlOntologyTerms);
    }

    return defaultResult || ''; // Default to return empty string
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
};
