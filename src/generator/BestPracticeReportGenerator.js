const debug = require("debug")(
  "artifact-generator:BestPracticeReportGenerator",
);
const { curie } = require("../Util");
const { INRUPT_BEST_PRACTICE_NAMESPACE } = require("../CommonTerms");

// TODO: PMcB: This best Practice reporting is very much early-stage and a
//  work-in-progress, so explicitly exclude it from our test code coverage for
//  the moment...
/* istanbul ignore file */

class BestPracticeReportGenerator {
  static get DISPLAY_TERM_LIMIT() {
    return 5;
  }

  static buildComplianceReport(vocabInfo) {
    const reportSoFar = {};

    debug("Generating Best Practice Report");
    reportSoFar.totalTermCount =
      vocabInfo.classes.length + vocabInfo.properties.length;

    reportSoFar.bpReport_0 =
      BestPracticeReportGenerator.complianceBp_namespaceIriProvidedExplicitly(
        vocabInfo,
        reportSoFar,
      );

    reportSoFar.bpReport_1 = BestPracticeReportGenerator.complianceBp_1(
      vocabInfo,
      reportSoFar,
    );

    reportSoFar.bpReport_2 = BestPracticeReportGenerator.complianceBp_2(
      vocabInfo,
      reportSoFar,
    );

    reportSoFar.bestPractices = [
      {
        iri: curie(
          `https://w3id.org/inrupt/vocab/bestPractice/namespace_IriProvidedExplicitly`,
        ),
        result: "PASS - namespace IRI provided explicitly.",
        subResults: [
          {
            iri: curie(
              `https://w3id.org/inrupt/vocab/bestPractice/namespace_IriProvidedExplicitly_definedUsingVann`,
            ),
            result: `Detail - namespace IRI provided via VANN:preferredNamespaceUri.`,
          },
        ],
      },
      {
        iri: curie(
          `https://w3id.org/inrupt/vocab/bestPractice/namespace_PrefixProvidedExplicitly`,
        ),
        result: "PASS - namespace prefix provided explicitly.",
        subResults: [
          {
            iri: curie(
              `https://w3id.org/inrupt/vocab/bestPractice/namespace_PrefixProvidedExplicitly_definedUsingShacl`,
            ),
            result: `Detail - namespace prefix provided via SHACL:declare.`,
          },
          {
            iri: curie(
              `https://w3id.org/inrupt/vocab/bestPractice/namespace_PrefixProvidedExplicitly_definedUsingShacl_multipleValues`,
            ),
            result: `Detail - multiple namespace prefixes provided via SHACL:declare and SHACL:prefix values of [XXX,YYY].`,
          },
        ],
      },
      {
        iri: curie(
          `https://w3id.org/inrupt/vocab/bestPractice/namespace_IriDifferentFromVocabularyIri`,
        ),
        result: "FAIL - Namespace IRI different from vocabulary IRI.",
      },
    ];

    return reportSoFar;
  }

  /**
   * We look at the namespace IRI for the vocab:
   *  - (Whether it was provided via an override or not is not relevant here,
   *    we only want to consider the vocab as it is actually provided).
   *  - Was it explicitly provided, or not?
   *    - If yes, then was it a VANN triple, or a SHACL declare triple?
   *    - If not, could it be determined heuristically?
   *      BUT WHO CARES...!? THIS COULD BE USEFUL FOR A REPORTING PERSPECTIVE
   *      (i.e., yes, we *think* we can determine a value), BUT IT'S NOT
   *      RELEVANT FROM A BEST PRACTICE GUIDANCE PERSPECTIVE.
   *
   *      And a separate consideration is whether we used the heuristically
   *      determined value for the generated artifact or not...!?
   *
   * A separate guideline is whether it equals the vocabulary IRI or not...
   *
   * @param vocabInfo
   * @param reportSoFar
   * @returns {string}
   */
  static complianceBp_namespaceIriProvidedExplicitly(vocabInfo, reportSoFar) {
    const languages = ["en"];
    const bestPractice = `${INRUPT_BEST_PRACTICE_NAMESPACE}namespace_oneIriProvidedExplicitly`;

    // languages.forEach((language) => {
    //   const message = term(bestPractice).messageParam([vocabInfo.vocabularyIri], language);
    // });

    let report = undefined;

    if (vocabInfo.vocabularyIri !== vocabInfo.namespaceIri) {
      if (vocabInfo.vocabularyIriOverride || vocabInfo.namespaceIriOverride) {
        report = `FAIL-02 - Vocabulary IRI [${vocabInfo.vocabularyIri}] is different from the namespace IRI [${vocabInfo.namespaceIri}], but we had to provide an override (i.e., 'vocabularyIriOverride': [${vocabInfo.vocabularyIriOverride}], 'namespaceIriOverride': [${vocabInfo.namespaceIriOverride}]).`;
      } else {
        report = `PASS-01 - Vocabulary IRI [${vocabInfo.vocabularyIri}] is different from the namespace IRI [${vocabInfo.namespaceIri}] (and there was no need to provide overrides for either).`;
      }
    } else {
      if (
        vocabInfo.namespaceIri &&
        vocabInfo.namespaceIri === vocabInfo.localNamespaceIri
      ) {
        report = `FAIL-03 - Namespace IRI [${vocabInfo.namespaceIri}] matches the vocabulary IRI, but they should really be different, as the concept of a namespace is distinct from the concept of a vocabulary (i.e., many vocabs can contribute terms to a single namespace (e.g., the W3C PROV set of vocabs)).`;
      } else {
        report = `FAIL-04 - Namespace IRI [${vocabInfo.namespaceIri}] had to be determined by heuristic (instead of being explicitly stated by the vocab itself via VANN, or SHACL predicates).`;
      }
    }

    reportSoFar.bpReport_0 = report;
    return report;
  }

  static complianceBp_namespacePrefixProvidedExplicitly(
    vocabInfo,
    reportSoFar,
  ) {
    let report = undefined;

    if (vocabInfo.namespacePrefix) {
      report = `PASS-01 - Namespace prefix [${vocabInfo.namespacePrefix}] was explicitly provided (via `;
      report += `a predicate [] on the vocabulary IRI [${vocabInfo.vocabularyIri}]).`;
    } else {
      if (
        vocabInfo.namespaceIri &&
        vocabInfo.namespaceIri === vocabInfo.localNamespaceIri
      ) {
        report = `FAIL-03 - Namespace IRI [${vocabInfo.namespaceIri}] matches the vocabulary IRI, but they should really be different, as the concept of a namespace is distinct from the concept of a vocabulary (i.e., many vocabs can contribute terms to a single namespace (e.g., the W3C PROV set of vocabs)).`;
      } else {
        report = `FAIL-04 - Namespace IRI [${vocabInfo.namespaceIri}] had to be determined by heuristic (instead of being explicitly stated by the vocab itself via VANN, or SHACL predicates).`;
      }
    }

    reportSoFar.bpReport_0 = report;
    return report;
  }

  static complianceBp_namespaceIriDifferentThanVocabularyIri(
    vocabInfo,
    reportSoFar,
  ) {
    let report = undefined;

    if (vocabInfo.vocabularyIri !== vocabInfo.namespaceIri) {
      if (vocabInfo.vocabularyIriOverride || vocabInfo.namespaceIriOverride) {
        report = `FAIL-02 - Vocabulary IRI [${vocabInfo.vocabularyIri}] is different from the namespace IRI [${vocabInfo.namespaceIri}], but we had to provide an override (i.e., 'vocabularyIriOverride': [${vocabInfo.vocabularyIriOverride}], 'namespaceIriOverride': [${vocabInfo.namespaceIriOverride}]).`;
      } else {
        report = `PASS-01 - Vocabulary IRI [${vocabInfo.vocabularyIri}] is different from the namespace IRI [${vocabInfo.namespaceIri}] (and there was no need to provide overrides for either).`;
      }
    } else {
      if (
        vocabInfo.namespaceIri &&
        vocabInfo.namespaceIri === vocabInfo.localNamespaceIri
      ) {
        report = `FAIL-03 - Namespace IRI [${vocabInfo.namespaceIri}] matches the vocabulary IRI, but they should really be different, as the concept of a namespace is distinct from the concept of a vocabulary (i.e., many vocabs can contribute terms to a single namespace (e.g., the W3C PROV set of vocabs)).`;
      } else {
        report = `FAIL-04 - Namespace IRI [${vocabInfo.namespaceIri}] had to be determined by heuristic (instead of being explicitly stated by the vocab itself via VANN, or SHACL predicates).`;
      }
    }

    reportSoFar.bpReport_0 = report;
    return report;
  }

  static complianceBp_1(vocabInfo, reportSoFar) {
    let report = undefined;
    reportSoFar.termsWithIsDefinedBy = vocabInfo.classes
      .filter((term) => term.isDefinedBys)
      .concat(vocabInfo.properties.filter((term) => term.isDefinedBys));

    const termsWithIsDefinedByCount = reportSoFar.termsWithIsDefinedBy.length;

    if (termsWithIsDefinedByCount === 0) {
      report = `None of the [${reportSoFar.totalTermCount}] terms have any 'rdfs:isDefinedBy' triples.`;
    } else {
      if (termsWithIsDefinedByCount === reportSoFar.totalTermCount) {
        report = `All [${reportSoFar.totalTermCount}] terms have 'rdfs:isDefinedBy' triples.`;
      } else {
        report = `Only [${termsWithIsDefinedByCount}] terms have 'rdfs:isDefinedBy' triples, of [${reportSoFar.totalTermCount}].`;

        const showFirstX = BestPracticeReportGenerator.DISPLAY_TERM_LIMIT;
        const missing = Array.from(
          vocabInfo.classes
            .filter((term) => !term.isDefinedBys)
            .concat(vocabInfo.properties.filter((term) => !term.isDefinedBys)),
        ).map((elem) => elem.name);

        if (missing.length > showFirstX) {
          report += ` Missing [${
            missing.length
          }] (but only displaying the first ${showFirstX}): [${missing
            .slice(0, showFirstX)
            .join(", ")}].`;
        } else {
          report += ` Missing [${missing.length}]: [${missing.join(", ")}].`;
        }
      }
    }

    reportSoFar.bpReport_1 = report;
    return report;
  }

  static complianceBp_2(vocabInfo, reportSoFar) {
    let report = undefined;
    if (reportSoFar.termsWithIsDefinedBy.length === 0) {
      report = `Not applicable - as none of our [${reportSoFar.totalTermCount}] terms have 'rdfs:isDefinedBy' triples.`;
    } else {
      const matchVocabularyIri = BestPracticeReportGenerator.isDefinedByIri(
        reportSoFar.termsWithIsDefinedBy,
        vocabInfo.vocabularyIri,
      );

      if (
        matchVocabularyIri.length === reportSoFar.termsWithIsDefinedBy.length
      ) {
        report = `All [${reportSoFar.termsWithIsDefinedBy.length}] terms that have 'rdfs:isDefinedBy' triples (of the [${reportSoFar.totalTermCount}] total terms) are defined by the vocabulary IRI of [${vocabInfo.vocabularyIri}].`;
      } else {
        if (matchVocabularyIri.length === 0) {
          report = `None of the [${reportSoFar.termsWithIsDefinedBy.length}] terms that have 'rdfs:isDefinedBy' triples (of the [${reportSoFar.totalTermCount}] total terms) are defined by the vocabulary IRI of [${vocabInfo.vocabularyIri}].`;
        } else {
          report = `Only [${matchVocabularyIri.length}] terms of the total [${reportSoFar.termsWithIsDefinedBy.length}] that have 'rdfs:isDefinedBy' triples (of the [${reportSoFar.totalTermCount}] total terms) are defined by the vocabulary IRI of [${vocabInfo.vocabularyIri}].`;
        }

        const matchStrippedNamespace =
          BestPracticeReportGenerator.isDefinedByIri(
            reportSoFar.termsWithIsDefinedBy,
            vocabInfo.namespaceIri.slice(0, -1),
          );
        if (matchStrippedNamespace.length > 0) {
          report += ` But [${
            matchStrippedNamespace.length
          }] terms match the stripped namespace IRI of [${vocabInfo.namespaceIri.slice(
            0,
            -1,
          )}]...`;
        }

        const { termsDefinedByOtherIri, otherIris } =
          BestPracticeReportGenerator.isDefinedByOtherIri(
            reportSoFar.termsWithIsDefinedBy,
            [vocabInfo.namespaceIri, vocabInfo.namespaceIri.slice(0, -1)],
          );

        // Check first for what we expect to be the most common case of terms
        // that do provide a 'defined by' triple all pointing to a single
        // different, non-namespace IRI.
        if (
          otherIris.length === 1 &&
          termsDefinedByOtherIri.length ===
            reportSoFar.termsWithIsDefinedBy.length
        ) {
          report += ` But all [${reportSoFar.termsWithIsDefinedBy.length}] terms with 'rdfs:isDefinedBy' do reference just one other, non-vocab-namespace IRI of [${otherIris[0]}].`;
        } else {
          if (otherIris.length > 0) {
            let isAllTerms = "";
            if (
              termsDefinedByOtherIri.length ===
              reportSoFar.termsWithIsDefinedBy.length
            ) {
              isAllTerms = "all ";
            }

            report += ` But ${isAllTerms}[${
              termsDefinedByOtherIri.length
            }] terms with 'rdfs:isDefinedBy' did reference [${
              otherIris.length
            }] other IRIs: [${otherIris.join(", ")}].`;
          }
        }
      }
    }

    reportSoFar.bpReport_2 = report;
    return report;
  }

  static isDefinedByIri(termsWithIsDefinedBy, iri) {
    return termsWithIsDefinedBy.filter((term) =>
      Array.from(term.isDefinedBys).find(
        (definedBy) => definedBy.isDefinedBy === iri,
      ),
    );
  }

  static isDefinedByOtherIri(termsWithIsDefinedBy, ignoreIris) {
    const otherIris = new Set();

    const termsDefinedByOtherIri = termsWithIsDefinedBy.filter((term) => {
      const otherIri = Array.from(term.isDefinedBys).filter(
        (termIri) => !ignoreIris.includes(termIri.isDefinedBy),
      );
      if (otherIri.length > 0) {
        otherIri.forEach((match) => otherIris.add(match.isDefinedBy));
      }
      return otherIri.length > 0;
    });

    return {
      termsDefinedByOtherIri: Array.from(termsDefinedByOtherIri),
      otherIris: Array.from(otherIris),
    };
  }
}

module.exports = BestPracticeReportGenerator;
