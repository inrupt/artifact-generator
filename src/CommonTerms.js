// We could use our generated LIT Common vocabs here (and originally we
// did!), but doing that creates a circular dependency since we need the
// generator to generate that bundled vocab artifact in the first place!
// So we just create the specific LIT Vocab Terms we need manually here instead
// (which is fine, as these vocabs, and their terms, are all extremely stable!).
//
// NOTE: We need to use 'localStorage' references for each LIT Vocab Term
// instance (since they are context-aware (e.g. for determining the current
// user's language preference)), for which we can just depend on a mock
// implementation of 'localStorage'. But this will still result in ESLint
// 'no-undef' errors. To fix that I added '"browser": true,' to our
// '.eslintrc.json' file.
require('mock-local-storage');

const { LitVocabTerm } = require('@lit/vocab-term');

const RDF_NAMESPACE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
module.exports.RDF_NAMESPACE = RDF_NAMESPACE;
module.exports.RDF = {
  type: new LitVocabTerm(`${RDF_NAMESPACE}type`, localStorage),
  Property: new LitVocabTerm(`${RDF_NAMESPACE}Property`, localStorage),
  langString: new LitVocabTerm(`${RDF_NAMESPACE}langString`, localStorage),
};

const RDFS_NAMESPACE = 'http://www.w3.org/2000/01/rdf-schema#';
module.exports.RDFS = {
  label: new LitVocabTerm(`${RDFS_NAMESPACE}label`, localStorage),
  comment: new LitVocabTerm(`${RDFS_NAMESPACE}comment`, localStorage),
  Class: new LitVocabTerm(`${RDFS_NAMESPACE}Class`, localStorage),
  Datatype: new LitVocabTerm(`${RDFS_NAMESPACE}Datatype`, localStorage),
  Literal: new LitVocabTerm(`${RDFS_NAMESPACE}Literal`, localStorage),
};

const DCTERMS_NAMESPACE = 'http://purl.org/dc/terms/';
module.exports.DCTERMS = {
  description: new LitVocabTerm(`${DCTERMS_NAMESPACE}description`, localStorage),
  creator: new LitVocabTerm(`${DCTERMS_NAMESPACE}creator`, localStorage),
};

const SKOS_NAMESPACE = 'http://www.w3.org/2004/02/skos/core#';
module.exports.SKOS = {
  Concept: new LitVocabTerm(`${SKOS_NAMESPACE}Concept`, localStorage),
  definition: new LitVocabTerm(`${SKOS_NAMESPACE}definition`, localStorage),
};

const OWL_NAMESPACE = 'http://www.w3.org/2002/07/owl#';
module.exports.OWL = {
  Ontology: new LitVocabTerm(`${OWL_NAMESPACE}Ontology`, localStorage),
  Class: new LitVocabTerm(`${OWL_NAMESPACE}Class`, localStorage),
  ObjectProperty: new LitVocabTerm(`${OWL_NAMESPACE}ObjectProperty`, localStorage),
  NamedIndividual: new LitVocabTerm(`${OWL_NAMESPACE}NamedIndividual`, localStorage),
  AnnotationProperty: new LitVocabTerm(`${OWL_NAMESPACE}AnnotationProperty`, localStorage),
  DatatypeProperty: new LitVocabTerm(`${OWL_NAMESPACE}DatatypeProperty`, localStorage),
};

const VANN_NAMESPACE = 'http://purl.org/vocab/vann/';
module.exports.VANN = {
  preferredNamespacePrefix: new LitVocabTerm(
    `${VANN_NAMESPACE}preferredNamespacePrefix`,
    localStorage
  ),
  preferredNamespaceUri: new LitVocabTerm(`${VANN_NAMESPACE}preferredNamespaceUri`, localStorage),
};

const SCHEMA_DOT_ORG_NAMESPACE = 'http://schema.org/';
module.exports.SCHEMA_DOT_ORG = {
  alternateName: new LitVocabTerm(`${SCHEMA_DOT_ORG_NAMESPACE}alternateName`, localStorage),
  givenName: new LitVocabTerm(`${SCHEMA_DOT_ORG_NAMESPACE}givenName`, localStorage),
  familyName: new LitVocabTerm(`${SCHEMA_DOT_ORG_NAMESPACE}familyName`, localStorage),
  Person: new LitVocabTerm(`${SCHEMA_DOT_ORG_NAMESPACE}Person`, localStorage),
  PaymentStatusType: new LitVocabTerm(`${SCHEMA_DOT_ORG_NAMESPACE}PaymentStatusType`, localStorage),
};
