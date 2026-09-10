export type CustomerLocale = "en" | "hi";

const COPY = {
  en: {
    callWaiter: "Call waiter",
    requestBill: "Request bill",
    waiterSent: "Waiter notified",
    billSent: "Bill requested",
    waitTime: "Est. wait",
    minutes: "min",
    wifi: "Wi-Fi",
    busy: "Kitchen is full — new orders are paused. Please wait or ask staff.",
    veg: "Veg",
    jain: "Jain",
    all: "All",
    notes: "Notes for kitchen",
    notesPlaceholder: "e.g. less sugar, no onion",
    spice: "Spice",
    mild: "Mild",
    medium: "Medium",
    hot: "Hot",
    none: "No spice",
    coupon: "Coupon code",
    apply: "Apply",
    loyalty: "Loyalty points",
    redeem: "Redeem",
    takeaway: "Takeaway",
    dineIn: "Dine in",
    reorder: "Reorder last",
    splitBill: "Split bill",
    splitBetween: "Split between",
    eachPays: "Each pays",
    sendWhatsApp: "Send bill on WhatsApp",
    reserve: "Reserve a table",
    language: "हिन्दी",
  },
  hi: {
    callWaiter: "वेटर बुलाएँ",
    requestBill: "बिल मँगवाएँ",
    waiterSent: "वेटर को सूचना गई",
    billSent: "बिल का अनुरोध गया",
    waitTime: "अनुमानित प्रतीक्षा",
    minutes: "मिनट",
    wifi: "वाई-फाई",
    busy: "किचन व्यस्त है — नए ऑर्डर रुक गए हैं। कृपया प्रतीक्षा करें।",
    veg: "वेज",
    jain: "जैन",
    all: "सभी",
    notes: "किचन के लिए नोट",
    notesPlaceholder: "जैसे कम चीनी, प्याज़ नहीं",
    spice: "मिर्च",
    mild: "कम",
    medium: "मध्यम",
    hot: "तेज़",
    none: "नहीं",
    coupon: "कूपन कोड",
    apply: "लागू करें",
    loyalty: "लॉयल्टी अंक",
    redeem: "रिडीम",
    takeaway: "पार्सल",
    dineIn: "टेबल पर",
    reorder: "पिछला ऑर्डर दोहराएँ",
    splitBill: "बिल बाँटें",
    splitBetween: "बाँटें",
    eachPays: "प्रत्येक का हिस्सा",
    sendWhatsApp: "व्हाट्सऐप पर बिल भेजें",
    reserve: "टेबल बुक करें",
    language: "English",
  },
} as const;

export type CustomerCopy = {
  callWaiter: string;
  requestBill: string;
  waiterSent: string;
  billSent: string;
  waitTime: string;
  minutes: string;
  wifi: string;
  busy: string;
  veg: string;
  jain: string;
  all: string;
  notes: string;
  notesPlaceholder: string;
  spice: string;
  mild: string;
  medium: string;
  hot: string;
  none: string;
  coupon: string;
  apply: string;
  loyalty: string;
  redeem: string;
  takeaway: string;
  dineIn: string;
  reorder: string;
  splitBill: string;
  splitBetween: string;
  eachPays: string;
  sendWhatsApp: string;
  reserve: string;
  language: string;
};

export function getCustomerCopy(locale: CustomerLocale): CustomerCopy {
  return COPY[locale] || COPY.en;
}

export function displayItemName(
  item: { name: string; name_hi?: string | null },
  locale: CustomerLocale
): string {
  if (locale === "hi" && item.name_hi?.trim()) return item.name_hi.trim();
  return item.name;
}

export function displayItemDescription(
  item: { description: string; description_hi?: string | null },
  locale: CustomerLocale
): string {
  if (locale === "hi" && item.description_hi?.trim()) return item.description_hi.trim();
  return item.description || "";
}
