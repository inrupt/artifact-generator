/**
 * Generated by the artifact generator [@inrupt/artifact-generator], version [0.15.0]
 * as part of artifact: [@inrupt/generated-vocab-schema-inrupt-ext], version: [1.0.0]
 * on 'Sunday, August 8, 2021 2:29 PM'.
 *
 * Vocabulary built from inputs: [./test/resources/vocabs/schema-snippet.ttl, ./test/resources/vocabs/schema-inrupt-ext.ttl].
 *
 * Inrupt extension to Schema.org terms providing
 multilingual alternative names (i.e. labels) and translations for comments
 (e.g. for use directly as labels or tool-tips in user interfaces or error
 messages). This extension very deliberately cherry-picks the individual terms
 from Schema.org that Inrupt currently deem generally useful for Solid and Solid
 applications (meaning we can provide a much cleaner, less noisy and smaller
 bundle size when generating programming language artifacts that provide
 convenient constants for just these selected terms, rather than including the
 over 2,500 terms currently defined in Schema.org).
 */

// We prefix our local variables with underscores to (hopefully!) prevent
// potential names clashes with terms from vocabularies.
const { VocabTerm as _VocabTerm, getLocalStore } = require("@inrupt/solid-common-vocab");
const DataFactory as _DataFactory = require("@rdfjs/data-model");

const { namedNode as _namedNode } = _DataFactory;

function _NS(localName) {
  return _namedNode(`http://schema.org/${localName}`);
}

/**
 * Inrupt extension to Schema.org terms providing
 multilingual alternative names (i.e. labels) and translations for comments
 (e.g. for use directly as labels or tool-tips in user interfaces or error
 messages). This extension very deliberately cherry-picks the individual terms
 from Schema.org that Inrupt currently deem generally useful for Solid and Solid
 applications (meaning we can provide a much cleaner, less noisy and smaller
 bundle size when generating programming language artifacts that provide
 convenient constants for just these selected terms, rather than including the
 over 2,500 terms currently defined in Schema.org).
 */
const SCHEMA_INRUPT_EXT = {
  PREFIX: "schema-inrupt-ext",
  NAMESPACE: "http://schema.org/",
  PREFIX_AND_NAMESPACE: { "schema-inrupt-ext": "http://schema.org/" },
  NS: _NS,

  // *****************
  // All the Classes.
  // *****************

  /**
   * A person (alive, dead, undead, or fictional).
   *
   * This term has [4] labels and comments, in the languages [de, es, fr, it].
   *
   * Defined by the vocabulary: https://w3id.org/inrupt/vocab/extension/schema#
   */
  Person: new _VocabTerm(
    _NS("Person"),
    _DataFactory,
    getLocalStore(),
    false
  )
    .addIsDefinedBy(_namedNode("https://w3id.org/inrupt/vocab/extension/schema#"))
    .addLabelNoLanguage(`Person`)
    .addLabel(`Person`, "en")
    .addLabel(`La personne`, "fr")
    .addLabel(`Person`, "de")
    .addLabel(`Persona`, "es")
    .addLabel(`Persona`, "it")
    .addCommentNoLanguage(`A person (alive, dead, undead, or fictional).`)
    .addComment(`Une personne (vivante, morte, mort-vivant ou fictive).`, "fr")
    .addComment(`Eine Person (lebendig, tot, untot oder fiktiv).`, "de")
    .addComment(`Una persona (viva, muerta, no muerta o ficticia).`, "es")
    .addComment(`Una persona (viva, morta, non morta o immaginaria).`, "it"),


  // *******************
  // All the Properties.
  // *******************

  /**
   * Given name. In the U.S., the first name of a Person. This can be used along with familyName instead of the name property.
   *
   * This term has [4] labels and comments, in the languages [de, es, fr, it].
   *
   * Defined by the vocabulary: https://w3id.org/inrupt/vocab/extension/schema#
   */
  givenName: new _VocabTerm(
    _NS("givenName"),
    _DataFactory,
    getLocalStore(),
    false
  )
    .addIsDefinedBy(_namedNode("https://w3id.org/inrupt/vocab/extension/schema#"))
    .addLabelNoLanguage(`givenName`)
    .addLabel(`Given Name`, "en")
    .addLabel(`Prénom`, "fr")
    .addLabel(`Vorname`, "de")
    .addLabel(`Nombre de pila`, "es")
    .addLabel(`Nome di battesimo`, "it")
    .addCommentNoLanguage(`Given name. In the U.S., the first name of a Person. This can be used along with familyName instead of the name property.`)
    .addComment(`Prénom. Aux États-Unis, le prénom d’une personne. Ceci peut être utilisé avec familyName au lieu de la propriété name.`, "fr")
    .addComment(`Vorname. In den USA der Vorname einer Person. Dies kann zusammen mit familyName anstelle der Eigenschaft name verwendet werden.`, "de")
    .addComment(`Nombre de pila. En los EE. UU., El primer nombre de una persona. Esto se puede usar junto con familyName en lugar de la propiedad name.`, "es")
    .addComment(`Nome di battesimo. Negli Stati Uniti, il primo nome di una persona. Questo può essere usato insieme a familyName al posto della proprietà name.`, "it"),

  /**
   * Family name. In the U.S., the last name of an Person. This can be used along with givenName instead of the name property.
   *
   * This term has [4] labels and comments, in the languages [de, es, fr, it].
   *
   * Defined by the vocabulary: https://w3id.org/inrupt/vocab/extension/schema#
   */
  familyName: new _VocabTerm(
    _NS("familyName"),
    _DataFactory,
    getLocalStore(),
    false
  )
    .addIsDefinedBy(_namedNode("https://w3id.org/inrupt/vocab/extension/schema#"))
    .addLabelNoLanguage(`familyName`)
    .addLabel(`Family Name`, "en")
    .addLabel(`Nom de famille`, "fr")
    .addLabel(`Nachname`, "de")
    .addLabel(`Apellido`, "es")
    .addLabel(`Cognome`, "it")
    .addCommentNoLanguage(`Family name. In the U.S., the last name of an Person. This can be used along with givenName instead of the name property.`)
    .addComment(`Nom de famille. Aux États-Unis, le nom de famille d’une personne. Ceci peut être utilisé avec GivenName au lieu de la propriété name.`, "fr")
    .addComment(`Nachname. In den USA der Nachname einer Person. Dies kann zusammen mit givenName anstelle der Eigenschaft name verwendet werden.`, "de")
    .addComment(`Apellido. En los EE.UU., el apellido de una persona. Esto se puede usar junto con givenName en lugar de la propiedad name.`, "es")
    .addComment(`Cognome. Negli Stati Uniti, il cognome di una persona. Questo può essere usato insieme a givenName al posto della proprietà name.`, "it"),

  /**
   * The country. For example, USA. You can also provide the two-letter <a href="http://en.wikipedia.org/wiki/ISO_3166-1">ISO 3166-1 alpha-2 country code</a>.
   */
  addressCountry: new _VocabTerm(
    _NS("addressCountry"),
    _DataFactory,
    getLocalStore(),
    false
  )
    .addLabelNoLanguage(`addressCountry`)
    .addCommentNoLanguage(`The country. For example, USA. You can also provide the two-letter <a href="http://en.wikipedia.org/wiki/ISO_3166-1">ISO 3166-1 alpha-2 country code</a>.`),

  //
  // Marker allowing us put commas at the end of all lines above (only the last line does not have a comma).
  //
  END_OF_VOCAB: "End of vocab."
}

module.exports = SCHEMA_INRUPT_EXT;
