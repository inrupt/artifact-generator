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

# Build and deploy the module to an npm registry

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

## <a id="yaml"/> Configuring options using the YAML file

Once you've created a YAML configuration file using `node index.js init`, you can add information about the artifacts you want to generate, and the vocabularies you want to use. 

### Artifacts information

Each artifact to generate (e.g. Java JAR, NPM module, etc.) is configured individually as an entry in the `artifactToGenerate` list.

- Options shared across **all programming languages**:
  - Mandatory:
    - `programmingLanguage`: Supported values `Java`, `Javascript`
    - `artifactVersion`: The version of the generated artifact. Be aware that versioning policies differ depending on the package manager (e.g. NPM does not allow re-publication of the same version, while maven does)
    - `litVocabTermVersion`: The version of the library LIT Vocab Term library (e.g. https://github.com/inrupt/lit-vocab-term-js for Javascript, https://github.com/pmcb55/lit-java/tree/master/lit-vocab-term for Java) upon which the generated vocabularies will depend
    - `artifactDirectoryName`: Name of the directory in which the artifacts are stored, child of the output directory of the generation process
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
  - `termSelectionFile`: When using only a portion of a large vocabulary, this option specifies a second input vocabulary that defines the subset of terms that are to be generated from the `inputResources`. Moreover, it also enables adding custom information to a vocabulary you don't have control over (e.g. adding translations for existing labels or comments, or overriding existing values, or adding completely new terms, etc.). For examples, see:
    - [./vocabs/schema-inrupt-ext.tt](./vocabs/schema-inrupt-ext.ttl)
    - [./vocabs/vcard-inrupt-ext.tt](./vocabs/vcard-inrupt-ext.ttl)
    - [./vocabs/owl-inrupt-ext.tt](./vocabs/owl-inrupt-ext.ttl)

    [Back to the homepage](../README.md)