/**
 * Generated by the artifact generator [@inrupt/artifact-generator], version [2.0.0]
 * as part of artifact: [generated-vocab-common-TEST], version: [3.2.1-SNAPSHOT]
 * on 'Monday, November 28, 2022 10:05 AM'.
 *
 * Vocabulary built from vocab list file: [./test/resources/vocab/vocab-list.yml].
 * The generator detected the following terms in the source vocabulary:
 *  - Classes: [1]
 *  - Properties: [2]
 *  - Literals: [0]
 *  - Constant IRIs: [0]
 *  - Constant strings: [0]
 *
 * Inrupt extension to Schema.org terms.
 *
 * Namespace IRI: [https://schema.org/]
 */
package com.inrupt.testing;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Namespace;
import org.eclipse.rdf4j.model.impl.SimpleNamespace;
import org.eclipse.rdf4j.model.impl.SimpleValueFactory;

import org.solid.common.vocab.Vocab;
import org.solid.common.vocab.VocabTerm;
import com.inrupt.solid.common.vocab.VocabTermImpl;

/**
 * Inrupt extension to Schema.org terms.
 *
 * Namespace IRI: [https://schema.org/]
 */
public class SCHEMA_INRUPT_EXT implements Vocab {
    public static final String PREFIX = "schema_inrupt_ext";
    public static final String NAMESPACE = "https://schema.org/";

    public static final IRI NAMESPACE_IRI = SimpleValueFactory.getInstance().createIRI("https://schema.org/");
    public static final Namespace NS = new SimpleNamespace(PREFIX, NAMESPACE);

    @Override
    public final String getNamespacePrefix() {
        return PREFIX;
    }

    @Override
    public final IRI getNamespaceIri() {
        return NAMESPACE_IRI;
    }

    private static String FULL_IRI(final String localName) {
        return NAMESPACE + localName;
    }

    // *****************
    // All the Classes.
    // *****************

    /**
     * A person (alive, dead, undead, or fictional).
     *
     * This term provides multilingual descriptions, with [6] labels in languages [NoLocale, de, en, es, fr, it], but [5] comments in languages [NoLocale, de, es, fr, it] (so the difference is only between English and NoLocale, which we consider the same).
     */
    public static final VocabTerm Person = new VocabTermImpl(FULL_IRI("Person"), true)
        .addLabelNoLanguage("Person")
        .addLabel("Person", "de")
        .addLabel("Person", "en")
        .addLabel("Persona", "es")
        .addLabel("La personne", "fr")
        .addLabel("Persona", "it")
        .addComment("Une personne (vivante, morte, mort-vivant ou fictive).", "fr")
        .addComment("Eine Person (lebendig, tot, untot oder fiktiv).", "de")
        .addComment("Una persona (viva, muerta, no muerta o ficticia).", "es")
        .addComment("Una persona (viva, morta, non morta o immaginaria).", "it")
        .addCommentNoLanguage("A person (alive, dead, undead, or fictional).");


    // *******************
    // All the Properties.
    // *******************

    /**
     * Given name. In the U.S., the first name of a Person. This can be used along with familyName instead of the name property.
     *
     * This term provides multilingual descriptions, with [6] labels in languages [NoLocale, de, en, es, fr, it], but [5] comments in languages [NoLocale, de, es, fr, it] (so the difference is only between English and NoLocale, which we consider the same).
     */
    public static final VocabTerm givenName = new VocabTermImpl(FULL_IRI("givenName"), true)
        .addLabelNoLanguage("givenName")
        .addLabel("Vorname", "de")
        .addLabel("Given Name", "en")
        .addLabel("Nombre de pila", "es")
        .addLabel("Prénom", "fr")
        .addLabel("Nome di battesimo", "it")
        .addComment("Prénom. Aux États-Unis, le prénom d’une personne. Ceci peut être utilisé avec familyName au lieu de la propriété name.", "fr")
        .addComment("Vorname. In den USA der Vorname einer Person. Dies kann zusammen mit familyName anstelle der Eigenschaft name verwendet werden.", "de")
        .addComment("Nombre de pila. En los EE. UU., El primer nombre de una persona. Esto se puede usar junto con familyName en lugar de la propiedad name.", "es")
        .addComment("Nome di battesimo. Negli Stati Uniti, il primo nome di una persona. Questo può essere usato insieme a familyName al posto della proprietà name.", "it")
        .addCommentNoLanguage("Given name. In the U.S., the first name of a Person. This can be used along with familyName instead of the name property.");

    /**
     * Family name. In the U.S., the last name of an Person. This can be used along with givenName instead of the name property.
     *
     * This term provides multilingual descriptions, with [6] labels in languages [NoLocale, de, en, es, fr, it], but [5] comments in languages [NoLocale, de, es, fr, it] (so the difference is only between English and NoLocale, which we consider the same).
     */
    public static final VocabTerm familyName = new VocabTermImpl(FULL_IRI("familyName"), true)
        .addLabelNoLanguage("familyName")
        .addLabel("Nachname", "de")
        .addLabel("Family Name", "en")
        .addLabel("Apellido", "es")
        .addLabel("Nom de famille", "fr")
        .addLabel("Cognome", "it")
        .addComment("Nom de famille. Aux États-Unis, le nom de famille d’une personne. Ceci peut être utilisé avec GivenName au lieu de la propriété name.", "fr")
        .addComment("Nachname. In den USA der Nachname einer Person. Dies kann zusammen mit givenName anstelle der Eigenschaft name verwendet werden.", "de")
        .addComment("Apellido. En los EE.UU., el apellido de una persona. Esto se puede usar junto con givenName en lugar de la propiedad name.", "es")
        .addComment("Cognome. Negli Stati Uniti, il cognome di una persona. Questo può essere usato insieme a givenName al posto della proprietà name.", "it")
        .addCommentNoLanguage("Family name. In the U.S., the last name of an Person. This can be used along with givenName instead of the name property.");
 }