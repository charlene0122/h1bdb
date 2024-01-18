export function toTitleCase(str: string) {
  try {
    return str
      .replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
      })
      .replace("Ii", "II")
      .replace("Iii", "III")
      .replace("Iv", "IV")
      .replace("Llc", "LLC");
  } catch (e) {
    return str;
  }
}
