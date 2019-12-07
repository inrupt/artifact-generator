# Advanced configuration

## CLI Examples

Here are some examples of running the tool using the Command Line Interface (CLI) options:

Local vocabulary file

```shell
node index.js generate --inputResources ./example/PetRocks.ttl
```

Remote vocabulary file

```shell
node index.js generate --inputResources https://schema.org/version/latest/schema-snippet.ttl
```

Multiple local vocabulary files:

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

Specifing a custom NPM registry where the generated artifact will be published:
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

**Note**: By default this will *only* publish to the NPM registry at http://localhost:4873 (which is the default address for Verdaccio when running it on your local machine). You can configure the registry on the command line arguments `--npmRegistry`.

**Note**: The public NPM registry prohibits re-publication of an artifact under a version number that has been released previously. Before publishing an artifact, make sure that you have incremented the version of the module so that there is no conflict. Please note that it is actually a feature of Verdaccio to support `npm --force unpublish`, which makes it possible to override a previously published artifct. 

## <a id="yaml"/> Configuring options using the YAML file

Creating a YAML configuration file (simply using `node index.js init`) provides you much greater control over the artifacts you'd like to generate, and the vocabularies you want to work with

### Artifacts information

Each artifact to generate (e.g. Java JAR, NPM module, etc.) is configured individually as an entry in the `artifactToGenerate` list.

- Options shared across **all programming languages**:
  - Mandatory:
    - `programmingLanguage`: Supported values `Java`, `Javascript`
    - `artifactVersion`: The version of the generated artifact. Be aware that versioning policies differ depending on the package manager (e.g. NPM does not allow re-publication of the same version, while Maven does)
    - `litVocabTermVersion`: The version of the LIT Vocab Term library (e.g. https://github.com/inrupt/lit-vocab-term-js for Javascript, https://github.com/pmcb55/lit-java/tree/master/lit-vocab-term for Java) upon which the generated vocabularies will depend
    - `artifactDirectoryName`: Name of the directory in which the artifacts are stored. This will be a sub-directory of the generation output directory.
    - `handlebarsTemplate`: Template used to generate the source files from the vocabulary data
    - `sourceFileExtension`: Extension added to the generated source files
  - Optional
    - `languageKeywordsToUnderscore`: List of terms defined by the vocabulary that are keywords of the target language, and which will generate corresponding constant names prefixed with an underscore to prevent compiler errors.'
    - `repository`: Artifact repository to which the artifacts may be published.
    - `gitRepository`: Address of the Git repository.
- **Language-specific** options
  - Javascript
    - `npmModuleScope`: useful for publication on NPM
  - Java
    - `javaPackageName`: Java package in which the classes for each generated vocabulary of the artifact are gathered

### Vocabulary information

Configuration for each individual vocabulary is provided as an object in the list `vocabList`:

- Mandatory:
  - `inputResources`: A list of resources, which can be any mixture of local RDF files (whose path may be absolute, or relative to the YAML file itself) or remote IRI's, from which a single vocabulary source file will be generated.
- Optional:
  - `nameAndPrefixOverride`: The name of the generated vocabulary class. For instance, if set to `foo`, the corresponding Java class will be `FOO.java`. If not set, the generator will look in the source RDF vocabulary for the `vann:preferredNamespacePrefix` property, and if it is not defined the generation will be interrupted.
  - `description`: A description of the vocabulary, that will be used as a comment describing the generated class
  - `termSelectionFile`: When using only a portion of a large vocabulary, this option specifies a second input vocabulary that defines the subset of terms that are to be generated from the `inputResources`. Moreover, it also enables adding custom information to a vocabulary you don't have control over (e.g. adding translations for existing labels or comments, or overriding existing values, or adding completely new terms, etc.). For examples, see:
    - [./vocabs/schema-inrupt-ext.tt](./vocabs/schema-inrupt-ext.ttl)
    - [./vocabs/vcard-inrupt-ext.tt](./vocabs/vcard-inrupt-ext.ttl)
    - [./vocabs/owl-inrupt-ext.tt](./vocabs/owl-inrupt-ext.ttl)

    [Back to the homepage](../README.md)