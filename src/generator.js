const resources = require('./resources');
const artifacts = require('./artifacts');

const rdf = require('rdf-ext');

const { RDF, RDFS, SCHEMA, OWL } = require('vocab-lit');

const PNP = 'http://purl.org/vocab/vann/preferredNamespacePrefix';
const PNU = 'http://purl.org/vocab/vann/preferredNamespaceUri';

var version;

/**
 *
 */
function generate(datasetFiles, ver, subjectsOnlyFile) {
  version = ver; //TODO tidy this up
  return new Promise(function(resolve, reject) {
    resources.readResources(datasetFiles, subjectsOnlyFile, function(
      fullDataset,
      subjectsOnlyDataset
    ) {
      const parsed = parseDatasets(fullDataset, subjectsOnlyDataset);
      artifacts.createArtifacts(parsed);
      resolve('Done!');
    });
  });
}

function parseDatasets(ds, dsExt) {
  return buildTemplateInput(merge(ds), merge([dsExt]));
}

function merge(dataSets) {
  var fullData = rdf.dataset();
  dataSets.forEach(function(ds) {
    if (ds) {
      fullData = fullData.merge(ds);
    }
  });

  return fullData;
}

function handleTerms(fullDataset, subjectsOnlyDataset, quad, namespace) {
  const labels = [];

  subjectsOnlyDataset
    .match(quad.subject, SCHEMA.alternateName, null)
    .filter(subQuad => {
      add(labels, subQuad);
    });

  subjectsOnlyDataset.match(quad.subject, RDFS.label, null).filter(subQuad => {
    add(labels, subQuad);
  });

  fullDataset.match(quad.subject, RDFS.label, null).filter(subQuad => {
    add(labels, subQuad);
  });

  fullDataset
    .match(quad.subject, SCHEMA.alternateName, null)
    .filter(subQuad => {
      add(labels, subQuad);
    });

  const comments = [];

  subjectsOnlyDataset
    .match(quad.subject, RDFS.comment, null)
    .filter(subQuad => {
      add(comments, subQuad);
    });

  fullDataset.match(quad.subject, RDFS.comment, null).filter(subQuad => {
    add(comments, subQuad);
  });

  var termName = quad.subject.value;
  termName = termName.split(namespace)[1];

  return {
    name: termName,
    comment: getComment(comments),
    labels: labels,
    comments: comments,
  };
}

function add(array, quad) {
  if (doesNotContainLanguage(array, quad)) {
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
function getComment(comments) {
  var found = comments.find(e => e.language === 'en');

  if (found === undefined) {
    found = comments.find(e => e.language === '');
  }

  if (found === undefined) {
    found = comments[0] ? comments[0] : { value: '' };
  }
  return found.value;
}

function doesNotContainLanguage(array, quad) {
  return (
    array.length === 0 || !array.some(e => e.language === quad.object.language)
  );
}

function buildTemplateInput(fullData, subjectsOnlyDataset) {
  //const fullData = dataSet.merge(dataSetExtentions);

  const classes = [];
  const properties = [];

  const result = {};
  result.classes = classes;
  result.properties = properties;

  result.namespace = findNamespace(fullData);

  result.ontologyPrefix = findPrefix(fullData);

  result.version = version;

  let subjectSet = subjectsOnly(subjectsOnlyDataset);
  if (subjectSet.length === 0) {
    subjectSet = subjectsOnly(fullData);
  }

  subjectSet.forEach(entry => {
    fullData.match(entry, null, RDFS.Class).filter(quad => {
      classes.push(
        handleTerms(fullData, subjectsOnlyDataset, quad, result.namespace)
      );
    });

    fullData.match(entry, null, RDF.Property).filter(quad => {
      properties.push(
        handleTerms(fullData, subjectsOnlyDataset, quad, result.namespace)
      );
    });
  });

  return result;
}

function findNamespace(fullData) {
  const ontologyNamespaces = fullData
    .match(null, rdf.namedNode(PNU), null)
    .toArray();
  let namespace = firstDsValue(ontologyNamespaces);

  if (!namespace) {
    let first = subjectsOnly(fullData)[0] || '';
    namespace = first.substring(0, first.lastIndexOf('/') + 1);
  }
  return namespace;
}

function findPrefix(fullData) {
  const ontologyPrefix = fullData
    .match(null, rdf.namedNode(PNP), null)
    .toArray();
  let prefix = firstDsValue(ontologyPrefix);

  if (!prefix) {
    let first = subjectsOnly(fullData)[0] || '';
    prefix = first.substring(
      first.lastIndexOf('//') + 2,
      first.lastIndexOf('.')
    );
  }
  return prefix;
}

function subjectsOnly(fullData) {
  const terms = fullData.filter(quad => {
    return quad.subject.value !== OWL.Ontology;
  });

  const termSubjects = [];
  terms.filter(quad => {
    termSubjects.push(quad.subject.value);
  });

  return [...new Set(termSubjects)];
}

function firstDsValue(dataset, defaultRes) {
  const first = dataset[0];
  if (first) {
    return first.object.value;
  } else {
    return defaultRes;
  }
}

module.exports.generate = generate;
module.exports.buildTemplateInput = buildTemplateInput;
module.exports.merge = merge;
