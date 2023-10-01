// We could use our generated Common vocabs here (and originally we
// did!), but doing that creates a circular dependency since we need the
// generator to generate that bundled vocab artifact in the first place!
// So we just create the specific terms we need manually here instead
// (which is fine, as these vocabs, and their terms, are all extremely stable!).
//
// Note: in general, it's bad practice to use simple string concatenation to
// ever construct IRIs (due to potential normalization issues with double
// '/' characters, or '..' appearing in paths, etc.). Instead we can use the
// 'URL' class to construct our IRIs, such as this example for RDF.type:
//   type: rdf.namedNode(new URL("type", RDF_NAMESPACE).href),
// ..but this does result in less-readable code! So in the case of this
// particular code we favour readability (since these vocab terms are so
// stable).
const rdf = require("rdf-ext");

const RDF_NAMESPACE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
module.exports.RDF_NAMESPACE = RDF_NAMESPACE;
module.exports.RDF = {
  type: rdf.namedNode(`${RDF_NAMESPACE}type`),
  Property: rdf.namedNode(`${RDF_NAMESPACE}Property`),
  List: rdf.namedNode(`${RDF_NAMESPACE}List`),
  langString: rdf.namedNode(`${RDF_NAMESPACE}langString`),
};

const RDFS_NAMESPACE = "http://www.w3.org/2000/01/rdf-schema#";
module.exports.RDFS_NAMESPACE = RDFS_NAMESPACE;
module.exports.RDFS = {
  label: rdf.namedNode(`${RDFS_NAMESPACE}label`),
  comment: rdf.namedNode(`${RDFS_NAMESPACE}comment`),
  Resource: rdf.namedNode(`${RDFS_NAMESPACE}Resource`),
  Class: rdf.namedNode(`${RDFS_NAMESPACE}Class`),
  Datatype: rdf.namedNode(`${RDFS_NAMESPACE}Datatype`),
  Literal: rdf.namedNode(`${RDFS_NAMESPACE}Literal`),
  subClassOf: rdf.namedNode(`${RDFS_NAMESPACE}subClassOf`),
  subPropertyOf: rdf.namedNode(`${RDFS_NAMESPACE}subPropertyOf`),
  seeAlso: rdf.namedNode(`${RDFS_NAMESPACE}seeAlso`),
  isDefinedBy: rdf.namedNode(`${RDFS_NAMESPACE}isDefinedBy`),
};

const DCTERMS_NAMESPACE = "http://purl.org/dc/terms/";
module.exports.DCTERMS = {
  description: rdf.namedNode(`${DCTERMS_NAMESPACE}description`),
  creator: rdf.namedNode(`${DCTERMS_NAMESPACE}creator`),
  title: rdf.namedNode(`${DCTERMS_NAMESPACE}title`),
};

// For purely legacy reasons (specifically 'cos the core RDF and RDFS vocabs
// use terms from this 'old' vocab to describe themselves)!
const DCELEMENTS_NAMESPACE = "http://purl.org/dc/elements/1.1/";
module.exports.DCELEMENTS = {
  title: rdf.namedNode(`${DCELEMENTS_NAMESPACE}title`),
};

const SKOS_NAMESPACE = "http://www.w3.org/2004/02/skos/core#";
module.exports.SKOS = {
  Concept: rdf.namedNode(`${SKOS_NAMESPACE}Concept`),
  definition: rdf.namedNode(`${SKOS_NAMESPACE}definition`),
};

const SKOSXL_NAMESPACE = "http://www.w3.org/2008/05/skos-xl#";
module.exports.SKOSXL = {
  Label: rdf.namedNode(`${SKOSXL_NAMESPACE}Label`),
  literalForm: rdf.namedNode(`${SKOSXL_NAMESPACE}literalForm`),
  prefLabel: rdf.namedNode(`${SKOSXL_NAMESPACE}prefLabel`),
  altLabel: rdf.namedNode(`${SKOSXL_NAMESPACE}altLabel`),
  hiddenLabel: rdf.namedNode(`${SKOSXL_NAMESPACE}hiddenLabel`),
  labelRelation: rdf.namedNode(`${SKOSXL_NAMESPACE}labelRelation`),
};

const OWL_NAMESPACE = "http://www.w3.org/2002/07/owl#";
module.exports.OWL_NAMESPACE = OWL_NAMESPACE;
module.exports.OWL = {
  Ontology: rdf.namedNode(`${OWL_NAMESPACE}Ontology`),
  Class: rdf.namedNode(`${OWL_NAMESPACE}Class`),
  ObjectProperty: rdf.namedNode(`${OWL_NAMESPACE}ObjectProperty`),
  NamedIndividual: rdf.namedNode(`${OWL_NAMESPACE}NamedIndividual`),
  AnnotationProperty: rdf.namedNode(`${OWL_NAMESPACE}AnnotationProperty`),
  DatatypeProperty: rdf.namedNode(`${OWL_NAMESPACE}DatatypeProperty`),
};

const XSD_NAMESPACE = "http://www.w3.org/2001/XMLSchema#";
module.exports.XSD_NAMESPACE = XSD_NAMESPACE;
module.exports.XSD = {
  string: rdf.namedNode(`${XSD_NAMESPACE}string`),
};

const VANN_NAMESPACE = "http://purl.org/vocab/vann/";
module.exports.VANN = {
  preferredNamespacePrefix: rdf.namedNode(
    `${VANN_NAMESPACE}preferredNamespacePrefix`,
  ),
  preferredNamespaceUri: rdf.namedNode(
    `${VANN_NAMESPACE}preferredNamespaceUri`,
  ),
};

const SHACL_NAMESPACE = "http://www.w3.org/ns/shacl#";
module.exports.SHACL = {
  PrefixDeclaration: rdf.namedNode(`${SHACL_NAMESPACE}PrefixDeclaration`),
  declare: rdf.namedNode(`${SHACL_NAMESPACE}declare`),
  namespace: rdf.namedNode(`${SHACL_NAMESPACE}namespace`),
  prefix: rdf.namedNode(`${SHACL_NAMESPACE}prefix`),
};

const SCHEMA_DOT_ORG_NAMESPACE = "https://schema.org/";
module.exports.SCHEMA_DOT_ORG = {
  alternateName: rdf.namedNode(`${SCHEMA_DOT_ORG_NAMESPACE}alternateName`),
  givenName: rdf.namedNode(`${SCHEMA_DOT_ORG_NAMESPACE}givenName`),
  familyName: rdf.namedNode(`${SCHEMA_DOT_ORG_NAMESPACE}familyName`),
  Person: rdf.namedNode(`${SCHEMA_DOT_ORG_NAMESPACE}Person`),
  PaymentStatusType: rdf.namedNode(
    `${SCHEMA_DOT_ORG_NAMESPACE}PaymentStatusType`,
  ),
};

const ARTIFACT_GENERATOR_NAMESPACE =
  "https://inrupt.com/vocab/tool/artifact_generator/";
module.exports.ARTIFACT_GENERATOR = {
  ConstantString: rdf.namedNode(
    `${ARTIFACT_GENERATOR_NAMESPACE}ConstantString`,
  ),
  ConstantIri: rdf.namedNode(`${ARTIFACT_GENERATOR_NAMESPACE}ConstantIri`),
};

const INRUPT_BEST_PRACTICE_NAMESPACE =
  "https://w3id.org/inrupt/vocab/bestPractice/";
module.exports.INRUPT_BEST_PRACTICE_NAMESPACE = INRUPT_BEST_PRACTICE_NAMESPACE;
module.exports.INRUPT_BEST_PRACTICE = {};
const INRUPT_BEST_PRACTICE_NAMESPACE_PREFIX = "inrupt_bp";
module.exports.INRUPT_BEST_PRACTICE_NAMESPACE_PREFIX =
  INRUPT_BEST_PRACTICE_NAMESPACE_PREFIX;
