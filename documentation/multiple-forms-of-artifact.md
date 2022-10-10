# Different forms of generated artifact

The Artifact Generator can generate many forms of artifacts, ranging from
simple that only provide vocabulary term identifiers as string literals,
through forms that provide those identifiers as IRI types from commonly used
RDF libraries, all the way to forms that provide full programmatic access to the
metadata associated with individual vocabulary terms (that may have been
helpfully provided by the vocabulary creator).

In the following sections, we show the Artifact Generator producing constants
in either JavaScript or Java, in each of the various 'forms'.

## Generating simple string constants for vocabulary terms

The simplest form of constant to represent a vocabulary term is just a
standard string, whose value is the term's full IRI.

For example, the `Person` term from the common FOAF vocabulary could be
represented in JavaScript as follows:

```javascript
const FOAF = {
    Person: "http://xmlns.com/foaf/0.1/Person",
    :
    :
};
```

**Note**: using string literals when actually referring to IRIs is generally
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

## Generating constants that provide access to term metadata

In many situations it can be extremely useful to have programmatic access to
the metadata associated with individual vocabulary terms (assuming terms
**_have_** useful metadata associated with them in the first place, which is
most definitely a best practice for any vocabulary creator to adopt!).

For instance, it might be useful to be able to link back to the vocabulary
within which a term is defined (via `rdfs:isDefinedBy` metadata), or to
follow links to concepts that relate to the term (concepts that might be
defined anywhere else on the web, like Wikipedia (or its RDF equivalents,
[DBPedia](https://www.dbpedia.org/) or 
[Wikidata](https://www.wikidata.org/wiki/Wikidata:Main_Page)) (via
`rdfs:seeAlso` metadata), or to see examples of that term's usage (via
`void:exampleResource`), or to link to equivalent terms from other
vocabularies (via `owl:sameAs`), etc.

But in particular, it can be extremely useful if a UI can be driven from
the metadata intended to describe the terms in a vocabulary to humans (e.g.,
`rdfs:label`, `rdfs:comment`, `dcterms:description`, etc.). Since we use
vocabularies to describe the terminology, concepts, and messages related
to our specific problem domains in the first place, it also makes sense to
use the metadata associated directly with those vocabulary terms from the
'authoritative source' (i.e., the creators and contributors to the vocabulary 
itself). This means we don't have to duplicate those descriptions in our UI
labels, error messages, tooltip text, help messages, etc.

Also, the ability for RDF to very easily provide descriptions in multiple
human languages (like French, German, Spanish, etc., by simply using
internationally standarized language tags, like "fr", "de" and "es"
respectively) means when creating our own vocabularies we can easily provide
all our internationalized UI descriptions directly in our RDF
vocabularies too - thereby making them directly available not only to all our
own applications, but also for anyone we share our vocabularies with. 

For example, if you wanted to develop a web application for managing Pet Rock
collections, then it could be really useful if you could drive much of your UI
from the metadata provided in the 'authoritative' Pet Rock vocabulary that
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
