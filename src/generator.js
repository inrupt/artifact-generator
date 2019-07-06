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
    const that = this;
    return new Promise(function(resolve, reject) {
      that.resources
        .readResources(function(fullDataset, subjectsOnlyDataset) {
          const parsed = that.parseDatasets(fullDataset, subjectsOnlyDataset);
          artifacts.createArtifacts(that.argv, parsed);
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
    return this.buildTemplateInput(this.merge(ds), this.merge([dsExt]));
  }

  merge(dataSets) {
    var fullData = rdf.dataset();
    dataSets.forEach(function(ds) {
      if (ds) {
        fullData = fullData.merge(ds);
      }
    });

    return fullData;
  }

  handleTerms(fullDataset, subjectsOnlyDataset, quad, namespace) {
    const labels = [];

    subjectsOnlyDataset
      .match(quad.subject, SCHEMA.alternateName, null)
      .filter(subQuad => {
        this.add(labels, subQuad);
      });

    subjectsOnlyDataset
      .match(quad.subject, RDFS.label, null)
      .filter(subQuad => {
        this.add(labels, subQuad);
      });

    fullDataset.match(quad.subject, RDFS.label, null).filter(subQuad => {
      this.add(labels, subQuad);
    });

    fullDataset
      .match(quad.subject, SCHEMA.alternateName, null)
      .filter(subQuad => {
        this.add(labels, subQuad);
      });

    const comments = [];

    subjectsOnlyDataset
      .match(quad.subject, RDFS.comment, null)
      .filter(subQuad => {
        this.add(comments, subQuad);
      });

    fullDataset.match(quad.subject, RDFS.comment, null).filter(subQuad => {
      this.add(comments, subQuad);
    });

    var termName = quad.subject.value;
    termName = termName.split(namespace)[1];

    return {
      name: termName,
      comment: this.getComment(comments),
      labels: labels,
      comments: comments,
    };
  }

  add(array, quad) {
    if (this.doesNotContainLanguage(array, quad)) {
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
  getComment(comments) {
    var found = comments.find(e => e.language === 'en');

    if (found === undefined) {
      found = comments.find(e => e.language === '');
    }

    if (found === undefined) {
      found = comments[0] ? comments[0] : { value: '' };
    }
    return found.value;
  }

  doesNotContainLanguage(array, quad) {
    return (
      array.length === 0 ||
      !array.some(e => e.language === quad.object.language)
    );
  }

  buildTemplateInput(fullData, subjectsOnlyDataset) {
    //const fullData = dataSet.merge(dataSetExtentions);

    const classes = [];
    const properties = [];

    const result = {};
    result.classes = classes;
    result.properties = properties;

    result.namespace = this.findNamespace(fullData);

    result.ontologyPrefix = this.findPrefix(fullData);

    result.version = this.argv.artifactVersion;

    let subjectSet = this.subjectsOnly(subjectsOnlyDataset);
    if (subjectSet.length === 0) {
      subjectSet = this.subjectsOnly(fullData);
    }

    subjectSet.forEach(entry => {
      fullData.match(entry, null, RDFS.Class).filter(quad => {
        classes.push(
          this.handleTerms(
            fullData,
            subjectsOnlyDataset,
            quad,
            result.namespace
          )
        );
      });

      fullData.match(entry, null, RDF.Property).filter(quad => {
        properties.push(
          this.handleTerms(
            fullData,
            subjectsOnlyDataset,
            quad,
            result.namespace
          )
        );
      });
    });

    return result;
  }

  findNamespace(fullData) {
    const ontologyNamespaces = fullData
      .match(null, VANN.preferredNamespaceUri, null)
      .toArray();
    let namespace = this.firstDsValue(ontologyNamespaces);

    if (!namespace) {
      let first = this.subjectsOnly(fullData)[0] || '';
      namespace = first.substring(0, first.lastIndexOf('/') + 1);
    }
    return namespace;
  }

  findPrefix(fullData) {
    const ontologyPrefix = fullData
      .match(null, VANN.preferredNamespacePrefix, null)
      .toArray();
    let prefix = this.firstDsValue(ontologyPrefix);

    if (!prefix) {
      let first = this.subjectsOnly(fullData)[0] || '';
      prefix = first.substring(
        first.lastIndexOf('//') + 2,
        first.lastIndexOf('.')
      );
    }
    return prefix;
  }

  subjectsOnly(fullData) {
    const terms = fullData.filter(quad => {
      return quad.subject.value !== OWL.Ontology;
    });

    const termSubjects = [];
    terms.filter(quad => {
      termSubjects.push(quad.subject.value);
    });

    return [...new Set(termSubjects)];
  }

  firstDsValue(dataset, defaultRes) {
    const first = dataset[0];
    if (first) {
      return first.object.value;
    } else {
      return defaultRes;
    }
  }
};
