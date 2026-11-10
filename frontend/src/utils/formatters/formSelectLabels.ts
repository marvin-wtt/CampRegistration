export type SelectLabel = string | Record<string, string>;

export type SelectOptions = Record<string, SelectLabel>;

// The untranslated labels of a choice answer, one or several (checkbox, tag
// box), in the form's choice order: a checkbox stores its selections in click
// order. Values without a choice (an "other" text) follow as stored. Undefined
// when no value matches a choice, so callers show the raw value.
export function formSelectLabels(
  value: unknown,
  options: SelectOptions | undefined,
): SelectLabel[] | undefined {
  if (!options || value == null) {
    return undefined;
  }

  const values = (Array.isArray(value) ? value : [value]).map(String);
  const known = Object.keys(options).filter((key) => values.includes(key));
  if (known.length === 0) {
    return undefined;
  }

  const unknown = values.filter((v) => !Object.hasOwn(options, v));

  return [...known.map((key) => options[key] ?? key), ...unknown];
}
