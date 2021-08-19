# Generated directory structure

The Artifact Generator is capable of generating a very large number of
artifacts during a single execution, e.g., artifacts for multiple different
programming languages, with each language providing artifacts supporting
multiple different programming-language-specific RDF libraries, as well as
string literal artifacts, and possibly `VocabTerm` artifacts.

It can also generate not just source-code artifacts, but also formal
documentation resources, such as an entire website documenting a single
vocabulary using [Widoco] (https://github.com/dgarijo/Widoco) (currently
this capability is only supported when generating from a single vocabulary
using the Command Line Interface (CLI)).

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

## Generated resources

The next sub-directory contains collections of generated resources, such as
source-code, documentation, and possibly other resources later.

The main sub-directory here is `SourceCodeArtifacts`, which collects all the
source-code associated with potentially many different programming languages, 
such as Java, JavaScript, C#, Python, Fortran(!), etc.

## Inside the `./Generated/SourceCodeArtifacts` directory

Inside the `SourceCodeArtifacts` directory are sub-directories named to reflect
the ['form of artifact'](./multiple-forms-of-artifact.md) being generated,
typically in specific programming languages.

The following example shows generation of Java, JavaScript, and TypeScript
artifacts, and where we have multiple [forms](./multiple-forms-of-artifact.md)
of each artifact in each programming language:

```bash
./Generated/SourceCodeArtifacts/
    Java/
    Java-CommonsRdf-ServiceLoader/
    Java-CommonsRdf-SimpleRdf/
    JavaScript-rdflib/
    TypeScript/
    TypeScript-StringLiteral/
    TypeScript-rdfjs-RdfDataFactory/
    TypeScript-VocabTerm/
    TypeScript-VocabTerm-rdfjs-RdfDataFactory/
```

## Inside each generated source-code artifact directory

Finally, inside each generated source-code artifact directory we store all the
programming-language-and-(possibly)-RDF-library-specific project bundling
information and files, and a generated `README.md`.

## Finally, the `/GeneratedVocab` directory

And finally, inside each of these directories we'll have a
`/GeneratedVocab` sub-directory to contain all the individual generated
vocabulary classes that this artifact bundles together.

So for example, for our TypeScript example above, we may have configured the
bundling of the vocabularies FOAF, vCard and Activity Streams (AS). This would
result in the generation of a TypeScript source-code file for each vocabulary,
like this:

```bash
./Generated/SourceCodeArtifacts/TypeScript/GeneratedVocab/
  AS.ts
  FOAF.ts
  VCARD.ts
```

[Back to the homepage](../README.md)
