
# Ontology Artifact Generator

Builds deployable artifacts for various programming languages (e.g. NPM Node modules for Javascript, or JARs for Java, or assemblies for C#, etc.) that have source files defining programming-language-specific constants for RDF vocabulary terms. For example, our generator might produce the following Javascript constant to represent the Person class from Schema.org (i.e. `https://schema.org/Person`):
```
    /**
     * A person (alive, dead, undead, or fictional).
     */
    Person: new LitVocabTerm(_NS('Person'), localStorage, true)
      .addLabel('en', `Person`)
      .addComment('en', `A person (alive, dead, undead, or fictional).`),
```

The generator can create source-code for Classes and Properties found in existing online vocabularies today (e.g. Schema.org, FOAF, VCard, GConsent, etc.), or from local vocabularies (for example local Turtle files).

It also allows aspects of vocabulary terms (e.g. a term's rdfs:label, or rdfs:comment) to be overridden with new values (e.g. if you don't like Schema.org's label for the property `givenName`, then you can define your own value of `Given name` to override it). Or you may wish to include new translations for existing term labels or comments (e.g. to provide a Spanish rdfs:comment for Schema.org's Person class, say 'Una persona (viva, muerta, no muerta o ficticia)').

Another useful feature is the ability to select only specific terms from an existing vocabulary. For instance, Schema.org today defines almost 2,000 terms. But perhaps you only want to use 20 of those terms in your application. To do this, we can simply define our own local vocabulary that lists those 20 terms we want, and specify that when running our generator using the `--vocabTermsFrom` command-line argument (see examples below).

Putting this all together, we can very easily create our own vocabularies in any standard W3C serialization of RDF (e.g. Turtle, JSON-LD, N-Triples, etc.), and immediately allow our developers use the terms in those vocabularies directly in their development IDE's (with full code-completion and live JSDoc/JavaDoc). 

And we can easily reuse existing vocabularies, or just the parts of those vocabularies we wish to use, while also being able to easily extend them, for example to add our own translations, or override some, or all, of their existing `labels` or `comments`.

Ultimately, perhaps the biggest benefit of the artifact generator is that it allows us easily define our own vocabularies in interoperable RDF that can be easily used, shared and evolved by our existing development teams.

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

- To **generate** source code from a vocabulary:
```shell
node index.js generate --inputResources <ontology resources (e.g. local files, or remote IRI's)>
```

The output is a Node Module containing a Javascript file with constants defined for the RDF terms found in the vocabulary (or multiple vocabularies) specified by the 'inputResources' flag. This module is located inside the **./generated** folder by default.


- To **initialize** a YAML file that should be edited manually
```shell
node index.js init
```

The output is a YAML file (by default `./lit-vocab.yml`), within which options can be specified to generate artifacts in different languages (e.g. Java, Javascript, Typescript, etc.) from a list of vocabularies. 

## CLI Examples

Here are some examples of running the tool using the Command Line Interface (CLI) options:

Local ontology file

```shell
node index.js generate --inputResources ./example/PetRocks.ttl
```

Remote ontology file

```shell
node index.js generate --inputResources https://schema.org/version/latest/schema-snippet.ttl
```

Multiple local ontology files:

```shell
node index.js generate --inputResources ./example/Skydiving.ttl ./example/PetRocks.ttl
```

Selecting only specific terms from a vocabulary.
Here we provide the full Schema.org vocab as input, but we only want constants for the handful of terms in the 'just-the-terms-we-want-from-schema-dot-org.ttl' vocab):
```shell
node index.js generate --inputResources https://schema.org/version/latest/schema-snippet.ttl --vocabTermsFrom ./example/just-the-terms-we-want-from-schema-dot-org.ttl
```

Collecting multiple (remote in this example) vocabularies into one bundled vocab artifact:
```shell
node index.js generate --inputResources  http://schema.org/Person.ttl https://schema.org/Restaurant.ttl https://schema.org/Review.ttl
```

Providing the version for the output module:
```shell
node index.js generate --inputResources http://www.w3.org/2002/07/owl# ./vocabs/owl-inrupt-ext.ttl --artifactVersion 1.0.1
```

Specifing a custom prefix for the output module name:
```shell
node index.js generate --inputResources ./vocabs/schema-snippet.ttl --moduleNamePrefix my-company-prefix-
```

Specifing a custom NPM registry to where the output module will be published:
```shell
node index.js generate --inputResources ./vocabs/schema-snippet.ttl --npmRegistry http://my.company.registry/npm/
```

Using short-form alaises for the command-line flags:
```shell
node index.js generate --i ./vocabs/schema-snippet.ttl --vtf ./vocabs/schema-inrupt-ext.ttl --av 1.0.6 --mnp my-company-prefix-
```

Providing the version for the LIT Vocab Term dependency (this is the library that provides a simple class to represent a vocabulary term (such as a Class, a Property or a Text string)):

*NOTE:* If you're using a local copy of this library, you can also use the form `file:/my_local_copy/lit-vocab-term` to pick up that local copy.
```shell
node index.js generate --i ./vocabs/schema-snippet.ttl --litVocabTermVersion ^1.0.10
```

For help run:
```shell
node index.js --help
```

## Configuring options using the YAML file

Once you've created a YAML configuration file using `node index.js init`, you can add information about the artifacts you want to generate, and the vocabularies you want to use. 

### Artifacts information

Each artifact to generate (e.g. Java JAR, NPM module, etc.) is configured individually as an entry in the `artifactToGenerate` list.

- Options shared across **all programming languages**:
  - Mandatory:
    - `programmingLanguage`: Supported values `Java`, `Javascript`
    - `artifactVersion`: The version of the generated artifact. Be aware that versioning policies differ depending on the package manager (e.g. NPM does not allow re-publication of the same version, while maven does)
    - `litVocabTermVersion`: The version of the library upon which the generated vocabularies will depend
    - `artifactFolderName`: Name of the folder in which the artifacts are stored, child of the output folder of the generation process
    - `handlebarsTemplate`: Template used to generate the source files from the vocabulary data
    - `sourceFileExtension`: Extension added to the generated source files
  - Optional
    - `languageKeywordsToUnderscore`: List of terms defined by the vocabulary that are keywords of the target language, and which will generate corresponding constant names prefixed with an underscore to prevent compiler errors.'
    - `repository`: Artifact repository to which the artifacts may be published.
    - `gitRepository`: Address of the git repository.
- **Language-specific** options
  - Javascript
    - `npmModuleScope`: useful for publication on NPM
  - Java
    - `javaPackageName`: Package name shared by all the generated vocabularies of the artifact

### Vocabulary information

Information about each vocabulary is an object in the list `vocabList`.

- Mandatory:
  - `inputResources`: A list of resources, which can be any mixture of local RDF files (whose path may be absolute, or relative to the YAML file itself) or remote IRI's, from which a single vocabulary source file will be generated.
- Optional:
  - `nameAndPrefixOverride`: The name of the generated vocabulary. For instance, if set to `foo`, the corresponding Java class will be `FOO.java`. If not set, the generator will look in the source RDF vocabulary for the `vann:preferredNamespacePrefix` property, and if it is not defined it will propose a default based on the domain name. This defaut is composed of the complete domain name, excluding the country extension, e.g. `http://vocab.example.org/` would default to `vocab.example`.
  - `description`: A description of the vocabulary, that will be used as a comment describing the generated class
  - `termSelectionFile`: When using only a portion of a large vocabulary, this option uses a second input vocabulary that defines the subset of terms that are to be generated from the `inputResources`. Moreover, it also enables adding custom information to a vocabulary you don't have control on (e.g. adding translations for existing labels or comments, or overriding existing values, or adding completely new terms, etc.)

### Generating artifacts using the YAML file

Once you've edited your config file, you can use it to generate your artifacts: 

```shell
node index.js generate --vocabListFile <./path/to/the/yaml/file>
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
[lit-artifact-generator-js]$ node index.js generate --inputResources ./vocabs/schema-snippet.ttl --vocabTermsFrom ./vocabs/schema-inrupt-ext.ttl
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


# Debugging

The code uses the NPM `debug` package for reporting log information during operation. To turn on logging, simply set the `DEBUG` environment variable. For example, to see all logging for all artifact-generator operation, set:

`DEBUG=lit-artifact-generator*`

To only see logging for the `VocabGenerator` component, set:

`DEBUG=lit-artifact-generator:VocabGenerator`

To see logging for the entire operation (including dependencies that also use `debug`), set:

`DEBUG=*`

## IntelliJ

When running tests in IntelliJ, simply edit the 'Run/Debug Configurations' settings to add the appropriate `DEBUG=...` setting in the Environment Variables editbox.

