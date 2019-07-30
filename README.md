
# Ontology Artifact Generator

Builds deployable artifacts for various programming languages (e.g. Node modules, or Java JARs, etc.) that contain source code files defining programming-language-specific constants for RDF vocabulary terms (i.e. Classes and Properties) found in specified ontologies (e.g. Schema.org, FOAF, VCard, GConsent, etc., or from local Turtle files).

It also allows aspects of vocab terms (e.g. a term's rdfs:label, or rdfs:comment) to be overridden with new values (e.g. if you don't like Schema.org's label for the property 'givenName', then you can define your own value of 'Given name' to override it), or to include new translations for existing term labels or comments (e.g. to provide a Spanish rdfs:comment for Schema.org's Person class of 'Una persona (viva, muerta, no muerta o ficticia)').

Another useful feature is the ability to select only specific terms from an existing vocabulary. For instance, Schema.org today defines alomost 2,000 terms. But perhaps you only want to use 20 of those terms in your application. (To do this, we simply define our own vocabulary that simply lists those 20 terms we do want, and reference that using the `--vocabTermsFrom` command line argument, see examples below).

Putting this all together, we can very easily create our own vocabularies in W3C standard RDF, and quickly have our developers working with those vocabularies directly in the development IDE's. Or we easily reuse existing vocabularies and selectively extend them to add our own translations, or override their existing `labels` or `comments`.

# How to build

```shell
npm set registry https://verdaccio.inrupt.com
npm install
```

Or to install globally (so you can run the generator from any directory):
```shell
npm set registry https://verdaccio.inrupt.com
npm -g install @lit/artifact-generator

lit-artifact-generator --help
```


# How to run

```shell
node index.js --input <ontology files>
```

The output is a Node Module containing a Javascript file with constants defined for the RDF terms found in the vocabulary specified by the 'input' flag. This module is located inside the **./generated** folder by default.

## Examples

Here are some examples of running the tool:

Local ontology file

```shell
node index.js --input ./example/PetRocks.ttl
```

Remote ontology file

```shell
node index.js --input https://schema.org/version/latest/schema.ttl
```

Multiple local ontology files:

```shell
node index.js --input ./example/Skydiving.ttl ./example/PetRocks.ttl
```

Selecting only specific terms from a vocabulary.
Here we provide the full Schema.org vocab as input, but we only want constants for the handful of terms in the 'just-the-terms-we-want-from-schema-dot-org.ttl' vocab):
```shell
node index.js --input https://schema.org/version/latest/schema.ttl --vocabTermsFrom ./example/just-the-terms-we-want-from-schema-dot-org.ttl
```

Collecting multiple (remote in this example) vocabularies into one bundled vocab artifact:
```shell
node index.js --input  http://schema.org/Person.ttl https://schema.org/Restaurant.ttl https://schema.org/Review.ttl
```

Providing the version for the output module:
```shell
node index.js --input http://www.w3.org/2002/07/owl# ./vocabs/owl-inrupt-ext.ttl --artifactVersion 1.0.1
```

Specifing a custom prefix for the output module name:
```shell
node index.js --input ./vocabs/schema.ttl --moduleNamePrefix my-company-prefix-
```

Specifing a custom NPM registry to where the output module will be published:
```shell
node index.js --input ./vocabs/schema.ttl --npmRegistry http://my.company.registry/npm/
```

Using short-form alaises for the command-line flags:
```shell
node index.js --i ./vocabs/schema.ttl --vtf ./vocabs/schema-inrupt-ext.ttl --av 1.0.6 --mnp my-company-prefix-
```

Providing the version for the LIT Vocab Term dependency (this is the library that provides a simple class to represent a vocabulary term (such as a Class, a Property or a Text string)):

*NOTE:* If you're using a local copy of this library, you can also use the form `file:/my_local_copy/lit-vocab-term` to pick up that local copy.
```shell
node index.js --i ./vocabs/schema.ttl --litVocabTermVersion ^1.0.10
```


For help run:
```shell
node index.js --help
```

# How to build and deploy the module to an npm registry

When you run the tool you will be prompted with questions that will quide you through the process. Here are the list of questions:

1. Artifact name (Enter for default)
2. Artifact author (Enter for default)
3. Current artifact version in registry is x.x.x. Do you want to bump the version?
   - patch
   - minor
   - major
   - no
4. Do you want to publish {artifact name} to the registry {registry}? (y/N)

Here is an example of what this will look like on the output:
```shell
[lit-artifact-generator-js]$ node index.js --input ./vocabs/schema.ttl --vocabTermsFrom ./vocabs/schema-inrupt-ext.ttl
? Artifact name ... @lit/generated-vocab-schema-inrupt-ext
? Artifact author ... Jarlath Holleran
Created artifact: [./generated/index.js]
Created artifact: [./generated/package.json]
? Current artifact version in registry is 1.0.1. Do you want to bump the version? patch
Artifact (@lit/generated-vocab-schema-inrupt-ext) version has been updated (patch).
? Do you want to publish @lit/generated-vocab-schema-inrupt-ext to the registry http://localhost:4873? Yes
npm notice 
npm notice 📦  @lit/generated-vocab-schema-inrupt-ext@1.0.2
npm notice === Tarball Contents === 
npm notice 423B   package.json
npm notice 20.8kB index.js    
npm notice === Tarball Details === 
npm notice name:          @lit/generated-vocab-schema-inrupt-ext  
npm notice version:       1.0.2                                   
npm notice package size:  4.7 kB                                  
npm notice unpacked size: 21.2 kB                                 
npm notice shasum:        3431561c8ed20e7c7d09e49744849fa23ba2999e
npm notice integrity:     sha512-f5AUW/27xgFvk[...]Fwn+0somMnABw==
npm notice total files:   2                                       
npm notice 
Artifact (@lit/generated-vocab-schema-inrupt-ext) has been published to http://localhost:4873.


```

**Note**: By default this will *only* publish to the NPM registry at http://localhost:4873 (I'm running Verdaccio on my local 
machine). You can configure the registry on the command line arguments (npmRegistry).

**Note**: Make sure that you have incremented the version of the module so that it can published.


# Creating extension file

The idea behind extension files is to allow us 'extend' vocabularies that are already published, or that we don't control. For instance, we may want to extend an existing vocabulary to add our own translations for the labels and comments of terms in that existing vocabulary.

For some examples see: 

- [./vocabs/schema-inrupt-ext.tt](./vocabs/schema-inrupt-ext.ttl)
- [./vocabs/vcard-inrupt-ext.tt](./vocabs/vcard-inrupt-ext.ttl)
- [./vocabs/owl-inrupt-ext.tt](./vocabs/owl-inrupt-ext.ttl)
