=============================
Generate Vocabulary Artifacts
=============================

In addition to Inrupt's :doc:`vocabulary libraries
</reference/vocab-rdf>`, which provide convenience objects for many
common terms/identifiers, Inrupt also provides an `Artifact Generator
<https://github.com/inrupt/artifact-generator>`_ to generate your own
set of convenience objects.

The `Artifact Generator`_ can take as input existing online
vocabulary(ies), local ``.ttl`` file(s), or a combination of both, and
your generated set can be a subset or an extension of existing
vocabularies.

Install/Run
===========

To run, you can use ``npx`` to run the generator without needing to
install it locally:

.. code-block:: sh

   npx @inrupt/artifact-generator <command> <options>

Alternatively, you can install the generator locally and run:

#. Install locally.

   .. code-block:: sh

      npm install @inrupt/artifact-generator

#. Run by referencing generator's :file:`index.js` from within the
   ``node_modules`` directory. For example:

   .. code-block:: sh

      node node_modules/@inrupt/artifact-generator/index.js <command> <options>

Commands
--------

The Artifact Generator supports the following commands

.. list-table::
   :widths: 20 80

   * - ``generate``

     - Generates the artifacts.

   * - ``init``

     - Initializes a configuration YAML file.


   * - ``validate``

     - Validates a configuration YAML file.

   * - ``watch``

     - Watches the input vocabulary resources (specified in the
       configuration YAML file) to automatically regenerate the
       artifacts if any of the input resources change.

To see all available commands, you can specify the ``--help`` option:

.. code-block:: sh

   npx @inrupt/artifact-generator --help

Options
-------

The Artifact Generator includes options to:

- Select a subset of terms to include from the source vocab in the
  generated artifact.

- Enhance selected terms, for example with additional translations.

- Provide the version number for the output module.

- Specify a custom prefix for the output module name.

- Specify a custom NPM registry where the generated artifact will be
  published.

- Generate artifacts for other programming languages; e.g., Java.

Options can be provided to the Artifact Generator using the
Command-Line Interface (CLI) or, for more advanced features
such as generating artifacts for different programming languages, a
YAML config file.

To see all available options for the supported commands, specify the
``--help`` option after the command:

.. code-block:: sh

   npx @inrupt/artifact-generator <command> --help

For example, the following lists the options for the ``generate``
command:

.. code-block:: sh

   npx @inrupt/artifact-generator generate --help


Generate Artifacts using the CLI
================================

To generate artifacts from existing vocabulary (or vocabularies), use
the  ``--inputResources`` option to pass in either the URI if the vocabulary is
online or the filepath if the vocabulary is local.

From a Single Input Resource
----------------------------

The following example uses the Inrupt's publicly available PetRock
vocabulary (available at
https://team.inrupt.net/public/vocab/PetRock.ttl) to generate a
JavaScript artifact ``PET_ROCK.js``.

.. code-block:: sh

   npx @inrupt/artifact-generator generate --inputResources https://team.inrupt.net/public/vocab/PetRock.ttl --noprompt

That is, the generate operation specifies the following options:

.. list-table::
   :widths: 25 75

   * - ``--inputResources``

     - Set to the PetRock vocabulary's URI
       ``https://team.inrupt.net/public/vocab/PetRock.ttl``.

   * - ``--noprompt``

     - Optional. Specified to suppress interactive prompts during the
       generation process.

You can run ``npx @inrupt/artifact-generator generate --help`` for more
details on the options.

The generate operation creates a JavaScript artifact ``PET_ROCK.js``
that provides constants for all the terms described within the public
Pet Rock vocabulary. The ``PET_ROCK.js`` artifact is located
in the ``Generated/SourceCodeArtifacts/JavaScript/GeneratedVocab``
directory under the current directory.

From Multiple Input Resources
-----------------------------

The files passed to ``--inputResources`` can be remote or local. You
can pass in multiple vocabulary resources to ``--inputResources`` as a
space-delimited list.

.. note::

   If passing in multiple resources, the resources must share the same
   namespace.

For example, consider the following local files ``Event.ttl`` and
``Organization.ttl`` that represent subsets of the Schema.org
vocabulary:

.. code-block:: turtle

   @prefix ns3: <http://www.w3.org/2002/07/owl#> .
   @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
   @prefix schema: <http://schema.org/> .

   schema:Event a rdfs:Class ;
      rdfs:label "Event" ;
      rdfs:comment "An event happening at a certain time and location, such as a concert, lecture, or festival. Ticketing information may be added via the [[offers]] property. Repeated events may be structured as separate Event objects." ;
      rdfs:subClassOf schema:Thing ;
      ns3:equivalentClass <http://purl.org/dc/dcmitype/Event> .

   schema:Thing a rdfs:Class ;
      rdfs:label "Thing" ;
      rdfs:comment "The most generic type of item." .

.. code-block:: turtle

   @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
   @prefix schema: <http://schema.org/> .

   schema:Organization a rdfs:Class ;
      rdfs:label "Organization" ;
      rdfs:comment "An organization such as a school, NGO, corporation, club, etc." ;
      rdfs:subClassOf schema:Thing .

   schema:Thing a rdfs:Class ;
      rdfs:label "Thing" ;
      rdfs:comment "The most generic type of item." .

To generate an artifact using the two resources, pass the file paths to
``--inputResources`` as a space delimited list.

.. code-block:: sh

   npx @inrupt/artifact-generator generate --inputResources ./Event.ttl ./Organization.ttl --noprompt

Create a Front-End JavaScript Artifact
--------------------------------------

By default, the ``generate`` command generates the required `Rollup
<https://rollupjs.org/>`_ config to bundle the artifact. You can
deactivate the bundling by setting ``--supportBundling`` to false:

.. code-block:: sh

   npx @inrupt/artifact-generator generate --inputResources https://team.inrupt.net/public/vocab/PetRock.ttl --noprompt --supportBundling=false

Rollup is the default option from the CLI. You can specify other
bundlers (e.g., Parcel, Webpack, etc.) in the :ref:`YAML configuration
file <generate-artifacts-using-yaml>`.

Use Generated Artifacts in a JavaScript App
-------------------------------------------

Once generated, the artifact can be used directly in applications, both
Node.js and browser based.

For example, after you add ``PET_ROCK.js`` as a dependency to a project as
``generated-vocab-pet-rock``, you can then use the library as in the
the following code snippet:

.. literalinclude:: /examples/vocabulary/use-generated-vocab.js
   :language: typescript
   :start-after: BEGIN-EXAMPLE
   :end-before: END-EXAMPLE

.. _generate-artifacts-using-yaml:

Generate Artifacts using YAML Configuration File
================================================

The previous examples used the available command-line options to
configure the artifact generation. Alternatively, you can use a YAML
configuration file.

For example, the previous ``PET_ROCK.js`` generation can be performed
using the following YAML config file ``./example/mypetrock.yml``:

.. literalinclude:: /examples/vocabulary/artifact-generator-minimal-config.yml
   :language: yaml
   :start-after: BEGIN-EXAMPLE
   :end-before: END-EXAMPLE

To generate using the configuration file, pass the YAML config file to
the ``--vocabListFile`` option:

.. code-block:: sh

   npx @inrupt/artifact-generator generate --vocabListFile ./example/mypetrock.yml --noprompt


YAML Configuration Options
--------------------------

You can use the generator to initialise the YAML file with all the
required options.

.. code-block:: sh

   npx @inrupt/artifact-generator init

Once generated, you can customize the file as required.

The following example YAML file shows all available configuration options.

.. literalinclude:: /examples/vocabulary/artifact-generator-config.yml
   :language: yaml
   :start-after: BEGIN-EXAMPLE
   :end-before: END-EXAMPLE

Template files
~~~~~~~~~~~~~~

The template files defined in the YAML determine the code generated
by the artifact generator. The reason for this configuration is that the
artifact generator can output vocabulary artifacts in multiple programming
languages and in a form compatible with any of a number of existing RDF
libraries. The options that can be specified for ``templateInternal`` can
be seen in the ``templates`` directory of the artifact generator repo.

If you need to support a programming language or RDF library not
covered by a provided template, or if you need to make your own changes
to the generated output, you can supply your own template files using
``templateCustom``.

For example, the default JavaScript template uses the Inrupt library
`@inrupt/solid-common-vocab
<https://www.npmjs.com/package/@inrupt/solid-common-vocab>`_ to output
generated vocabulary terms as ``VocabTerm`` objects. These objects give
developers access to all the meta-data associated with individual
vocabulary terms (e.g., the ``rdfs:comments``, the ``rdfs:seeAlso``
links, the ``rdfs:isDefinedBy``).


YAML Validation
---------------

Using the ``validate`` command, you can validate a YAML config file to
ensure it is correctly formatted for artifact generation:

.. code-block:: sh

   npx @inrupt/artifact-generator validate --vocabListFile ./example/your-generator-config.yml

Automatic Artifact Regeneration
-------------------------------

Using the ``watch`` command, you can start a process to continuously
watch a list of vocabularies specified in the YAML configuration file
and re-generate the artifacts in response to changes:

.. code-block:: sh

   npx @inrupt/artifact-generator watch --vocabListFile ./example/your-generator-config.yml

The process runs in the foreground until you hit "Enter".

Repository
==========

For more examples, as well as example ``.ttl`` files for term
selection, see the `Artifact generator repository
<https://github.com/inrupt/artifact-generator>`_.
