For example, the generator might produce the following Javascript constant to
represent the `Person` class from Schema.org (i.e. `https://schema.org/Person`):
```javascript
    /**
     * A person (alive, dead, undead, or fictional).
     */
    Person: new LitVocabTerm(_NS('Person'), localStorage, true)
      .addLabel('en', `Person`)
      .addComment('en', `A person (alive, dead, undead, or fictional).`),
```

NOTE: This example shows that we've generated a Javascript `Person` object that
also provides access to the Label and Comment as defined by Schema.org. We've
also used the Comment value as the JSDoc for this `Person` object, meaning
users of this artifact will have helpful documentation available directly in
their IDE.    

The generator can create source-code for Classes and Properties found in
existing online vocabularies today (e.g. Schema.org, FOAF, VCard, GConsent,
etc.), or from local vocabularies (for example local Turtle files).

It also allows aspects of vocabulary terms (e.g. a term's `rdfs:label`, or 
`rdfs:comment`) to be overridden with new values (e.g. if you don't like
Schema.org's label for the property `givenName`, then you can define your own
value of `Given name` to override it). Or you may wish to include new
translations for existing labels or comments (e.g. to provide a Spanish
`rdfs:comment` for Schema.org's `Person` class, say **'Una persona (viva,
muerta, no muerta o ficticia)'**).

Another useful feature is the ability to select only specific terms from an
existing vocabulary. For instance, Schema.org today defines almost 2,000 terms.
But perhaps you only want to use 20 of those terms in your application. To do
this, we can simply define our own local vocabulary that lists those 20 terms
we want, and specify that when running our generator using the
`--termSelectionResource` command-line argument (see examples below).

Putting this all together, we can very easily create our own vocabularies in
any standard W3C serialization of RDF (e.g. Turtle, JSON-LD, N-Triples, etc.),
and immediately allow our developers use the terms in those vocabularies
directly in their development IDE's (with full code-completion and live
JSDoc/JavaDoc). 

And we can easily reuse existing vocabularies, or just the parts of those
vocabularies we wish to use, while also being able to easily extend them, for
example to add our own translations, or override some, or all, of their
existing `labels` or `comments`.

Ultimately, perhaps the biggest benefit of the artifact generator is that it
allows us easily define our own vocabularies in interoperable RDF that can be
easily used, shared and evolved by our existing development teams.

[Back to the homepage](../README.md)