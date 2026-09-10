export type DietFilter = "veg" | "nonveg" | "both";

const NON_VEG_LATIN =
  /\b(chicken|mutton|beef|pork|lamb|goat|ham|bacon|pepperoni|salami|sausage|prawns?|shrimp|fish|eggs?|murgh|murgi|gosht|keema|turkey|duck|meat)\b/i;

const NON_VEG_HI =
  /चिकन|मुर्गा|मुर्गी|मटन|गोश्त|बीफ|पोर्क|हैम|बेकन|पेपरोनी|अंडा|अण्डा|झींगा|मछली|प्रॉन|मांस/;

export type DietItem = {
  name?: string | null;
  name_hi?: string | null;
  description?: string | null;
  description_hi?: string | null;
  is_veg?: boolean | null;
};

function dietText(item: DietItem): string {
  return [item.name, item.name_hi, item.description, item.description_hi]
    .filter(Boolean)
    .join(" ");
}

export function itemMentionsNonVeg(item: DietItem): boolean {
  const text = dietText(item);
  if (!text.trim()) return false;
  return NON_VEG_LATIN.test(text) || NON_VEG_HI.test(text);
}

/** True when staff marked non-veg or the name/description is clearly meat. */
export function isNonVegMenuItem(item: DietItem): boolean {
  if (item.is_veg === false) return true;
  return itemMentionsNonVeg(item);
}

export function matchesDietFilter(item: DietItem, filter: DietFilter): boolean {
  if (filter === "veg") return !isNonVegMenuItem(item);
  if (filter === "nonveg") return isNonVegMenuItem(item);
  return true;
}
