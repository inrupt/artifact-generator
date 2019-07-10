const rdf = require('rdf-ext');
const { RDF, RDFS, SCHEMA, OWL, VANN } = require('lit-generated-vocab-common-js');

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

    const fullName = quad.subject.value;
    const name = fullName.split(namespace)[1];

    const comment = DatasetHandler.getComment(comments);

    return { name, comment, labels, comments };
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
    const classes = [];
    const properties = [];

    const result = {};
    result.classes = classes;
    result.properties = properties;

    result.namespace = this.findNamespace();

    result.artifactName = this.artifactName();
    result.vocabNameUpperCase = this.vocabNameUpperCase();
    result.description = this.findDescription();
    result.version = this.argv.artifactVersion;
    result.npmRegistry = this.argv.npmRegistry;
    result.author = this.findAuthor();

    let subjectSet = DatasetHandler.subjectsOnly(this.subjectsOnlyDataset);
    if (subjectSet.length === 0) {
      subjectSet = DatasetHandler.subjectsOnly(this.fullDataset);
    }

    subjectSet.forEach(entry => {
      this.fullDataset.match(entry, null, RDFS.Class).forEach(quad => {
        classes.push(this.handleTerms(quad, result.namespace));
      });

      this.fullDataset.match(entry, null, RDF.Property).forEach(quad => {
        properties.push(this.handleTerms(quad, result.namespace));
      });
    });

    return result;
  }

  findNamespace() {
    let namespace = this.findOwlOntology(owlOntologyTerms => {
      const ontologyNamespaces = this.fullDataset.match(
        owlOntologyTerms.subject,
        VANN.preferredNamespaceUri,
        null
      );
      return DatasetHandler.firstDatasetValue(ontologyNamespaces);
    });

    if (!namespace) {
      const first = DatasetHandler.subjectsOnly(this.fullDataset)[0] || '';
      namespace = first.substring(0, first.lastIndexOf('/') + 1);
    }
    return namespace;
  }

  findPrefix() {
    let prefix = this.findOwlOntology(owlOntologyTerms => {
      const ontologyPrefix = this.fullDataset.match(
        owlOntologyTerms.subject,
        VANN.preferredNamespacePrefix,
        null
      );
      return DatasetHandler.firstDatasetValue(ontologyPrefix);
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
      const onologyCommentDs = this.fullDataset.match(owlOntologyTerms.subject, RDFS.comment, null);
      return DatasetHandler.firstDatasetValue(onologyCommentDs, '');
    });
  }

  findAuthor() {
    return this.findOwlOntology(owlOntologyTerms => {
      const onologyAuthorDs = this.fullDataset.match(
        owlOntologyTerms.subject,
        rdf.namedNode('http://purl.org/dc/terms/creator'),
        null
      );
      return DatasetHandler.firstDatasetValue(onologyAuthorDs, 'lit-js@inrupt.com');
    }, 'lit-js@inrupt.com');
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

  /**
   * Reads the first object value from the given Dataset.
   *
   * @param dataset The input Dataset that will be read.
   * @param defaultValue A default value if the first term is not found.
   * @returns {*} The value of the first object value, else return the defaultValue.
   */
  static firstDatasetValue(dataset, defaultValue) {
    const first = dataset.toArray().shift();
    return first ? first.object.value : defaultValue;
  }
};
