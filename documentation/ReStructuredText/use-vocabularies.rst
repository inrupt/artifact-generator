==========
Vocabulary
==========

.. role:: red(strong)
   :class: text-danger

Vocabularies are collections of identifiers for (generally) related
terms.

All data is associated with identifiers. That is, when you read data,
you identify the data you want to read. Similarly, when you write data,
you identify the data that you are writing.

In the Solid ecosystem, all data identifiers are :term:`IRIs <IRI>`:

#. IRIs are globally unique identifiers. Being globally unique prevents
   name clashes and allows for different interpretations of common
   concepts.

   For example, the concept of a ``Person`` is identified in Schema.org
   with the identifier ``https://schema.org/Person``, and Schema.org's
   interpretation of the Person concept is described as "A person
   (alive, dead, undead, or fictional).".

   The `Person Core Ontology <https://www.w3.org/ns/person>`_, however,
   identifies the Person concept with the identifier
   ``https://www.w3.org/ns/person#Person``, and their interpretation of
   the Person concept is described as "An individual person who may be
   dead or alive, but not imaginary."

   Using IRIs allows for the **unambiguous** differentiation between
   slightly different interpretations of common concepts, whereas
   simply using 'Person' as the identifier would lead to confusion when
   attempting to interoperate.

#. IRIs are dereferenceable, i.e., they can be looked up easily, such as
   by pasting them into the address bar of any browser.

   Providing meaningful descriptive information at an IRI helps with
   discovering and understanding the data identified by that IRI.

Pre-existing Vocabularies
=========================

Many vocabularies (i.e., collections of terms identified with IRIs)
already exist to identify various concepts (e.g., ``Organization``,
``Person``) and properties (e.g., ``address`` or ``the starting time of
an event``). The concepts and properties being identified may be
general or highly specialized. For a list of some existing
vocabularies, see :doc:`/tutorial/vocabulary-existing`.

When possible, rather than creating your own vocabulary of
terms/identifiers, choose from :doc:`existing ones
</tutorial/vocabulary-existing>`. This helps promote the use of
shared/common terms, and therefore, :ref:`interoperability
<vocabulary-interoperability>`.

Using Terms from Vocabularies
-----------------------------

To define your data entities, you can use terms from any combination of
vocabularies. That is, to save data for a person, you could use:

- ``http://schema.org/familyName`` as the identifier for the last name
  and

- ``http://xmlns.com/foaf/0.1/firstName`` as the identifier for the first name.

However, in practice, you are more likely to use the first and last
name terms from the same vocabulary; e.g.,

- ``http://schema.org/familyName`` and ``http://schema.org/givenName`` or

- ``http://xmlns.com/foaf/0.1/lastName`` and ``http://xmlns.com/foaf/0.1/firstName``.

Nevertheless, as previously mentioned, you can use terms from any
combination of vocabularies.

For example, the following code snippet uses the ``solid-client``
function :apisolidclient:`getStringNoLocale
</modules/thing_get.html#getstringnolocale>` to return specific
data items (identified by their IRI strings) from a data entity
``retrievedPerson``.

.. literalinclude:: /examples/vocabulary/use-vocabularies.js
   :language: typescript
   :start-after: BEGIN-EXAMPLE
   :end-before: END-EXAMPLE

.. _convenience-objects:

Using Convenience Objects
-------------------------

To simplify the usage of pre-existing vocabularies, Inrupt's vocabulary
libraries provide convenience objects for many (but not all) common
terms/identifiers you can use in your data entities:

.. list-table::
   :widths: 30 70

   * - `vocab-common-rdf <https://www.npmjs.com/package/@inrupt/vocab-common-rdf>`_

     - For some common :abbr:`RDF (Resource Description
       Framework)`-related vocabularies like `RDFS <http://www.w3.org/2000/01/rdf-schema#>`_,
       `FOAF <http://xmlns.com/foaf/spec/>`_, `LDP <http://www.w3.org/ns/ldp#>`_
       or `OWL <http://www.w3.org/2002/07/owl#>`_.

   * - `vocab-solid <https://www.npmjs.com/package/@inrupt/vocab-solid>`_

     - For Solid-related vocabularies like `Solid Terms
       <https://www.w3.org/ns/solid/terms>`_ and `Workspace
       <http://www.w3.org/ns/pim/space>`_.

   * - `vocab-inrupt-core <https://www.npmjs.com/package/@inrupt/vocab-inrupt-core>`_

     - For Inrupt specific vocabularies.

Convenience objects contain static constants for common identifiers
used across Solid. Importing these classes obviates the need for
developers to hard-code these identifiers in their code. Although you
can use the IRI strings instead of the convenience objects, these
objects represent many of the ideas and concepts that are useful in
Solid itself as well as in Solid applications.

The convenience objects include the (:term:`IRI`) values for each term so you don't
have to remember them or mistype them. The :apisolidclient:`getStringNoLocale
</modules/thing_get.html#getstringnolocale>` can accept either (:term:`IRI`)
strings or the convenience objects. As such, the previous example can
be rewritten as follows:

.. literalinclude:: /examples/vocabulary/use-vocabularies-bundled.js
   :language: typescript
   :start-after: BEGIN-EXAMPLE
   :end-before: END-EXAMPLE

- ``FOAF`` provides convenience objects for the `Friend of a Friend
  Vocabulary <http://xmlns.com/foaf/0.1/>`_. For
  example, the ``FOAF.firstName`` is a convenience object that includes the
  ``http://xmlns.com/foaf/0.1/firstName`` IRI.

.. _SCHEMA_INRUPT:

- ``SCHEMA_INRUPT`` is Inrupt's extension of the `schema.org
  Vocabulary <http://schema.org>`_. It provides convenience objects for
  a **subset** of terms from the `schema.org Vocabulary`_, adding
  language tags/translations to labels and comments if missing from
  schema.org.

  By limiting the number of terms, ``SCHEMA_INRUPT`` aims to make
  working with select terms from Schema.org easier. Schema.org
  currently defines over 2,500 terms (see `Organisation of Schema.org
  <https://schema.org/docs/schemas.html>`_), whereas most applications
  (including Solid itself) only require specialized subsets of those
  terms. SCHEMA_INRUPT, which consists of a small set of generally
  applicable terms, reduces noise, clutter and bundle sizes.

  If you require a Schema.org term not in SCHEMA_INRUPT, you can
  use the term's IRI string directly in your own code, create your own
  extension vocabulary, or request that Inrupt add that term to
  SCHEMA_INRUPT.

- ``VCARD`` provides convenience objects for the `vCard
  Vocabulary <https://www.w3.org/2006/vcard/ns-2006.html>`_. For
  example, the ``VCARD.role`` is a convenience object that includes the
  ``http://www.w3.org/2006/vcard/ns#role`` IRI.

.. _convenience-object-naming-scheme:

.. include:: /includes/topic-vocab-naming-scheme.rst

See also:

- :doc:`/tutorial/read-write-data`.

Generating Custom Convenience Objects
-------------------------------------

Inrupt also provides an Artifact Generator tool to generate your own
set of convenience objects. For more information, see
:doc:`/tutorial/generate-vocabulary-artifacts`.

.. _vocabulary-interoperability:

Interoperability
================

Consider an example where you are saving your address and a property of
the address is a zipcode or a postal code. If you save data for this
property as ``zipcode``, then applications must use ``zipcode`` when
accessing this data. If others use ``zip``, ``postalCode``, or
``postcode``, etc. as the identifier when storing their data, then
applications that use the ``zipcode`` identifier cannot access their
data.

The use of different identifiers for the same data can hinder
interoperability. That is, to use an application that retrieves the
same data from multiple data sources, the application must be updated
to keep track of the various identifiers in order to access this data.
Otherwise, the application would not be able to access the data if the
data source is not using the expected identifier.

Rather than having to keep track of the varying identifiers across data
sources, the use of the same identifier for the same data can help
promote interoperability. This idea of coming to broad agreement on
common identifiers is perhaps epitomized by Schema.org (from Google,
Microsoft and Yahoo!), and is becoming increasingly common in more
specialized fields, like biomedicine (e.g. BioPortal
https://bioportal.bioontology.org/ontologies) and finance (e.g. FIBO
https://spec.edmcouncil.org/fibo/).

See also:

- `solidproject.org: Well Known Vocabularies <https://solidproject.org/for-developers/apps/vocabularies/well-known>`_


.. _vocabulary-data-schemas:

Vocabularies vs. Data Schemas
=============================

Vocabularies provide terms that can be used to identify data.
Vocabularies are not data schemas (or in RDF-parlance, `"shapes"
<https://www.w3.org/2014/data-shapes/charter>`_). That is, unlike data
schemas (e.g., JSON Schema, relational database schemas (i.e. Data Definition Language (DDL) or XML Schema) which enforce what properties
must appear and can appear for a data entity, vocabularies impose no
such restrictions.

Consider an example where you are storing data entities that represent
people. To describe these data entities, you decide to use the
``http://schema.org/Person`` identifier from `Schema.org <https://schema.org/>`_ vocabulary.
That is, the data entity has a property ``RDF.type`` set to
``http://schema.org/Person``.

Identifying the data entities as being of ``RDF.type``
``http://schema.org/Person`` imposes no conditions about the data
properties saved about a person. That is, although
``http://schema.org/Person`` lists properties/identifiers that are
categorized/grouped under it, these place no restrictions on how you
should or could describe a person; i.e.,

- The properties listed under ``http://schema.org/Person`` can be used
  to identify non-``http://schema.org/Person`` data.

- Your data entity does not need to include all the properties under
  ``http://schema.org/Person``. In fact, your entity does not need to
  include any of the properties listed under
  ``http://schema.org/Person``.  That is, you can identify the Person's properties with
  :red:`non`-``http://schema.org/Person`` properties, even from other
  vocabularies. For example, you could decide that you want to define a
  person as a data entity with the following properties (from `Semantic
  Arts gist vocabulary <https://www.semanticarts.com/gist/>`_) only:

  - ``https://ontologies.semanticarts.com/gist/name``

  - ``https://ontologies.semanticarts.com/gist/isIdentifiedBy``

- Someone else may also identify their data entities as
  ``http://schema.org/Person`` but with completely different
  properties, e.g.:

  - ``https://schema.org/familyName``,

  - ``https://schema.org/givenName``, and

  - ```https://ontologies.semanticarts.com/gist/hasCommunicationAddress``.

Shapes
======

`Shapes <https://www.w3.org/2014/data-shapes/charter>`_ define what
properties must and can appear for a data entity; i.e., shapes, not
vocabularies, constrain the data.

Similar to using a common vocabulary, using shared Shapes for data also
promotes interoperability. For example, consider multiple applications
that read and write data entities that represent people.

One application's expected "shape" of a person includes the following
properties:

- an ``RDF.type`` of ``http://schema.org/Person``

- ``https://schema.org/familyName``,

- ``https://schema.org/givenName``,

- ``https://schema.org/email``, and

- ``https://schema.org/telephone``.

Another application's expected "shape" of a person includes the
following properties:

- an ``RDF.type`` of ``https://ontologies.semanticarts.com/gist/Person``

- ``https://ontologies.semanticarts.com/gist/name``

- ``https://ontologies.semanticarts.com/gist/isIdentifiedBy``

- ``https://ontologies.semanticarts.com/gist/hasCommunicationAddress``.

The two applications are not interoperable. That is, they cannot act
upon the other's data. But, if both applications used a common "shape",
which would also result in the use of the same vocabularies, then
although developed separately, they would be able to act upon each
other's data.

For additional information on Shapes, see:

- `Shapes <https://www.w3.org/2014/data-shapes/charter>`_

- `Shapes Constraint Language (SHACL) <https://www.w3.org/TR/shacl/>`_

- `Shape Expressions (ShEx) <http://shexspec.github.io/primer/>`_

.. toctree::
   :titlesonly:
   :hidden:

   /tutorial/vocabulary-existing
   /tutorial/generate-vocabulary-artifacts.rst
