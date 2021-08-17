# Generated directory structure

The Artifact Generator is capable of generating a very large number of
artifacts during a single execution, e.g., artifacts for multiple different
programming languages, with each language providing an artifact supporting
multiple different programming-language-specific RDF libraries, as well as
string literal artifacts, and possibly `VocabTerm` artifacts.

It can also generate not just source-code artifacts, but also formal
documentation resources, such as an entire website documenting a single
vocabulary using [Widoco] (https://github.com/dgarijo/Widoco).

Therefore, the generated directory structure is highly organized to allow a
clean separation of all these various generated resources.

The directory structure is as follows:

```bash
./Generated/SourceCodeArtifacts/<PROGRAMMING_LANGUAGE>/GeneratedVocab/<SOME_VOCAB.extension>
./Generated/Widoco/ (optional - only generated if requested)
```

## Everything contained in `./Generated`

Each execution of the Artifact Generator is something that a developer will
often wish to run from the root of their current project, with the output
directory also just being the current root directory. Therefore, so as not to
pollute the developer's root directory, we always create a containing
`/Generated` directory inside the specified output directory.

The next sub-directory is generally the programming language, which could be
any number of languages, such as Java, JavaScript, C#, Python, Fortran, etc.
This sub-directory can also be named to reflect the
['form of artifact'](./multiple-forms-of-artifact.md) being generated in that
programming language.

The following example show generation of Java, JavaScript, and TypeScript
artifacts, and where we have multiple forms of each artifact in each
programming language:

```bash
./Generated/SourceCodeArtifacts/
    Java/
    Java-StringLiteral/
    Java-CommonsRdf-ServiceLoader/
    Java-SolidCommonVocab-Rdf4J/
    JavaScript/
    JavaScript-StringLiteral/
    TypeScript-rdfjs-RdfDataFactory/
    TypeScript-VocabTerm/
    TypeScript-VocabTerm-rdfjs-RdfDataFactory/
```

In each of these directories we store all the programming-language-specific
project bundling information and files, and a generated `README.md`. And then
inside each of these directories we'll have a `/GeneratedVocab` sub-directory
to contain all the individual generated vocabulary classes that this artifact
bundles together.

So for example, for our JavaScript example above, we may have bundled the
vocabularies FOAF, vCard and Activity Streams (AS):

```bash
./Generated/SourceCodeArtifacts/JavaScript/GeneratedVocab/
  AS.js
  FOAF.js
  VCARD.js
```

[Back to the homepage](../README.md)
