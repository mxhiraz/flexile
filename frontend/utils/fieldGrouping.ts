import { cloneDeep, partition } from "lodash-es";

export interface BaseField {
  key: string;
}

export function groupFields<T extends BaseField>(fields: T[], fieldPairs: [string, string][]): T[][] {
  const result: T[][] = [];
  let allFields: T[] = cloneDeep(fields);

  while (allFields.length > 0) {
    const fieldPair = fieldPairs.find((pairs) => pairs.some((pair) => pair === allFields[0]?.key));
    if (fieldPair) {
      const [fieldGroup, otherFields] = partition(allFields, (field) => fieldPair.some((pair) => pair === field.key));
      result.push(fieldGroup);
      allFields = otherFields;
    } else {
      const field = allFields[0];
      if (field) {
        result.push([field]);
        allFields.shift();
      }
    }
  }

  return result;
}
