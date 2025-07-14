import { expect, test } from "@playwright/test";
import type { BaseField } from "../../../frontend/utils/fieldGrouping";
import { groupFields } from "../../../frontend/utils/fieldGrouping";

const FIELD_PAIRS: [string, string][] = [
  ["abartn", "accountNumber"],
  ["address.state", "address.postCode"],
];

test.describe("groupFields", () => {
  test("groups routing number and account number together", () => {
    const fields: BaseField[] = [{ key: "abartn" }, { key: "accountNumber" }, { key: "other" }];

    const result = groupFields(fields, FIELD_PAIRS);

    expect(result).toEqual([[{ key: "abartn" }, { key: "accountNumber" }], [{ key: "other" }]]);
  });

  test("groups address state and post code together", () => {
    const fields: BaseField[] = [{ key: "address.state" }, { key: "address.postCode" }, { key: "other" }];

    const result = groupFields(fields, FIELD_PAIRS);

    expect(result).toEqual([[{ key: "address.state" }, { key: "address.postCode" }], [{ key: "other" }]]);
  });

  test("handles individual fields that are not part of pairs", () => {
    const fields: BaseField[] = [{ key: "field1" }, { key: "field2" }, { key: "field3" }];

    const result = groupFields(fields, FIELD_PAIRS);

    expect(result).toEqual([[{ key: "field1" }], [{ key: "field2" }], [{ key: "field3" }]]);
  });

  test("handles complex grouping with both pairs and individual fields", () => {
    const fields: BaseField[] = [
      { key: "field1" },
      { key: "abartn" },
      { key: "field2" },
      { key: "accountNumber" },
      { key: "address.state" },
      { key: "field3" },
      { key: "address.postCode" },
    ];

    const result = groupFields(fields, FIELD_PAIRS);

    expect(result).toEqual([
      [{ key: "field1" }],
      [{ key: "abartn" }, { key: "accountNumber" }],
      [{ key: "field2" }],
      [{ key: "address.state" }, { key: "address.postCode" }],
      [{ key: "field3" }],
    ]);
  });

  test("handles empty field array", () => {
    const fields: BaseField[] = [];

    const result = groupFields(fields, FIELD_PAIRS);

    expect(result).toEqual([]);
  });

  test("handles single field from a pair", () => {
    const fields: BaseField[] = [{ key: "abartn" }, { key: "other" }];

    const result = groupFields(fields, FIELD_PAIRS);

    expect(result).toEqual([[{ key: "abartn" }], [{ key: "other" }]]);
  });

  test("preserves field order within groups", () => {
    const fields: BaseField[] = [{ key: "accountNumber" }, { key: "abartn" }];

    const result = groupFields(fields, FIELD_PAIRS);

    expect(result).toEqual([[{ key: "accountNumber" }, { key: "abartn" }]]);
  });
});
