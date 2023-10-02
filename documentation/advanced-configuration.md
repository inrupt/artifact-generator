# Advanced configuration

## CLI options

- `--clearOutputDirectory`, or `-c`: clears the output directory before
  generating.
- `--force`, or `-f`: forces the generation even if the output directory
  contains artifacts that seem up-to-date.
  Note that this will only overwrite existing artifacts - any additional files
  not re-generated from templates (e.g., a `package-lock.json`) will not be
  affected by this option.
- '--reportBestPracticeCompliance', or  '--bp': for each vocabulary, add a report
  on it's compliance to the Inrupt vocabulary Best Practice guidelines (added to
  the file's comment header)

## Generation configuration

### CLI Examples

Here are some examples of running the tool using Command Line Interface (CLI)
options from the project root directory:

Local vocabulary file:

```shell
node src/index.js generate --inputResources ./example/vocab/PetRock.ttl --noPrompt
```

Remote vocabulary file:

```shell
node src/index.js generate --inputResources https://schema.org/version/latest/schema-snippet.ttl --noPrompt
```

Multiple local vocabulary files:

```shell
node index.js generate --inputResources ./example/vocab/Skydiving.ttl ./example/vocab/PetRock.ttl
```

Selecting only specific terms from a vocabulary.
Here we provide the full Schema.org vocab as input, but we only want constants
for the handful of terms in the 'just-the-terms-we-want-from-schema-dot-org.ttl'
vocab):

```shell
node index.js generate --inputResources https://schema.org/version/latest/schema-snippet.ttl --termSelectionResource ./example/vocab/just-the-terms-we-want-from-schema-dot-org.ttl
```

Enhance selected terms with multilingual translations:

```shell
node index.js generate --inputResources https://schema.org/version/latest/schema.ttl --termSelectionResource ./example/vocab/our-translations-for-schema-dot-org.ttl --noPrompt
```

Collecting multiple (remote in this example) vocabularies into one bundled vocab
artifact:

```shell
node index.js generate --inputResources https://schema.org/Person.ttl https://schema.org/Restaurant.ttl https://schema.org/Review.ttl
```

Providing the version for the output module:
```shell
node index.js generate --inputResources ./example/vocab/PetRock.ttl --artifactVersion 1.0.1
```

Specifing a custom prefix for the output module name:
```shell
node index.js generate --inputResources ./example/vocab/PetRock.ttl --moduleNamePrefix my-company-prefix-
```

Specifing a custom NPM registry where the generated artifact will be published:
```shell
node index.js generate --inputResources ./example/vocab/PetRock.ttl --npmRegistry http://my.company.registry/npm/
```

Using short-form aliases for the command-line flags:
```shell
node index.js generate --i https://schema.org/version/latest/schema.ttl --tsr ./example/vocab/just-the-terms-we-want-from-schema-dot-org.ttl --av 1.0.6 --mnp my-company-prefix-
```

Providing the version for the Vocab Term dependency (this is the library that
provides a simple class to represent a vocabulary term (such as a Class, a
Property or a Text string)):

*Note:* If you're using a local copy of this library, you can also use the form
`file:/my_local_copy/vocab-term` to pick up that local copy.

```shell
node index.js generate --i ./example/vocab/PetRock.ttl --solidCommonVocabVersion ^1.0.10
```

For help run:

```shell
node index.js --help
```

**Note**: By default this will *only* publish to the NPM registry at 
`http://localhost:4873` (which is the default address for Verdaccio when running
it on your local machine). You can configure the registry on the command line
arguments `--npmRegistry`.

**Note**: The public NPM registry prohibits re-publication of an artifact under
a version number that has been released previously. Before publishing an
artifact, make sure that you have incremented the version of the module so that
there is no conflict. Please note that it is actually a feature of Verdaccio to
support `npm --force unpublish`, which makes it possible to override a
previously published artifact. 

### <a id="yaml"/> Configuring options using the YAML file

Creating a YAML configuration file (simply using `node index.js init`) provides
you much greater control over the artifacts you'd like to generate, and the
vocabularies you want to work with. The following example YAML file shows the
available configuration options.

```yaml
##
# GENERAL INFORMATION
##
# Name of the generated artifact.
artifactName: generated-vocab-test
# MANDATORY. Version of the @inrupt/artifact-generator with which this YAML file is compatible
artifactGeneratorVersion: 0.2.0

##
# VERSIONING INFORMATION
##
# This section is not mandatory
versioning:
  # Type of the versioning protocol. This is for documentation purpose.
  type: git
  # URL of the target repository. This is used in some packaging systems (e.g., NPM)
  url: https://repository.git
  # These files will be generated at the root of the target artifact
  versioningTemplates: 
      # A template name. It can reference existing internal templates supplied
      # within the Artifact Generator, or custom templates relative to this
      # configuration file.
    - templateInternal: ".gitignore.hbs"
      # The name of the file generated from the template
      fileName: ".gitignore"

##
# TARGET ARTIFACT CONFIGURATION
##
# MANDATORY, and must contain at least one artifact
artifactToGenerate:
    # The generated programming language. This is for documentation purpose.
  - programmingLanguage: Java
    # The version of the generated artifact. This is used for packaging.  Be aware that versioning policies differ
    # depending on the package manager (e.g., NPM does not allow re-publication of the same version, while Maven does)
    artifactVersion: 3.2.1-SNAPSHOT
    # Required to provide these values, even if no value, so that we explicitly stipulate 
    # differentiated names in the expected case of multiple 'forms' of artifact being generated per
    # vocabulary (e.g., an artifact with string literal constants, an artifact with RDF/JS IRI 
    # types, VocabTerm types, etc.)
    artifactNamePrefix: ""
    artifactNameSuffix: ""
    # The version of the Vocab Term library (e.g., https://github.com/inrupt/solid-common-vocab-js for JavaScript, 
    # https://github.com/inrupt/solid-common-vocab-java for Java) upon which the generated vocabularies 
    # will depend. This is used for packaging.
    solidCommonVocabVersion: "0.1.0-SNAPSHOT"
    # MANDATORY The sub-directory of the output directory in which the current artifact will be generated.
    artifactDirectoryName: Java
    # MANDATORY - Must be one (and only one) of either:
    #  - templateInternal References a Handlebars template internally
    #  provided by the Artifact Generator, and relative to it's internal
    #  "template" directory.
    #  - templateCustom References a Handlebars template relative to
    #  the configuration file.
    templateInternal: solidCommonVocabDependent/java/rdf4j/vocab.hbs
    # MANDATORY The extension that is appended after the name of the generated source code files.
    sourceFileExtension: java
    # These terms will be prefixed by an underscore in the generated code.
    # It allows us prevent conflicts if a term from a vocabulary is also a
    # keyword in the target language.
    languageKeywordsToUnderscore:
      - class     
      - abstract
      - this
    # Package name. This is a Java-specific option. More generally, each 'artifactToGenerate' object is used to define
    # environment variables that are used to instantiate the template. Without changing the core code, it is therefore
    # possible to use language-specific options in the YAML file and to use them in the templates.
    javaPackageName: com.inrupt.testing
    ##
    # PACKAGING CONFIGURATION
    ##
    # The packaging options are artifact-specific. They are not mandatory.
    packaging:
        # This is for documentation purpose
      - packagingTool: maven
        # As for the 'artifactToGenerate', the 'packaging' objects are passed to the appropriate template. Therefore, 
        # the generator code is agnostic to the variables defined here. For instance, the groupId thereafter is used
        # in the 'pom.hbs' template. 
        groupId: com.inrupt.test
        rdf4jVersion: 2.5.3
        packagingTemplates: 
          # MANDATORY The template(s) instantiated once to generate the target packaging code.
          # It can reference a handlebars template relative to the YAML file, and also
          # accepts 'jpom.hbs', 'package.hbs', 'index.hbs', 'webpack.dev.config.hbs'
          # and 'webpack.dev.config.hbs'.
        - templateInternal: solidCommonVocabDependent/java/rdf4j/pom.hbs
          # The name of the generated packaging file
          fileName: pom.xml

  - programmingLanguage: JavaScript
    artifactVersion: 10.11.12
    solidCommonVocabVersion: "^1.4.0"
    artifactDirectoryName: JavaScript
    templateInternal: solidCommonVocabDependent/javascript/vocab.hbs
    sourceFileExtension: js
    packaging: 
      # Note how different packaging tools can be used for the same artifact (e.g., NPM and rollup, or 
      # Gradle and Maven), and how each of these packaging tools may generate more than one file.
      - packagingTool: npm 
        # This is an NPM-specific option, used in the generated package.json
        npmModuleScope: "@inrupt/"
        packagingTemplates: 
          - templateInternal: solidCommonVocabDependent/javascript/package.hbs
            fileName: package.json
          - templateInternal: solidCommonVocabDependent/javascript/index.hbs
            fileName: javascript/index.js
      - packagingTool: rollup
        # If this is set (not mandatory), the packaging files are instantiated in this directory
        packagingFolder: config
        packagingTemplates:
          - templateInternal: generic/javascript/rollup.config.hbs
            fileName: rollup.config.js

##
# INPUT VOCABULARIES
##
vocabList:
    # Description of the vocabulary, that will be used as a comment describing the generated class
  - descriptionFallback: Snippet of Schema.org from Google, Microsoft, Yahoo and Yandex with selective terms having translations
    # MANDATORY A list of resources, which can be any mixture of local RDF
    # files (whose path may be absolute, or relative to the YAML file itself)
    # or remote IRI's, from which a single vocabulary source file will be
    # generated.
    inputResources:
      - https://schema.org/version/latest/schema.ttl
    # The name of the generated vocabulary class. For instance, if set to
    # `foo`, the corresponding Java class will be `FOO.java`. If not set, the
    # generator will look in the source RDF vocabulary for the 
    # `vann:preferredNamespacePrefix` property, and if it is not defined the
    # generation will be interrupted.
    nameAndPrefixOverride: schema-inrupt-ext
    # When using only a portion of a large vocabulary, this option specifies a
    # second input vocabulary that defines the subset of terms that are to be 
    # generated from the `inputResources`. Moreover, it also enables adding
    # custom information to a vocabulary you don't have control over (e.g.,
    # adding translations for existing labels or comments, or overriding
    # existing values, or adding completely new terms, etc.). For an example,
    # see https://github.com/inrupt/artifact-generator/blob/develop/test/resources/vocab/schema-inrupt-ext.ttl.
    termSelectionResource: ../test/resources/vocab/schema-inrupt-ext.ttl
```

[Back to the homepage](../README.md)
