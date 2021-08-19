# Different forms of generated artifact

The Artifact Generator can generate many forms of artifacts, ranging from
simple that only provide vocabulary term identifiers as string literals,
through forms that provide those identifiers as IRI types from commonly used
RDF libraries, all the way to forms that provide full access to the meta-data
associated with individual vocabulary terms that may have been helpfully
provided by the vocabulary creator.

In the following sections, we show the Artifact Generator producing constants
in either JavaScript or Java, in each of the various 'forms'.

## Generating simple string constants for vocabulary terms

The simplest form of constant to represent a vocabulary term is just a
standard string whose value is the term's full IRI.

For example, the `Person` term from the common FOAF vocabulary could be
represented in JavaScript as follows:

```javascript
const FOAF = {
    Person: "http://xmlns.com/foaf/0.1/Person",
    :
    :
};
```

Note: using string literals when actually referring to IRIs is generally
frowned about when working with RDF, since RDF is very strict about the
difference between strings and IRIs. This is why most RDF libraries provide
their own explicit types to represent IRIs, as strings are too 'generic' a
type, and using them for IRI values can lead to problems that are difficult to
debug later.

We only provide these string-literal artifacts because they are the simplest
form to start working with (since the generated artifacts will have no
external dependencies). But in general when working with RDF, we highly
recommend using the more correct IRI types (such as those defined in the
[RDF/JS Data Model types](https://www.npmjs.com/package/@rdfjs/types)
when working with TypeScript), which we describe next.

## Generating RDF-library-specific IRI-type constants

As described above, when working with RDF it's generally preferable to be
very explicit with your types. IRIs are fundamental to RDF, which is why all
RDF libraries, regardless of programming language, will always work with,
and generally provide their own, explicit IRI types.

Therefore, the Artifact Generator comes with templates to generate source-code
constants for vocabulary terms using the IRI types of common RDF libraries,
such as CommonsRDF, or RDF4J for Java, or RDF/JS for JavaScript and
TypeScript.

This example shows a snippet of the Java code generated for the FOAF `Person`
term using the CommonsRDF `IRI` type:

```java
import org.apache.commons.rdf.api.IRI;

/**
 * Friend of a friend, v0.99
 */
public class FOAF implements Vocab {
    :
    :
    /**
     * A person.
     *
     * Defined by the vocabulary: http://xmlns.com/foaf/0.1/
     */
    public static final IRI Person = valueFactory.createIRI(FULL_IRI("Person"));
    :
    :
}
```

## Generating constants that provide access to term meta-data

In many situations (particularly with User Interfaces (UI)), it can be very
useful if the UI can be driven from meta-data described in the RDF
vocabularies that we use to describe the terms, concepts, and messages related
to our specific problem domain.

For example, if you wanted to develop a web application for managing Pet Rock
collections, then it could be really useful if you could drive much of your UI
from the meta-data provided in the 'authoritative' Pet Rock vocabulary that
you wish to use for your application.

This example shows a generated JavaScript `PET_ROCK` object that contains a
constant of type `VocabTerm` that provides easy programmatic access to any the
labels and comments defined originally in the Pet Rock RDF vocabulary.

```javascript
/**
 * Vocabulary for Pet Rock collectors, including terms for describing the characteristics of Pet Rocks...
 */
const PET_ROCK = {
    /**
     * How wonderfully shiny a rock is.
     *
     * This term has [2] labels and comments, in the languages [en, es].
     */
    shininess: new VocabTerm(
      _NS("shininess"),
      _DataFactory,
      getLocalStore(),
      false
    )
      .addLabel(`Shininess`, "en")
      .addLabel(`Brillo`, "es")
      .addComment(`How wonderfully shiny a rock is.`, "en")
      .addComment(`Qué maravillosamente brillante es una roca.`, "es"),
    :
    :
}
```

You'll see further detailed examples of `VocabTerm` usage in it's repository
for Java [here](https://github.com/inrupt/solid-common-vocab-java), and
JavaScript [here](https://github.com/inrupt/solid-common-vocab-js). 

[Back to the homepage](../README.md)
