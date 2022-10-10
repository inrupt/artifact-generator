# Generated source-code documentation

The Artifact Generator will always attempt to generate as much helpful
documentation as it can for each individual vocabulary term - for example
generating JavaDoc for Java artifacts, or JSDoc for JavaScript artifacts.

This can be extremely helpful for developers working with new or unfamiliar
vocabularies, as by simply importing an artifact, the developer's IDE will
automatically provide helpful auto-completion and documentation.

The Artifact Generator generates this documentation by looking for specific
Linked Data metadata that is commonly associated with vocabulary terms. For
example, it's generally considered best practice to always provide
human-readable labels and comments for terms, using the properties `rdfs:label`
and `rdfs:comment` respectively.

Often it's even more helpful to provide these labels and comments in multiple
languages (like French, Spanish, or German), and so the Artifact Generator
can also provide a description of which languages a term's labels and
comments are provided.

This example shows the JSDoc generated for the DCAT term `Catalog` (DCAT is
a vocabulary for describing data catalogs published on the Web, and it's
vocabulary terms are described in multiple languages):

```javascript
  /**
   * A curated collection of metadata about resources (e.g., datasets and data services in the context of a data catalog).
   *
   * This term has [8] labels and comments, in the languages [ar, cs, da, el, es, fr, it, ja].
   *
   * Defined by the vocabulary: http://www.w3.org/TR/vocab-dcat/
   */
  Catalog: _NS("Catalog"),
```

## Other useful metadata

The Artifact Generator can look for other common vocabulary term metadata,
such as `rdfs:seeAlso` to indicate something of interest that is related to
this term, or `rdfs:isDefinedBy` to indicate the vocabulary within which this
term is defined (which can be useful, as individual vocabulary terms may be
looked up in complete isolation (since they can always be de-referenced, since
they are each defined as HTTP IRIs)).

This example shows the JSDoc generated for the vCard term `hasNickname`:

```javascript
  /**
   * Used to support property parameters for the nickname data property
   *
   * See also:
   *  - http://www.w3.org/2006/vcard/ns#nickname
   *
   * Defined by the vocabulary: http://www.w3.org/2006/vcard/ns
   */
  hasNickname: _NS("hasNickname"),
```

[Back to the homepage](../README.md)
