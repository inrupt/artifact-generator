const debug = require("debug")(
  "artifact-generator:BestPracticeReportGenerator"
);

class BestPracticeReportGenerator {
  static get DISPLAY_TERM_LIMIT() {
    return 5;
  }

  static buildComplianceReport(vocabInfo) {
    const reportSoFar = {};

    debug("Generating Best Practice Report");
    reportSoFar.totalTermCount =
      vocabInfo.classes.length + vocabInfo.properties.length;

    reportSoFar.bpReport_0 = BestPracticeReportGenerator.complianceBp_0(
      vocabInfo,
      reportSoFar
    );

    reportSoFar.bpReport_1 = BestPracticeReportGenerator.complianceBp_1(
      vocabInfo,
      reportSoFar
    );

    reportSoFar.bpReport_2 = BestPracticeReportGenerator.complianceBp_2(
      vocabInfo,
      reportSoFar
    );

    return reportSoFar;
  }

  static complianceBp_0(vocabInfo, reportSoFar) {
    let report = undefined;

    if (vocabInfo.namespaceIriOverride) {
      report = `Local namespace IRI [${vocabInfo.localNamespaceIri}] was specifically overridden with [${vocabInfo.namespaceIriOverride}] (either it wasn't explicitly stated by the vocab itself via VANN, or SHACL predicates. or there were multiple ontologies in the input, or it couldn't be correctly determined heuristically).`;
    } else {
      if (
        vocabInfo.namespaceIri &&
        vocabInfo.namespaceIri === vocabInfo.localNamespaceIri
      ) {
        report = `Namespace IRI [${vocabInfo.namespaceIri}] matches the vocab Subject IRI too.`;
      } else {
        report = `Namespace IRI [${vocabInfo.namespaceIri}] has to be determined by heuristic (instead of being explicitly stated by the vocab itself via VANN, or SHACL predicates).`;
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
            .concat(vocabInfo.properties.filter((term) => !term.isDefinedBys))
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
      const matchNamespace = BestPracticeReportGenerator.isDefinedByIri(
        reportSoFar.termsWithIsDefinedBy,
        vocabInfo.namespaceIri
      );

      if (matchNamespace.length === reportSoFar.termsWithIsDefinedBy.length) {
        report = `All [${reportSoFar.termsWithIsDefinedBy.length}] terms that have 'rdfs:isDefinedBy' triples (of the [${reportSoFar.totalTermCount}] total terms) are defined by the vocab namespace IRI of [${vocabInfo.namespaceIri}].`;
      } else {
        if (matchNamespace.length === 0) {
          report = `None of the [${reportSoFar.termsWithIsDefinedBy.length}] terms that have 'rdfs:isDefinedBy' triples (of the [${reportSoFar.totalTermCount}] total terms) are defined by the vocab namespace IRI of [${vocabInfo.namespaceIri}].`;
        } else {
          report = `Only [${matchNamespace.length}] terms of the total [${reportSoFar.termsWithIsDefinedBy.length}] that have 'rdfs:isDefinedBy' triples (of the [${reportSoFar.totalTermCount}] total terms) are defined by the vocab namespace IRI of [${vocabInfo.namespaceIri}].`;
        }

        const matchStrippedNamespace =
          BestPracticeReportGenerator.isDefinedByIri(
            reportSoFar.termsWithIsDefinedBy,
            vocabInfo.namespaceIri.slice(0, -1)
          );
        if (matchStrippedNamespace.length > 0) {
          report += ` But [${
            matchStrippedNamespace.length
          }] terms match the stripped namespace IRI of [${vocabInfo.namespaceIri.slice(
            0,
            -1
          )}]...`;
        }

        const { termsDefinedByOtherIri, otherIris } =
          BestPracticeReportGenerator.isDefinedByOtherIri(
            reportSoFar.termsWithIsDefinedBy,
            [vocabInfo.namespaceIri, vocabInfo.namespaceIri.slice(0, -1)]
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
        (definedBy) => definedBy.isDefinedBy === iri
      )
    );
  }

  static isDefinedByOtherIri(termsWithIsDefinedBy, ignoreIris) {
    const otherIris = new Set();

    const termsDefinedByOtherIri = termsWithIsDefinedBy.filter((term) => {
      const otherIri = Array.from(term.isDefinedBys).filter(
        (termIri) => !ignoreIris.includes(termIri.isDefinedBy)
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
