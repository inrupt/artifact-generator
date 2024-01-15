=====================
Existing Vocabularies
=====================

Many vocabularies (i.e., collections of terms identified with URLs)
already exist. For example, the following table lists some existing
vocabularies that may be helpful in modeling your data:

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Vocabulary

     - Notes

   * - `gist (from Semantic Arts) <https://www.semanticarts.com/gist/>`_

     - An upper-ontology (i.e., a generic vocabulary, intended for use
       across a broad range of applications), related to
       business/enterprise information (such as organizations, places
       and addresses, date/time, products and services, etc.). For
       example:

       - ``gist:Account``

       - ``gist:PostalAddress``

       - ``gist:Transaction``

       - ``gist:startDateTime``

       where ``gist:`` is the recommended prefix for
       ``https://ontologies.semanticarts.com/gist/``.

   * - `PROV-O <https://www.w3.org/TR/prov-o/>`_

     - *A W3C standard.* For recording general provenance information,
       such as when an event or an action took place, who executed the
       action, where the action took place, etc. Such provenance
       information can form the basis for auditing any event or action,
       and for tracking the progression of that event of action
       throughout an entire distributed eco-system. For example:

       - ``prov_o:wasAttributedTo``

       - ``prov_o:actedOnBehalfOf``

       - ``prov_o:wasStartedBy``

       where ``prov_o:`` is the recommended prefix for
       ``http://www.w3.org/ns/prov#``.

   * - `XML Schema (XSD) <http://www.w3.org/2001/XMLSchema#>`_

     - *A W3C standard.* For all the common programming language data
       types, such as Integers, Floats, Strings, Dates, etc. For
       example:

       - ``xsd:dateTime``

       - ``xsd:double``

       where ``xsd:`` is the recommended prefix for
       ``<http://www.w3.org/2001/XMLSchema#>``.

       The following shows sample triples (in Turtle format) that
       specify the datatypes of the values:

       .. code-block:: turtle
          :emphasize-lines: 2

          myPod:someService
             gist:startDateTime "2002-05-30T09:30:10Z"^^xsd:dateTime.

       .. code-block:: turtle
          :emphasize-lines: 4

           gist:_day a gist:DurationUnit ;
              skos:definition "A duration unit that is 24 hours long." ;
              gist:hasBaseUnit gist:_second ;
              gist:conversionFactor "8.64e+04"^^xsd:double .

   * - `QUDT for Quantity Kinds, Units of Measure, Dimensions and Data
       Types <https://www.qudt.org/2.1/catalog/qudt-catalog.html#vocabs>`_

     - For data types more specific than those provided by XML Schema.
       Comprises a number of related vocabularies, including a "Units"
       vocabulary for concepts like "kilometers per hour" or "square
       meter". For example:

       - ``qudt:Unit``

       - ``unit:KiloM-PER-HR``

       - ``unit:M2``

       where:

       - ``qudt:`` is the recommended prefix for
         ``<http://qudt.org/schema/qudt/>``, and

       - ``unit`` is the recommended prefix for
         ``<http://qudt.org/2.1/vocab/unit>``.

       The following shows sample triples (in Turtle format) that
       specify the units (kilometers-per-hour and square meters,
       respectively) of the values:

       .. code-block:: turtle

          myPod:myCar carVocab:topSpeed "300"^^unit:KiloM-PER-HR .

          myPod:myHouse houseVocab:floorSpace "3000"^^unit:M2 .

   * - `Solid Terms (W3C draft standard) <https://www.w3.org/ns/solid/terms#>`_

     - Defines Solid-specific terms. For example:

       - ``solid:oidcIssuer``

       - ``solid:storgeQuota``

       where ``solid:`` is the recommended prefix for
       ``<https://www.w3.org/ns/solid/terms#>``.

       The following shows sample triples (in Turtle format) that uses
       Solid specific terms in the predicates:

       .. code-block:: turtle

          myWebId: solid:oidcIssuer <https://login.inrupt.com> .

       .. code-block:: turtle

          podProvider:newPodConfig solid:storgeQuota "10"^^unit:GigaBYTE .

   * - `Data Privacy Vocabulary (DPV) <https://w3c.github.io/dpv/dpv/>`_

     - Related to the use and processing of personal data based on
       legislative requirements. For instance, DPV defines a number of
       hierarchically organized `Purposes <https://w3c.github.io/dpv/dpv/#vocab-purpose>`_
       that can be used to formally denote the purpose for which a party is
       requesting access to an individual user's data. For example:

       - ``dpv:GovernmentalOrganisation``

       - ``dpv:Consumer``

       - ``dpv:AcademicResearch``

       where ``dpv:`` is the recommended prefix for ``https://w3id.org/dpv#``.

   * - `Open Digital Rights Language (ODRL) <https://www.w3.org/TR/odrl-vocab/>`_

     - Related to permissions, duties, and prohibitions on the use of
       content and services. The vocabulary can be used for formally
       stipulating policies when users are sharing their data. For example:

       - ``odrl:Policy``

       - ``odrl:permissions``

       - ``odrl:consentingParty``

       where ``odrl:`` is the recommended prefix for ``http://www.w3.org/ns/odrl/2/``.

   * - `Simple Knowledge Organization System (SKOS)
       <https://www.w3.org/2009/08/skos-reference/skos.html>`_

     - Defines hierarchical structures such as thesauri, or taxonomies
       (such as product catalogs, where, for example, a 'Couch' might
       come under 'Furniture', that in turn comes under 'Home' in a
       department store's catalog of products). For example:

       - ``skos:narrower``

       - ``skos:broader``

       - ``skos:definition``

       - ``skos:prefLabel``

       where ``skos:`` is the recommended prefix for ``http://www.w3.org/2004/02/skos/core#``.

Additional Information
======================

- `Linked Open Vocabularies (LOV)
  <https://lov.linkeddata.es/dataset/lov/vocabs>`_ to search for other existing
  vocabularies.

- Oracle's `Knowledge Graph Modeling: Governance & Project Scope
  <https://www.ateam-oracle.com/post/knowledge-graph-modeling-governance-project-scope>`_.
