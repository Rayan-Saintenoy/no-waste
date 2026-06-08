export const parseWeightToKg = (quantityStr) => {
  if (!quantityStr) return 0;

  const match = quantityStr
    .toLowerCase()
    .replace(",", ".")
    .match(/([\d.]+)\s*([a-z]+)/);

  if (!match) {
    const fallbackValue = parseFloat(quantityStr.replace(",", "."));
    return isNaN(fallbackValue) ? 0 : fallbackValue;
  }

  const value = parseFloat(match[1]);
  const unit = match[2];

  switch (unit) {
    case "kg":
    case "l":
      return value;
    case "g":
    case "ml":
      return value / 1000;
    case "cl":
      return value / 100;
    case "mg":
      return value / 1000000;
    default:
      return value;
  }
};
