
# Ontology Artifact Generator

Builds deployable artifacts for various programming languages (e.g. Node modules, or Java JARs, etc.) that contain source code files defining programming-language-specific constants for RDF vocabulary terms (i.e. Classes and Properties) found in specified ontologies (e.g. Schema.org, FOAF, VCard, GConsent, etc., or from local Turtle files).

It also allows aspects of vocab terms (e.g. a term's rdfs:label, or rdfs:comment) to be overridden with new values (e.g. if you don't like Schema.org's label for the property 'givenName', then you can define your own value of 'Given name' to override it), or to include new translations for existing term labels or comments (e.g. to provide a Spanish rdfs:comment for Schema.org's Person class of 'Una persona (viva, muerta, no muerta o ficticia)').


# How to build

```shell
npm install
```

# How to Run

```shell
node index.ts --input <ontology files> --subjects <subjects only ontology file> --mversion <version number>
```

The output is a Node Module containing a Javascript file with constants defined for the RDF terms found in the vocabulary specified by the 'input' flag. This module is located inside the **./generated** folder by default.

### Examles:

Here are some examples of running the tool:

Local ontology file

```shell
node index.ts --input node./vocabs/schema.ttl
```

Multiple local ontology files

```shell
node index.ts --input ./vocabs/schema.ttl ./vocabs/schema-inrupt-ext.ttl
```

Generate vocab terms from only a specified vocabulary (here we provide the full Schema.org vocab as input, but we only want generated constants from the terms mentioned in the 'schema-inrupt-ext.ttl' vocab).
```shell
node index.ts --input ./vocabs/schema.ttl --vocabTermsFrom ./vocabs/schema-inrupt-ext.ttl
```

Providing IRI's for remote vocabularies
```shell
node index.ts --input  http://schema.org/Person.ttl https://schema.org/Restaurant.ttl https://schema.org/Review.ttl
```

Specifing a version for the output module
```shell
node index.ts --input "http://www.w3.org/2002/07/owl#" ./vocabs/owl-inrupt-ext.ttl --artifact-version 1.0.1
```

Using short-form alaises for the command-line flags
```shell
node index.ts --i ./vocabs/schema.ttl --vtf ./vocabs/schema-inrupt-ext.ttl --av 1.0.6
```



# How to Deploy the module to an npm registry

To build and publish the node module run the following command:

```shell
./deploy.sh
```

**Note**: This will *only* publish to the NPM registry at http://localhost:4873 (I'm running Verdaccio on my local 
machine). You'll need to edit the script if you want to publish to another location.

Make sure that you have incremented the version of the module so that it can published.


# Creating extension file

The idea behind extension files is to allow us 'extend' vocabularies that are alread ypublished, or that we don't control. For instance, we may want to extend an existing vocabulary to add our own translations for the labels and comments of terms in that existing vocabulary.

For some examples see: 

- [./vocabs/schema-inrupt-ext.tt](./vocabs/schema-inrupt-ext.ttl)
- [./vocabs/vcard-inrupt-ext.tt](./vocabs/vcard-inrupt-ext.ttl)
- [./vocabs/owl-inrupt-ext.tt](./vocabs/owl-inrupt-ext.ttl)
