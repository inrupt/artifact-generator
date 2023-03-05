# The relationship between generated source-code artifacts and Linked Data vocabularies

Source-code artifacts (e.g., Java JARs, Node.js modules, C# assemblies, etc.)
can be generated from individual Linked Data vocabularies, or from collections
of multiple Linked Data vocabularies. For example, in the case of Java, a single
generated Java JAR may contain multiple Java Classes, with each Class
representing the 'terms' (i.e., the Classes, Properties and Constants)
described within a single Linked Data vocabulary. In other words, each Java
Class within that JAR would define static constants for each of the defined
terms within a corresponding Linked Data vocabulary.

Developers often need to work with terms from multiple vocabularies, which is
why for convenience the Artifact Generator can bundle classes generated from
multiple vocabularies into a single artifact. In this way, a developer can
depend on a single artifact and import just the specific vocabulary classes
they need to work with. For instance, Inrupt bundles over 40 common Linked Data
vocabularies into a single artifact, and it bundles all Solid vocabularies
into another single artifact, and all Inrupt vocabularies into yet another.

Perhaps the single most important, and widely used, vocabulary today is
Schema.org, from Google, Microsoft, Yahoo and Yandex. The official Linked Data
for Schema.org is defined here:
`https://schema.org/version/latest/schemaorg-current-http.ttl`.

Any individual or company is completely free to use the Artifact Generator
(or any other generator!) to generate their own source-code artifacts
to represent the terms defined in Schema.org. And of course, they are also
free to use the Artifact Generator to generate source-code artifacts (e.g.,
a Java JAR containing Java classes, or an `npm` package containing JavaScript
classes) that represents any available Linked Data vocabularies, including their
own purely internal and/or proprietary vocabularies.

So anyone is completely free to define their own Linked Data vocabularies.
Likewise, anyone is completely free to run the Artifact Generator against any
available Linked Data vocabulary, meaning it's perfectly fine to have a
multitude of generated artifacts claiming to represent the terms from anyone
else's Linked Data vocabulary.

In other words, it's important to remember that it's not necessary to control
an Linked Data vocabulary in order to generate useful source-code artifacts from
it.

For instance, IBM could choose to generate their own JavaScript module from
the Schema.org vocabulary, and publish their generated module for others to
depend on as follows:
```json
dependencies: {
  "@ibm/generated-from-schema.org": "^1.5.3"
}
```

...whereas Accenture (a major competitor to IBM) are completely free to also
publish their generated JavaScript (or Java, or C#, or Scala, etc.) source
code artifacts representing exactly the same Schema.org vocabulary, e.g.:
```json
dependencies: {
  "@accenture/generated-from-schema.org-but-different-than-IBM-version": "^0.0.9"
}
```

The Artifact Generator allows each of these entities to configure their
generated artifacts as they see fit, e.g., perhaps IBM augments their version
with translations for various languages (that Schema.org does not provide
today), or Accenture augments their version with references to related
resources (e.g., via `rdfs:seeAlso` references) to similar terms in existing
Accenture glossaries or data dictionaries.

Of course, individuals or companies are always completely free to choose
between reusing existing generated artifacts from entities that they trust,
or generating their own internal-only artifacts. Or they could choose to
create their own programming-language-specific Classes containing constants
for the terms in existing common Linked Data vocabularies (but why would anyone
choose to do that... :) ?).

[Back to the homepage](../README.md)
