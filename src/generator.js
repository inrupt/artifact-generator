const Resources = require('./resources');
const artifacts = require('./artifacts');

const rdf = require('rdf-ext');

const { RDF, RDFS, SCHEMA, OWL, VANN } = require('vocab-lit');

module.exports = class Generator {
  constructor(argv) {
    this.argv = argv;

    this.resources = new Resources(argv.input, argv.vocabTermsFrom);
  }

  /**
   *
   */
  generate() {
    return new Promise((resolve, reject) => {
      this.resources
        .readResources((fullDataset, subjectsOnlyDataset) => {
          const parsed = this.parseDatasets(fullDataset, subjectsOnlyDataset);
          artifacts.createArtifacts(this.argv, parsed);
          resolve('Done!');
        })
        .catch(error => {
          const result = 'Failed to generate: ' + error.toString();
          console.log(result);
          reject(new Error(result));
        });
    });
  }

  parseDatasets(ds, dsExt) {
    return this.buildTemplateInput(Generator.merge(ds), Generator.merge([dsExt]));
  }

  static merge(dataSets) {
    let fullData = rdf.dataset();
    dataSets.forEach(ds => {
      if (ds) {
        fullData = fullData.merge(ds);
      }
    });

    return fullData;
  }

  static handleTerms(fullDataset, subjectsOnlyDataset, quad, namespace) {
    const labels = [];

    subjectsOnlyDataset.match(quad.subject, SCHEMA.alternateName, null).forEach(subQuad => {
      Generator.add(labels, subQuad);
    });

    subjectsOnlyDataset.match(quad.subject, RDFS.label, null).forEach(subQuad => {
      Generator.add(labels, subQuad);
    });

    fullDataset.match(quad.subject, RDFS.label, null).forEach(subQuad => {
      Generator.add(labels, subQuad);
    });

    fullDataset.match(quad.subject, SCHEMA.alternateName, null).forEach(subQuad => {
      Generator.add(labels, subQuad);
    });

    const comments = [];

    subjectsOnlyDataset.match(quad.subject, RDFS.comment, null).forEach(subQuad => {
      Generator.add(comments, subQuad);
    });

    fullDataset.match(quad.subject, RDFS.comment, null).forEach(subQuad => {
      Generator.add(comments, subQuad);
    });

    const fullName = quad.subject.value;
    const name = fullName.split(namespace)[1];

    const comment = Generator.getComment(comments);

    return { name, comment, labels, comments };
  }

  static add(array, quad) {
    if (Generator.doesNotContainLanguage(array, quad)) {
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

  buildTemplateInput(fullData, subjectsOnlyDataset) {
    const classes = [];
    const properties = [];

    const result = {};
    result.classes = classes;
    result.properties = properties;

    result.namespace = Generator.findNamespace(fullData);

    result.ontologyPrefix = Generator.findPrefix(fullData);

    result.version = this.argv.artifactVersion;

    let subjectSet = Generator.subjectsOnly(subjectsOnlyDataset);
    if (subjectSet.length === 0) {
      subjectSet = Generator.subjectsOnly(fullData);
    }

    subjectSet.forEach(entry => {
      fullData.match(entry, null, RDFS.Class).forEach(quad => {
        classes.push(Generator.handleTerms(fullData, subjectsOnlyDataset, quad, result.namespace));
      });

      fullData.match(entry, null, RDF.Property).forEach(quad => {
        properties.push(
          Generator.handleTerms(fullData, subjectsOnlyDataset, quad, result.namespace)
        );
      });
    });

    return result;
  }

  static findNamespace(fullData) {
    const ontologyNamespaces = fullData.match(null, VANN.preferredNamespaceUri, null).toArray();
    let namespace = Generator.firstDsValue(ontologyNamespaces);

    if (!namespace) {
      const first = Generator.subjectsOnly(fullData)[0] || '';
      namespace = first.substring(0, first.lastIndexOf('/') + 1);
    }
    return namespace;
  }

  static findPrefix(fullData) {
    const ontologyPrefix = fullData.match(null, VANN.preferredNamespacePrefix, null).toArray();
    let prefix = Generator.firstDsValue(ontologyPrefix);

    if (!prefix) {
      const first = Generator.subjectsOnly(fullData)[0] || '';
      prefix = first.substring(first.lastIndexOf('//') + 2, first.lastIndexOf('.'));
    }
    return prefix;
  }

  static subjectsOnly(fullData) {
    const terms = fullData.filter(quad => {
      return quad.subject.value !== OWL.Ontology;
    });

    const termSubjects = [];
    terms.forEach(quad => {
      termSubjects.push(quad.subject.value);
    });

    return [...new Set(termSubjects)];
  }

  static firstDsValue(dataset, defaultRes) {
    const first = dataset[0];
    if (first) {
      return first.object.value;
    }
    return defaultRes;
  }
};
