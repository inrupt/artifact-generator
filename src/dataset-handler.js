const { RDF, RDFS, SCHEMA, OWL, VANN, DCTERMS, SKOS } = require('@lit/generated-vocab-common');
const { LitUtils } = require('@lit/vocab-term');

const DEFAULT_AUTHOR = '@lit/artifact-generator-js';

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
  constructor(fullDataset, subjectsOnlyDataset, argv) {
    this.fullDataset = fullDataset;
    this.subjectsOnlyDataset = subjectsOnlyDataset;
    this.argv = argv;
  }

  handleTerms(quad, namespace) {
    const labels = [];

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

    const fullName = quad.subject.value;
    const name = fullName.split(namespace)[1];

    const comment = DatasetHandler.getComment(comments);

    return { name, comment, labels, comments, definitions };
  }

  static add(array, quad) {
    if (DatasetHandler.doesNotContainLanguage(array, quad)) {
      array.push({
        value: quad.object.value,
        language: quad.object.language,
      });
    }
  }

  /**
   * Finds a comment from the comments array. First check if there is a english comment, next check for a default language
   * comment (''), then just get the first comment or default to empty string.
   * @param comments An array of comments containing comments and there language.
   * @returns {string} Returns a string of the comment if founds, else empty string is returned.
   */
  static getComment(comments) {
    let found = comments.find(e => e.language === 'en');

    if (found === undefined) {
      found = comments.find(e => e.language === '');
    }

    if (found === undefined) {
      found = comments[0] ? comments[0] : { value: '' };
    }
    return found.value;
  }

  static doesNotContainLanguage(array, quad) {
    return array.length === 0 || !array.some(e => e.language === quad.object.language);
  }

  buildTemplateInput() {
    const result = {};
    result.classes = [];
    result.properties = [];
    result.literals = [];

    result.namespace = this.findNamespace();

    result.artifactName = this.artifactName();
    result.vocabNameUpperCase = this.vocabNameUpperCase();
    result.description = this.findDescription();
    result.version = this.argv.artifactVersion;
    result.npmRegistry = this.argv.npmRegistry;
    result.outputDirectory = this.argv.outputDirectory;
    result.author = this.findAuthor();

    let subjectSet = DatasetHandler.subjectsOnly(this.subjectsOnlyDataset);
    if (subjectSet.length === 0) {
      subjectSet = DatasetHandler.subjectsOnly(this.fullDataset);
    }

    subjectSet.forEach(entry => {
      this.handleClasses(entry, result);
      this.handleProperties(entry, result);
      this.handleLiterals(entry, result);
    });

    return result;
  }

  handleClasses(entry, result) {
    SUPPORTED_CLASSES.forEach(classType => {
      this.fullDataset.match(entry, null, classType).forEach(quad => {
        result.classes.push(this.handleTerms(quad, result.namespace));
      });
    });
  }

  handleProperties(entry, result) {
    SUPPORTED_PROPERTIES.forEach(propertyType => {
      this.fullDataset.match(entry, null, propertyType).forEach(quad => {
        result.properties.push(this.handleTerms(quad, result.namespace));
      });
    });
  }

  handleLiterals(entry, result) {
    SUPPORTED_LITERALS.forEach(literalType => {
      this.fullDataset.match(entry, null, literalType).forEach(quad => {
        result.literals.push(this.handleTerms(quad, result.namespace));
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
      namespace = first.substring(0, first.lastIndexOf('/') + 1);
    }
    return namespace;
  }

  findPrefix() {
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
    return this.argv.moduleNamePrefix + this.findPrefix();
  }

  vocabNameUpperCase() {
    return this.findPrefix()
      .toUpperCase()
      .replace(/-/g, '_');
  }

  findDescription() {
    return this.findOwlOntology(owlOntologyTerms => {
      const onologyComments = this.fullDataset.match(owlOntologyTerms.subject, RDFS.comment, null);
      return LitUtils.firstDatasetValue(onologyComments, '');
    });
  }

  findAuthor() {
    return this.findOwlOntology(owlOntologyTerms => {
      const onologyAuthors = this.fullDataset.match(
        owlOntologyTerms.subject,
        DCTERMS.creator,
        null
      );
      return LitUtils.firstDatasetValue(onologyAuthors, DEFAULT_AUTHOR);
    }, DEFAULT_AUTHOR);
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
