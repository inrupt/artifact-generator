// We could use our generated LIT Common vocabs here (and originally we
// did!), but doing that creates a circular dependency since we need the
// generator to generate that bundled vocab artifact in the first place!
// So we just create the specific terms we need manually here instead
// (which is fine, as these vocabs, and their terms, are all extremely stable!).
const rdf = require("rdf-ext");

const RDF_NAMESPACE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
module.exports.RDF_NAMESPACE = RDF_NAMESPACE;
module.exports.RDF = {
  type: rdf.namedNode(`${RDF_NAMESPACE}type`),
  Property: rdf.namedNode(`${RDF_NAMESPACE}Property`),
  langString: rdf.namedNode(`${RDF_NAMESPACE}langString`),
};

const RDFS_NAMESPACE = "http://www.w3.org/2000/01/rdf-schema#";
module.exports.RDFS = {
  label: rdf.namedNode(`${RDFS_NAMESPACE}label`),
  comment: rdf.namedNode(`${RDFS_NAMESPACE}comment`),
  Class: rdf.namedNode(`${RDFS_NAMESPACE}Class`),
  Datatype: rdf.namedNode(`${RDFS_NAMESPACE}Datatype`),
  Literal: rdf.namedNode(`${RDFS_NAMESPACE}Literal`),
  subClassOf: rdf.namedNode(`${RDFS_NAMESPACE}subClassOf`),
  subPropertyOf: rdf.namedNode(`${RDFS_NAMESPACE}subPropertyOf`),
};

const DCTERMS_NAMESPACE = "http://purl.org/dc/terms/";
module.exports.DCTERMS = {
  description: rdf.namedNode(`${DCTERMS_NAMESPACE}description`),
  creator: rdf.namedNode(`${DCTERMS_NAMESPACE}creator`),
};

const SKOS_NAMESPACE = "http://www.w3.org/2004/02/skos/core#";
module.exports.SKOS = {
  Concept: rdf.namedNode(`${SKOS_NAMESPACE}Concept`),
  definition: rdf.namedNode(`${SKOS_NAMESPACE}definition`),
};

const OWL_NAMESPACE = "http://www.w3.org/2002/07/owl#";
module.exports.OWL = {
  Ontology: rdf.namedNode(`${OWL_NAMESPACE}Ontology`),
  Class: rdf.namedNode(`${OWL_NAMESPACE}Class`),
  ObjectProperty: rdf.namedNode(`${OWL_NAMESPACE}ObjectProperty`),
  NamedIndividual: rdf.namedNode(`${OWL_NAMESPACE}NamedIndividual`),
  AnnotationProperty: rdf.namedNode(`${OWL_NAMESPACE}AnnotationProperty`),
  DatatypeProperty: rdf.namedNode(`${OWL_NAMESPACE}DatatypeProperty`),
};

const VANN_NAMESPACE = "http://purl.org/vocab/vann/";
module.exports.VANN = {
  preferredNamespacePrefix: rdf.namedNode(
    `${VANN_NAMESPACE}preferredNamespacePrefix`
  ),
  preferredNamespaceUri: rdf.namedNode(
    `${VANN_NAMESPACE}preferredNamespaceUri`
  ),
};

const SCHEMA_DOT_ORG_NAMESPACE = "http://schema.org/";
module.exports.SCHEMA_DOT_ORG = {
  alternateName: rdf.namedNode(`${SCHEMA_DOT_ORG_NAMESPACE}alternateName`),
  givenName: rdf.namedNode(`${SCHEMA_DOT_ORG_NAMESPACE}givenName`),
  familyName: rdf.namedNode(`${SCHEMA_DOT_ORG_NAMESPACE}familyName`),
  Person: rdf.namedNode(`${SCHEMA_DOT_ORG_NAMESPACE}Person`),
  PaymentStatusType: rdf.namedNode(
    `${SCHEMA_DOT_ORG_NAMESPACE}PaymentStatusType`
  ),
};
