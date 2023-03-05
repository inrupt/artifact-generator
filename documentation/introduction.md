# Introduction

The Artifact Generator can create source-code for Classes and Properties found
in existing online vocabularies today (e.g., Schema.org, FOAF, VCard,
GConsent, etc.), or from local vocabularies (for example local Turtle files).

It also allows aspects of vocabulary terms (e.g., a term's `rdfs:label`, or
`rdfs:comment`) to be overridden with new values (e.g., if you don't like
Schema.org's label for the property `givenName`, then you can define your own
value of `Given name` to override it). Or you may wish to include new
translations for existing labels or comments (e.g., to provide a Spanish
`rdfs:comment` for Schema.org's `Person` class, say **'Una persona (viva,
muerta, no muerta o ficticia)'**).

Another useful feature is the ability to select only specific terms from an
existing vocabulary. For instance, Schema.org today defines almost 2,000 terms.
But perhaps you only want to use 20 of those terms in your application. To do
this, we can simply define our own local vocabulary that lists those 20 terms
we want, and specify that when running our generator using the
`--termSelectionResource` command-line argument (see examples below).

Putting this all together, we can very easily create our own vocabularies in
any standard W3C serialization of Linked Data (e.g., Turtle, JSON-LD,
N-Triples, etc.), and immediately allow our developers use the terms in those
vocabularies directly in their development IDE's (with full code-completion
and live JSDoc/JavaDoc).

And we can easily reuse existing vocabularies, or just the parts of those
vocabularies we wish to use, while also being able to easily extend them, for
example to add our own translations, or override some, or all, of their
existing `labels` or `comments`.

Ultimately, perhaps the biggest benefit of the Artifact Generator is that it
allows us easily define our own vocabularies in W3C standardized,
interoperable Linked Data that can be easily used, shared, and evolved by
multiple development teams, often working in completely different programming
languages.

[Back to the homepage](../README.md)
