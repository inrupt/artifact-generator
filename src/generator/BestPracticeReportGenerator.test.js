const BestPracticeReportGenerator = require("./BestPracticeReportGenerator");

describe("Best practices report generator", () => {
  const NAMESPACE_IRI_1 = "https://namespace.example.com/vocab/1/";
  const NAMESPACE_IRI_2 = "https://namespace.example.com/vocab/2/";
  const NAMESPACE_IRI_3 = "https://namespace.example.com/vocab/3/";
  const TEST_TERM_1 = `${NAMESPACE_IRI_1}testTerm1`;

  const emptyVocab = {
    classes: [],
    properties: [],
    totalTermCount: 0,
  };

  describe("setup", () => {
    it("should ", () => {
      expect(BestPracticeReportGenerator.DISPLAY_TERM_LIMIT).toBe(5);
    });
  });

  describe("should generate an empty report", () => {
    it("should generate empty report", () => {
      const report = BestPracticeReportGenerator.buildComplianceReport(
        emptyVocab,
        {},
      );
      expect(report.totalTermCount).toEqual(0);
    });
  });
  //
  // describe("BP-0", () => {
  //   it("should throw if no namespace IRI override", () => {
  //     const result =
  //       BestPracticeReportGenerator.complianceBp_namespaceIriProvidedExplicitly(
  //         emptyVocab,
  //         {}
  //       );
  //     expect(result).toContain("had to be determined by heuristic");
  //   });
  //
  //   it("should override namespace IRI", () => {
  //     const namespaceIri = "https://some.com/namespace/";
  //     const someOverride = "https://some-override.com/namespace/";
  //
  //     const result =
  //       BestPracticeReportGenerator.complianceBp_namespaceIriProvidedExplicitly(
  //         {
  //           namespaceIri,
  //           namespaceIriOverride: someOverride,
  //         },
  //         {}
  //       );
  //
  //     expect(result).toContain("FAIL");
  //     expect(result).toContain(someOverride);
  //   });
  //
  //   it("override namespace IRI should match namespace IRI", () => {
  //     const someOverride = "https://some-override.com/namespace/";
  //     const result =
  //       BestPracticeReportGenerator.complianceBp_namespaceIriProvidedExplicitly(
  //         {
  //           namespaceIri: someOverride,
  //           localNamespaceIri: someOverride,
  //         },
  //         {}
  //       );
  //     expect(result).toContain("PASS");
  //     expect(result).toContain(someOverride);
  //   });
  // });
  //
  // describe("BP-1", () => {
  //   it("should report no terms for empty vocab", () => {
  //     expect(
  //       BestPracticeReportGenerator.complianceBp_1(emptyVocab, {
  //         totalTermCount: 0,
  //       })
  //     ).toContain("None of the [0] terms");
  //   });
  //
  //   it("should report that all terms have 'rdfs:isDefinedBy' triples", () => {
  //     const report = BestPracticeReportGenerator.complianceBp_1(
  //       {
  //         classes: [],
  //         properties: [
  //           {
  //             isDefinedBys: [NAMESPACE_IRI_1],
  //           },
  //         ],
  //       },
  //       {
  //         totalTermCount: 1,
  //       }
  //     );
  //
  //     expect(report).toContain("All [1] terms have");
  //   });
  //
  //   it("should report only some terms have 'rdfs:isDefinedBy' triples", () => {
  //     const report = BestPracticeReportGenerator.complianceBp_1(
  //       {
  //         classes: [],
  //         properties: [
  //           { name: TEST_TERM_1 },
  //           {
  //             isDefinedBys: [NAMESPACE_IRI_1],
  //           },
  //         ],
  //       },
  //       {
  //         totalTermCount: 2,
  //       }
  //     );
  //
  //     expect(report).toContain("Only [1] terms");
  //     expect(report).toContain("of [2]");
  //     expect(report).toContain(TEST_TERM_1);
  //   });
  //
  //   it("should report only first X terms missing 'rdfs:isDefinedBy' triples", () => {
  //     const displayLimit = BestPracticeReportGenerator.DISPLAY_TERM_LIMIT;
  //     const props = [];
  //     [...Array(displayLimit + 1).keys()].forEach((i) =>
  //       props.push({ name: `${NAMESPACE_IRI_1}testTerm_${i}` })
  //     );
  //
  //     const report = BestPracticeReportGenerator.complianceBp_1(
  //       {
  //         classes: [
  //           {
  //             name: `${NAMESPACE_IRI_1}includeClassTermForCoverage`,
  //             isDefinedBys: [NAMESPACE_IRI_1],
  //           },
  //         ],
  //         properties: [
  //           ...props,
  //           {
  //             isDefinedBys: [NAMESPACE_IRI_1],
  //           },
  //         ],
  //       },
  //       {
  //         totalTermCount: props.length + 2,
  //       }
  //     );
  //
  //     expect(report).toContain("Only [2] terms");
  //     expect(report).toContain(`of [${props.length + 2}]`);
  //     [...Array(displayLimit).keys()].forEach((i) =>
  //       expect(report).toContain(props[i].name)
  //     );
  //     expect(report).not.toContain(props[displayLimit].name);
  //   });
  // });
  //
  // describe("BP-2", () => {
  //   it("should report not applicable if no terms have 'rdfs:isDefinedBy' triples", () => {
  //     const report = BestPracticeReportGenerator.complianceBp_2(
  //       {
  //         classes: [],
  //         properties: [{}, {}],
  //       },
  //       {
  //         totalTermCount: 2,
  //         termsWithIsDefinedBy: [],
  //       }
  //     );
  //
  //     expect(report).toContain("Not applicable");
  //   });
  //
  //   it("should report all terms 'rdfs:isDefinedBy' namespace IRI", () => {
  //     const termLimit = 3;
  //     const props = [];
  //     [...Array(termLimit).keys()].forEach((i) =>
  //       props.push({
  //         name: `${NAMESPACE_IRI_1}testTerm_${i}`,
  //         isDefinedBys: [{ isDefinedBy: NAMESPACE_IRI_1 }],
  //       })
  //     );
  //
  //     const report = BestPracticeReportGenerator.complianceBp_2(
  //       {
  //         namespaceIri: NAMESPACE_IRI_1,
  //         classes: [],
  //         properties: props,
  //       },
  //       {
  //         totalTermCount: termLimit,
  //         termsWithIsDefinedBy: props,
  //       }
  //     );
  //
  //     expect(report).toContain(`All [${termLimit}] terms`);
  //     expect(report).toContain(`namespace IRI of [${NAMESPACE_IRI_1}]`);
  //   });
  //
  //   it("should report all terms 'rdfs:isDefinedBy' namespace IRI stripped of last character", () => {
  //     const termLimit = 3;
  //     const strippedNamespaceIri = NAMESPACE_IRI_1.slice(0, -1);
  //     const props = [];
  //     [...Array(termLimit).keys()].forEach((i) =>
  //       props.push({
  //         name: `${NAMESPACE_IRI_1}testTerm_${i}`,
  //         isDefinedBys: [{ isDefinedBy: strippedNamespaceIri }],
  //       })
  //     );
  //
  //     const report = BestPracticeReportGenerator.complianceBp_2(
  //       {
  //         namespaceIri: NAMESPACE_IRI_1,
  //         classes: [],
  //         properties: props,
  //       },
  //       {
  //         totalTermCount: termLimit,
  //         termsWithIsDefinedBy: props,
  //       }
  //     );
  //
  //     expect(report).toContain(`None of the [${termLimit}] terms`);
  //     expect(report).toContain(`namespace IRI of [${NAMESPACE_IRI_1}]`);
  //     expect(report).toContain(`But [${termLimit}] terms`);
  //     expect(report).toContain(
  //       `stripped namespace IRI of [${strippedNamespaceIri}]`
  //     );
  //   });
  //
  //   it("should report none of the terms with 'rdfs:isDefinedBy' use our namespace IRI", () => {
  //     const termLimit = 3;
  //     const props = [];
  //     [...Array(termLimit).keys()].forEach((i) =>
  //       props.push({
  //         name: `${NAMESPACE_IRI_1}testTerm_${i}`,
  //         isDefinedBys: [{ isDefinedBy: NAMESPACE_IRI_2 }],
  //       })
  //     );
  //
  //     const report = BestPracticeReportGenerator.complianceBp_2(
  //       {
  //         namespaceIri: NAMESPACE_IRI_1,
  //         classes: [],
  //         properties: props,
  //       },
  //       {
  //         totalTermCount: termLimit,
  //         termsWithIsDefinedBy: props,
  //       }
  //     );
  //
  //     expect(report).toContain(`None of the [${termLimit}] terms`);
  //     expect(report).toContain(`namespace IRI of [${NAMESPACE_IRI_1}]`);
  //     expect(report).toContain(`But all [${termLimit}] terms`);
  //     expect(report).toContain(`just one other`);
  //     expect(report).toContain(
  //       `non-vocab-namespace IRI of [${NAMESPACE_IRI_2}]`
  //     );
  //   });
  //
  //   it("should report *ALL* terms have 'rdfs:isDefinedBy' matching namespace IRI, but others defined by different namespace IRI", () => {
  //     const termLimit = 3;
  //     const props = [];
  //     [...Array(termLimit).keys()].forEach((i) =>
  //       props.push({
  //         name: `${NAMESPACE_IRI_1}testTerm_${i}`,
  //         isDefinedBys: [{ isDefinedBy: NAMESPACE_IRI_2 }],
  //       })
  //     );
  //
  //     const report = BestPracticeReportGenerator.complianceBp_2(
  //       {
  //         namespaceIri: NAMESPACE_IRI_1,
  //         classes: [],
  //         properties: props,
  //       },
  //       {
  //         totalTermCount: termLimit,
  //         termsWithIsDefinedBy: props,
  //       }
  //     );
  //
  //     expect(report).toContain(`None of the [${termLimit}]`);
  //     expect(report).toContain(NAMESPACE_IRI_1);
  //     expect(report).toContain(`But all [${termLimit}] terms`);
  //     expect(report).toContain(NAMESPACE_IRI_2);
  //   });
  //
  //   it("should report *SOME* terms have 'rdfs:isDefinedBy' matching namespace IRI, but others defined by different namespace IRI", () => {
  //     const termLimit = 3;
  //     const props = [];
  //     [...Array(termLimit).keys()].forEach((i) => {
  //       if (i === 1) {
  //         props.push({
  //           name: `${NAMESPACE_IRI_1}testTerm_${i}`,
  //           isDefinedBys: [{ isDefinedBy: NAMESPACE_IRI_2 }],
  //         });
  //       } else {
  //         props.push({
  //           name: `${NAMESPACE_IRI_1}testTerm_${i}`,
  //           isDefinedBys: [{ isDefinedBy: NAMESPACE_IRI_1 }],
  //         });
  //       }
  //     });
  //
  //     const report = BestPracticeReportGenerator.complianceBp_2(
  //       {
  //         namespaceIri: NAMESPACE_IRI_1,
  //         classes: [],
  //         properties: props,
  //       },
  //       {
  //         totalTermCount: termLimit,
  //         termsWithIsDefinedBy: props,
  //       }
  //     );
  //
  //     expect(report).toContain("Only [2]");
  //     expect(report).toContain(NAMESPACE_IRI_1);
  //     expect(report).toContain("But [1] terms");
  //     expect(report).toContain(NAMESPACE_IRI_2);
  //   });
  //
  //   it("should report *ALL* terms have 'rdfs:isDefinedBy' matching multiple different namespace IRIs", () => {
  //     const termLimit = 3;
  //     const props = [];
  //     [...Array(termLimit).keys()].forEach((i) => {
  //       props.push({
  //         name: `${NAMESPACE_IRI_1}testTerm_${i}`,
  //         isDefinedBys: [
  //           { isDefinedBy: NAMESPACE_IRI_2 },
  //           { isDefinedBy: NAMESPACE_IRI_3 },
  //         ],
  //       });
  //     });
  //
  //     const report = BestPracticeReportGenerator.complianceBp_2(
  //       {
  //         namespaceIri: NAMESPACE_IRI_1,
  //         classes: [],
  //         properties: props,
  //       },
  //       {
  //         totalTermCount: termLimit,
  //         termsWithIsDefinedBy: props,
  //       }
  //     );
  //
  //     expect(report).toContain(`None of the [${termLimit}]`);
  //     expect(report).toContain(NAMESPACE_IRI_1);
  //     expect(report).toContain(`But all [${termLimit}] terms`);
  //     expect(report).toContain(`did reference [2] other IRIs`);
  //     expect(report).toContain(NAMESPACE_IRI_2);
  //     expect(report).toContain(NAMESPACE_IRI_3);
  //   });
  // });
});
