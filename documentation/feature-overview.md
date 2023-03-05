# Feature Overview

The Artifact Generator can be run using a YAML configuration file, or using
CLI options. More details can be found in
[Advanced Configuration](./advanced-configuration.md).

## How to run

Options for installation are detailed in the
[quickstart](../README.md#quickstart)

To ensure the installation was completed successfully: 
```shell
artifact-generator --help
```

## To generate source code from a vocabulary:
```shell
node index.js generate --inputResources <vocab resources (e.g., local files, or remote IRI's)>
```

The output is a Node.js Module containing a JavaScript file with constants
defined for the RDF terms found in the vocabulary specified by the
`--inputResources` flag. This module is located inside the
**./Generated** directory by default. To generate artifacts for a different
programming language, a YAML configuration file must be used (see below).

For example:
```shell
node index.js generate --inputResources ./example/vocab/PetRock.ttl --noPrompt
```
This will generate a JavaScript artifact in the default `./Generated`
directory.

## To initialize a YAML file that should be edited manually

```shell
node index.js init
```

The output is a YAML file (by default `./sample-vocab.yml`), within which
options can be specified to generate artifacts in different languages (e.g.,
Java, JavaScript, TypeScript, etc.), and which can list a multitude of RDF
vocabularies to be bundled together into each generated artifact. 

## To **validate** a YAML file after it has been manually edited:

```shell
node index.js validate --vocabListFile <./path/to/the/yaml/file>
```
This command verifies that:
- The YAML file is syntactically valid.
- All mandatory options are specified.
- The vocabularies listed in the configuration are accessible and
  syntactically valid.

## To **generate** source code from a YAML configuration file

To generate from **multiple vocabularies**, and/or generate artifacts that are
**not Node modules**, you can use a YAML configuration file:

```shell
node index.js generate --vocabListFile <./path/to/the/yaml/file>
```

The details of the available options are listed in the
[advanced configuration section of the documentation](./advanced-configuration.md)

## To **watch** a set of vocabularies

This command runs the Artifact Generator in file watcher mode, where it will
continuously watch the provided list of vocabulary files, and will
re-generate all artifacts whenever it detects any of those files being
changed:

```shell
node index.js watch --vocabListFile <./path/to/the/yaml/file>
```

The process will run in the foreground until you hit "Enter", and artifacts
will be kept up-to-date with vocabularies as long as the generator is running.

## To see detection of configuration file changes causing re-generation

Run this command from the repository root, and then edit the local 
`./example/vocab/PetRock.ttl` vocabulary, or the YAML configuration file to
see the real-time re-generation of the bundle each time you save a change:

```
node index.js watch --vocabListFile ./example/vocab/CopyOf-Vocab-List-Common.yml
```

Run this command multiple times to see re-generation ignored after
the first time (since no vocabulary files nor the YAML file where changed),
but then edit either the YAML file or the local `./example/vocab/PetRock.ttl`
vocabulary to see the re-generation again (due to the generator
detecting the file change):

```
node index.js generate --vocabListFile ./example/vocab/CopyOf-Vocab-List-Common.yml --noPrompt
```


## To generate human-readable documentation for a vocabulary (using Widoco)

-    **Note:** This feature requires that at least
     [Java version 1.8](https://docs.oracle.com/javase/8/docs/technotes/guides/install/install_overview.html)
     be installed on your machine, and that you install Widoco (this simply
     involves downloading a single JAR file from
     [here](https://github.com/dgarijo/Widoco/releases)). The JAR file will be
     named `widoco-X.Y.Z-jar-with-dependencies.jar`, where X, Y, and Z
     represent the [Semantic Versioning number](https://semver.org/)). 
     
-    Lastly you need to set the environment variable `WIDOCO_JAR` to the
     Widoco JAR file you just downloaded.
    
-    As an example, using `wget` on Linux:
     
        ```shell
        mkdir Widoco
        cd Widoco
        wget https://github.com/dgarijo/Widoco/releases/download/v1.4.15/widoco-1.4.15-jar-with-dependencies.jar
        export WIDOCO_JAR=`pwd`/widoco-1.4.15-jar-with-dependencies.jar
        ```

To generate a Widoco documentation website in the default `./Generated/Widoco`
directory, run:

```shell
node index.js generate --inputResources ./example/vocab/PetRock.ttl --runWidoco --noPrompt
```

-    **Note:** If you have trouble with Node picking up your environment
     variable, you can try providing it manually:
     
     ```shell
     WIDOCO_JAR=$WIDOCO_JAR node index.js ...
     # ...or if no system-wide env var, just:
     WIDOCO_JAR=/path/to/jar/widoco-1.4.15-jar-with-dependencies.jar node index.js ...
     ```

You'll need to publish this generated website somewhere to serve it up (or
simply open the file `./Generated/Widoco/index-en.html` in a browser to view
it locally).

## See the help

```shell
node index.js --help
```

This will list all the available commands (e.g., `generate`, `init`,
`validate`, or `watch`), and the options available for each command.

[Back to the homepage](../README.md)
