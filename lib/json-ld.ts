export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function latestIsoDate(...values: Array<string | undefined>) {
  const validValues = values.filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value!)));

  return validValues.reduce<string | undefined>((latest, value) => {
    if (!latest) return value;
    return Date.parse(value) > Date.parse(latest) ? value : latest;
  }, undefined);
}
