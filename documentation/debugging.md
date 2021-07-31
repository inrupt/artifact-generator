# Debugging

The Artifact Generator uses the NPM `debug` package for reporting log
information during operation. To turn on logging, simply set the `DEBUG`
environment variable. For example, to see all logging for all Artifact
Generator operations, set:

`DEBUG=artifact-generator*`

To only see logging for the `VocabGenerator` component, set:

`DEBUG=artifact-generator:VocabGenerator`

To see logging for the entire operation (including dependencies that also use
`debug`), set:

`DEBUG=*`

## IntelliJ

When running tests in IntelliJ, simply edit the 'Run/Debug Configurations'
settings to add the appropriate `DEBUG=...` setting in the Environment
Variables editbox.

[Back to the homepage](../README.md)
