import { cloneDeep, partition } from "lodash-es";

export interface BaseField {
  key: string;
}

export function groupFields<T extends BaseField>(fields: T[], fieldPairs: [string, string][]): T[][] {
  const result: T[][] = [];

  // ensures the original fields param is not mutated
  let allFields: T[] = cloneDeep(fields);

  while (allFields.length > 0) {
    const fieldPair = fieldPairs.find((pair) => pair.includes(allFields[0]?.key ?? ""));
    if (fieldPair) {
      const [fieldGroup, otherFields] = partition(allFields, (field) => fieldPair.includes(field.key));
      result.push(fieldGroup);
      allFields = otherFields;
    } else {
      result.push(allFields.splice(0, 1));
    }
  }

  return result;
}
