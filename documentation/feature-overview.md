# How to build

Temporarily, until we release the `lit-vocab-term` library to the public NPM
repository, we need our local NPM to point at the inrupt Verdaccio instance to
find this dependency.

```shell
npm set registry https://verdaccio.inrupt.com
```

```shell
npm install
```

Or to install globally (so you can run the generator from any directory):
```shell
npm -g install @lit/artifact-generator
```

# How to run

To ensure the installation was completed successfully: 
```shell
lit-artifact-generator --help
```

## To generate source code from a vocabulary:
```shell
node index.js generate --inputResources <vocab resources (e.g. local
 files, or remote IRI's)>
```

The output is a NodeJS Module containing a Javascript file with constants
defined for the RDF terms found in the vocabulary (or multiple vocabularies)
specified by the `--inputResources` flag. This module is located inside the
**./FGenerated** directory by default. To generate artifacts in a different
programming language, a YAML configuration file must be used (see below).

For example:
```shell
node index.js generate --inputResources ./demo/vocab/PetRock.ttl --noprompt
```
this will generate a Javascript artifact in the default `./Generated` directory.

## To initialize a YAML file that should be edited manually
```shell
node index.js init
```

The output is a YAML file (by default `./lit-vocab.yml`), within which options can be specified to generate artifacts in different languages (e.g. Java, Javascript, Typescript, etc.) from a list of vocabularies. 

## To **validate** a YAML file after it has been manually edited:
```shell
node index.js validate --vocabListFile <./path/to/the/yaml/file>
```
This command verifies that:
- the YAML file is syntactically valid
- the mandatory options are specified
- the vocabularies listed in the configuration are accessible and syntactically valid

## To **generate** source code from a YAML configuration file
To generate from **multiple vocabularies**, and/or generate artifacts that are **not Node modules**, you can use a YAML configuration file: 
```shell
node index.js generate --vocabListFile <./path/to/the/yaml/file>
```

The details of the available options are listed in the [dedicated section of the documentation](#yaml)

## To **watch** a set of vocabularies
This command starts a daemon that continuously watches a list of vocabularies, and re-generates artifacts accordingly, you can use the following command:
```shell
node index.js watch --vocabListFile <./path/to/the/yaml/file>
```

The process will run in the foreground until you hit "Enter", and artifacts will be kept up-to-date with vocabularies as long as the daemon is running.

## See the help
```shell
node index.js --help
```
Will list all the available commands (e.g. `generate`, `init`, `validate`, or `watch`), and the options available for each command.

[Back to the homepage](../README.md)