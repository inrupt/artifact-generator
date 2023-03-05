/**
 * Generated by the artifact generator [@inrupt/artifact-generator], version [2.0.0]
 * as part of artifact: [generated-vocab-TEST], version: [0.1.5-SNAPSHOT]
 * on 'Sunday, November 27, 2022 9:04 AM'.
 *
 * Vocabulary built from vocab list file: [./test/resources/yamlConfig/vocab-rdf-library-java-rdf4j.yml].
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
package com.inrupt.generated.vocab.lit.test;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Namespace;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.SimpleNamespace;
import org.eclipse.rdf4j.model.impl.SimpleValueFactory;

/**
 * Inrupt extension to Schema.org terms.
 *
 * Namespace IRI: [https://schema.org/]
 */
public class SCHEMA_INRUPT_EXT {
    public static final String PREFIX = "schema_inrupt_ext";
    public static final String NAMESPACE = "https://schema.org/";

    public static final ValueFactory valueFactory = SimpleValueFactory.getInstance();

    public static final IRI NAMESPACE_IRI = valueFactory.createIRI("https://schema.org/");
    public static final Namespace NS = new SimpleNamespace(PREFIX, NAMESPACE);

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
    public static final IRI Person = valueFactory.createIRI(FULL_IRI("Person"));


    // *******************
    // All the Properties.
    // *******************

    /**
     * Given name. In the U.S., the first name of a Person. This can be used along with familyName instead of the name property.
     *
     * This term provides multilingual descriptions, with [6] labels in languages [NoLocale, de, en, es, fr, it], but [5] comments in languages [NoLocale, de, es, fr, it] (so the difference is only between English and NoLocale, which we consider the same).
     */
    public static final IRI givenName = valueFactory.createIRI(FULL_IRI("givenName"));

    /**
     * Family name. In the U.S., the last name of an Person. This can be used along with givenName instead of the name property.
     *
     * This term provides multilingual descriptions, with [6] labels in languages [NoLocale, de, en, es, fr, it], but [5] comments in languages [NoLocale, de, es, fr, it] (so the difference is only between English and NoLocale, which we consider the same).
     */
    public static final IRI familyName = valueFactory.createIRI(FULL_IRI("familyName"));
 }