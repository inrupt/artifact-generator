/**
 * Generated by artifact generator [@inrupt/lit-artifact-generator], version [0.10.8]
 * as part of artifact: [generated-vocab-common-TEST], version: [3.2.1-SNAPSHOT]
 * on 'Wednesday, May 20, 2020 7:45 AM'.
 *
 * Vocabulary built from vocab list file: [./test/resources/packaging/vocab-list-dummy-commands.yml].
 */
package com.inrupt.testing;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Namespace;
import org.eclipse.rdf4j.model.impl.SimpleNamespace;
import org.eclipse.rdf4j.model.impl.SimpleValueFactory;

import com.inrupt.lit.vocab.LitVocab;
import com.inrupt.lit.vocab.LitVocabTerm;

/**
 */
public class SCHEMA implements LitVocab {
    public static final String PREFIX = "schema";
    public static final String NAMESPACE = "http://schema.org/";

    public static final IRI NAMESPACE_IRI = SimpleValueFactory.getInstance().createIRI("http://schema.org/");
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
     */
    public static final LitVocabTerm Person = new LitVocabTerm(FULL_IRI("Person"), true)
        .addLabelNoLanguage("Person")
        .addCommentNoLanguage("A person (alive, dead, undead, or fictional).");

    // *******************
    // All the Properties.
    // *******************

    /**
     * Given name. In the U.S., the first name of a Person. This can be used along with familyName instead of the name property.
     */
    public static final LitVocabTerm givenName = new LitVocabTerm(FULL_IRI("givenName"), true)
        .addLabelNoLanguage("givenName")
        .addCommentNoLanguage("Given name. In the U.S., the first name of a Person. This can be used along with familyName instead of the name property.");

    /**
     * Family name. In the U.S., the last name of an Person. This can be used along with givenName instead of the name property.
     */
    public static final LitVocabTerm familyName = new LitVocabTerm(FULL_IRI("familyName"), true)
        .addLabelNoLanguage("familyName")
        .addCommentNoLanguage("Family name. In the U.S., the last name of an Person. This can be used along with givenName instead of the name property.");

    /**
     * The country. For example, USA. You can also provide the two-letter <a href="http://en.wikipedia.org/wiki/ISO_3166-1">ISO 3166-1 alpha-2 country code</a>.
     */
    public static final LitVocabTerm addressCountry = new LitVocabTerm(FULL_IRI("addressCountry"), true)
        .addLabelNoLanguage("addressCountry")
        .addCommentNoLanguage("The country. For example, USA. You can also provide the two-letter <a href=\"http://en.wikipedia.org/wiki/ISO_3166-1\">ISO 3166-1 alpha-2 country code</a>.");

}