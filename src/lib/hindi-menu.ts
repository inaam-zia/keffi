/** Customer-facing Hindi for English/Hinglish menu text. Prefers known phrases, then words, then phonetic Devanagari. */

const PHRASES: Record<string, string> = {
  soup: "सूप",
  salads: "सलाद",
  salad: "सलाद",
  starters: "स्टार्टर्स",
  steam: "स्टीम",
  burgers: "बर्गर",
  burger: "बर्गर",
  sandwiches: "सैंडविच",
  sandwich: "सैंडविच",
  "from the wok": "वोक से",
  rice: "राइस",
  "sharing bites": "शेयरिंग बाइट्स",
  "mouth melting cheese bites": "माउथ-मेल्टिंग चीज़ बाइट्स",
  "teakuzz signatures": "टीकज़ सिग्नेचर",
  "pizza thin crust": "पिज़्ज़ा — थिन क्रस्ट",
  pasta: "पास्ता",
  desserts: "डेजर्ट",
  dessert: "डेजर्ट",
  "add ons": "ऐड-ऑन",
  "add on": "ऐड-ऑन",
  other: "अन्य",

  "hot and sour soup veg": "हॉट एंड सॉर सूप (वेज)",
  "hot and sour soup chicken": "हॉट एंड सॉर सूप (चिकन)",
  "manchow soup veg": "मंचो सूप (वेज)",
  "manchow soup chicken": "मंचो सूप (चिकन)",
  "classic caesar salad": "क्लासिक सीज़र सलाद",
  "pickled fruits and nut salad with feta cheese": "पिकल्ड फ्रूट्स एंड नट सलाद विद फ़ेटा चीज़",
  "golden silk spring roll": "गोल्डन सिल्क स्प्रिंग रोल",
  "chicken teriyaki spring roll": "चिकन टेरियाकी स्प्रिंग रोल",
  "street chilli chicken": "स्ट्रीट चिली चिकन",
  "street chili chicken": "स्ट्रीट चिली चिकन",
  "thai chilli paneer": "थाई चिली पनीर",
  "thai chili paneer": "थाई चिली पनीर",
  "crispy corn salt and pepper": "क्रिस्पी कॉर्न सॉल्ट एंड पेपर",
  "chongqing mushroom": "चोंगकिंग मशरूम",
  "honey chilli potato": "हनी चिली पोटैटो",
  "honey chili potato": "हनी चिली पोटैटो",
  "thai chicken dumpling": "थाई चिकन डम्पलिंग",
  "cream cheese truffle mushroom dumpling": "क्रीम चीज़ ट्रफल मशरूम डम्पलिंग",
  "jhol momo chicken": "झोल मोमो चिकन",
  "jhol momo veg": "झोल मोमो वेज",
  "tokyo veg katsu burger": "टोक्यो वेज कात्सु बर्गर",
  "seoul fried chicken burger": "सियोल फ्राइड चिकन बर्गर",
  "herb mushroom burger": "हर्ब मशरूम बर्गर",
  "thecha chicken burger": "ठेचा चिकन बर्गर",
  "chicken club sandwich": "चिकन क्लब सैंडविच",
  "korean crispy chicken sandwich": "कोरियन क्रिस्पी चिकन सैंडविच",
  "mouth melting vegetable cheese sandwich": "माउथ मेल्टिंग वेजिटेबल चीज़ सैंडविच",
  "tuscan mushroom melt": "टस्कन मशरूम मेल्ट",
  "wok tossed noodles": "वोक टॉस्ड नूडल्स",
  "masala maggi monsoon bowl": "मसाला मैगी मानसून बाउल",
  "spicy chilli bowl": "स्पाइसी चिली बाउल",
  "spicy chili bowl": "स्पाइसी चिली बाउल",
  "korean kimchi bowl": "कोरियन किम्ची बाउल",
  "chilli basil noodles": "चिली बेसिल नूडल्स",
  "chili basil noodles": "चिली बेसिल नूडल्स",
  "chilli garlic noodles": "चिली गार्लिक नूडल्स",
  "chili garlic noodles": "चिली गार्लिक नूडल्स",
  "singapore laksa bowl": "सिंगापुर लाक्सा बाउल",
  "chilli garlic fried rice": "चिली गार्लिक फ्राइड राइस",
  "chili garlic fried rice": "चिली गार्लिक फ्राइड राइस",
  "fried rice": "फ्राइड राइस",
  "chicken fried rice": "चिकन फ्राइड राइस",
  "salted fries": "सॉल्टेड फ्राइज़",
  "peri peri fries": "पेरी पेरी फ्राइज़",
  "cheese fries": "चीज़ फ्राइज़",
  "mexican potato wedges": "मेक्सिकन पोटैटो वेजेज़",
  "mozzarella cheese sticks": "मोत्सारेला चीज़ स्टिक्स",
  "cheese balls": "चीज़ बॉल्स",
  "crispy onion rings": "क्रिस्पी अनियन रिंग्स",
  "chipotle chicken taco": "चिपोटले चिकन टाको",
  "tangy cottage cheese taco": "टैंजी कॉटेज चीज़ टाको",
  "falafel platter": "फलाफल प्लैटर",
  "nachos with salsa and sour cream": "नाचोस विद साल्सा एंड सॉर क्रीम",
  "cheese garlic bread": "चीज़ गार्लिक ब्रेड",
  "margherita pizza": "मार्गेरिटा पिज़्ज़ा",
  "mutton pepperoni pizza": "मटन पेपरोनी पिज़्ज़ा",
  "chicken tikka pizza": "चिकन टिक्का पिज़्ज़ा",
  "bianca pizza": "बियांका पिज़्ज़ा",
  "farmhouse vegetable pizza": "फार्महाउस वेजिटेबल पिज़्ज़ा",
  "spaghetti pomodoro": "स्पैघेटी — पोमोडोरो",
  "spaghetti arrabbiata": "स्पैघेटी — अरबियाता",
  "spaghetti aglio e olio": "स्पैघेटी — अलियो ओलियो",
  "spaghetti alfredo": "स्पैघेटी — अल्फ्रेडो",
  "spaghetti pink sauce": "स्पैघेटी — पिंक सॉस",
  "penne pomodoro": "पेने — पोमोडोरो",
  "penne arrabbiata": "पेने — अरबियाता",
  "penne aglio e olio": "पेने — अलियो ओलियो",
  "penne alfredo": "पेने — अल्फ्रेडो",
  "penne pink sauce": "पेने — पिंक सॉस",
  "fettuccine pomodoro": "फेटुचिने — पोमोडोरो",
  "fettuccine arrabbiata": "फेटुचिने — अरबियाता",
  "fettuccine aglio e olio": "फेटुचिने — अलियो ओलियो",
  "fettuccine alfredo": "फेटुचिने — अल्फ्रेडो",
  "fettuccine pink sauce": "फेटुचिने — पिंक सॉस",
  "hot chocolate brownie": "हॉट चॉकलेट ब्राउनी",
  "chocolate crunch cake": "चॉकलेट क्रंच केक",
  "baked yogurt and granola": "बेक्ड योगर्ट एंड ग्रैनोला",
  "vegan chocolate cake": "वीगन चॉकलेट केक",
  "no bake cheesecake": "नो-बेक चीज़केक",
  "cottage cheese": "कॉटेज चीज़",
  "tomato basil sauce": "टमाटर बेसिल सॉस",
  "spicy tomato sauce": "स्पाइसी टमाटर सॉस",
  "garlic and olive oil": "लहसुन और ऑलिव ऑयल",
  "creamy cheese sauce": "क्रीमी चीज़ सॉस",
  "tomato cream sauce": "टमाटर-क्रीम सॉस",
  "soup salad or pasta": "सूप, सलाद या पास्ता",
  "pasta add on": "पास्ता ऐड-ऑन",
  "spring roll": "स्प्रिंग रोल",
  "fried chicken": "फ्राइड चिकन",
  "thin crust": "थिन क्रस्ट",
  "sour cream": "सॉर क्रीम",
  "olive oil": "ऑलिव ऑयल",
  "pink sauce": "पिंक सॉस",
};

const WORDS: Record<string, string> = {
  veg: "वेज",
  vegetarian: "वेज",
  vegetable: "वेजिटेबल",
  vegetables: "वेजिटेबल",
  chicken: "चिकन",
  mutton: "मटन",
  prawns: "प्रॉन्स",
  prawn: "प्रॉन",
  paneer: "पनीर",
  cheese: "चीज़",
  mushroom: "मशरूम",
  mushrooms: "मशरूम",
  potato: "पोटैटो",
  corn: "कॉर्न",
  onion: "अनियन",
  garlic: "गार्लिक",
  honey: "हनी",
  chilli: "चिली",
  chili: "चिली",
  spicy: "स्पाइसी",
  crispy: "क्रिस्पी",
  fried: "फ्राइड",
  hot: "हॉट",
  sour: "सॉर",
  salt: "सॉल्ट",
  salted: "सॉल्टेड",
  pepper: "पेपर",
  cream: "क्रीम",
  creamy: "क्रीमी",
  tomato: "टमाटर",
  basil: "बेसिल",
  sauce: "सॉस",
  pizza: "पिज़्ज़ा",
  pasta: "पास्ता",
  noodles: "नूडल्स",
  rice: "राइस",
  soup: "सूप",
  salad: "सलाद",
  burger: "बर्गर",
  sandwich: "सैंडविच",
  taco: "टाको",
  fries: "फ्राइज़",
  dumplings: "डम्पलिंग",
  dumpling: "डम्पलिंग",
  momo: "मोमो",
  bread: "ब्रेड",
  cake: "केक",
  brownie: "ब्राउनी",
  chocolate: "चॉकलेट",
  yogurt: "योगर्ट",
  granola: "ग्रैनोला",
  cheesecake: "चीज़केक",
  nachos: "नाचोस",
  salsa: "साल्सा",
  falafel: "फलाफल",
  platter: "प्लैटर",
  bowl: "बाउल",
  bites: "बाइट्स",
  combo: "कॉम्बो",
  offer: "ऑफ़र",
  offers: "ऑफ़र",
  item: "आइटम",
  classic: "क्लासिक",
  street: "स्ट्रीट",
  thai: "थाई",
  korean: "कोरियन",
  tokyo: "टोक्यो",
  seoul: "सियोल",
  singapore: "सिंगापुर",
  mexican: "मेक्सिकन",
  tuscan: "टस्कन",
  farmhouse: "फार्महाउस",
  vegan: "वीगन",
  baked: "बेक्ड",
  melt: "मेल्ट",
  melting: "मेल्टिंग",
  mouth: "माउथ",
  sharing: "शेयरिंग",
  signatures: "सिग्नेचर",
  teakuzz: "टीकज़",
  wok: "वोक",
  tossed: "टॉस्ड",
  masala: "मसाला",
  maggi: "मैगी",
  monsoon: "मानसून",
  kimchi: "किम्ची",
  laksa: "लाक्सा",
  peri: "पेरी",
  wedges: "वेजेज़",
  mozzarella: "मोत्सारेला",
  sticks: "स्टिक्स",
  balls: "बॉल्स",
  rings: "रिंग्स",
  chipotle: "चिपोटले",
  tangy: "टैंजी",
  cottage: "कॉटेज",
  herb: "हर्ब",
  thecha: "ठेचा",
  katsu: "कात्सु",
  club: "क्लब",
  teriyaki: "टेरियाकी",
  manchow: "मंचो",
  caesar: "सीज़र",
  feta: "फ़ेटा",
  pickled: "पिकल्ड",
  fruits: "फ्रूट्स",
  fruit: "फ्रूट",
  nut: "नट",
  nuts: "नट्स",
  golden: "गोल्डन",
  silk: "सिल्क",
  spring: "स्प्रिंग",
  roll: "रोल",
  chongqing: "चोंगकिंग",
  truffle: "ट्रफल",
  jhol: "झोल",
  spaghetti: "स्पैघेटी",
  penne: "पेने",
  fettuccine: "फेटुचिने",
  pomodoro: "पोमोडोरो",
  arrabbiata: "अरबियाता",
  alfredo: "अल्फ्रेडो",
  aglio: "अलियो",
  olio: "ओलियो",
  margherita: "मार्गेरिटा",
  pepperoni: "पेपरोनी",
  tikka: "टिक्का",
  bianca: "बियांका",
  crunch: "क्रंच",
  olive: "ऑलिव",
  oil: "ऑयल",
  pink: "पिंक",
  thin: "थिन",
  crust: "क्रस्ट",
  with: "विद",
  and: "एंड",
  from: "से",
  the: "",
  of: "ऑफ",
  or: "या",
  for: "के लिए",
  no: "नो",
  bake: "बेक",
  e: "ए",
};

const SORTED_PHRASES = Object.entries(PHRASES).sort((a, b) => b[0].length - a[0].length);

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[—–−]/g, " ")
    .replace(/&/g, " and ")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9\u0900-\u097F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isMostlyDevanagari(value: string): boolean {
  const letters = value.replace(/[^A-Za-z\u0900-\u097F]/g, "");
  if (!letters) return false;
  const hindi = (letters.match(/[\u0900-\u097F]/g) || []).length;
  return hindi >= letters.length * 0.6;
}

const DIGRAPHS: [string, string][] = [
  ["ksh", "क्ष"],
  ["sch", "श"],
  ["tch", "च"],
  ["chh", "छ"],
  ["aa", "आ"],
  ["ee", "ई"],
  ["ii", "ई"],
  ["oo", "ऊ"],
  ["au", "औ"],
  ["ai", "ऐ"],
  ["ou", "औ"],
  ["kh", "ख"],
  ["gh", "घ"],
  ["ch", "च"],
  ["jh", "झ"],
  ["th", "थ"],
  ["dh", "ध"],
  ["ph", "फ"],
  ["bh", "भ"],
  ["sh", "श"],
  ["ng", "ंग"],
  ["tr", "त्र"],
];

const LETTERS: Record<string, string> = {
  a: "अ",
  b: "ब",
  c: "क",
  d: "द",
  e: "ए",
  f: "फ",
  g: "ग",
  h: "ह",
  i: "इ",
  j: "ज",
  k: "क",
  l: "ल",
  m: "म",
  n: "न",
  o: "ओ",
  p: "प",
  q: "क",
  r: "र",
  s: "स",
  t: "ट",
  u: "उ",
  v: "व",
  w: "व",
  x: "क्स",
  y: "य",
  z: "ज़",
};

function transliterateWord(word: string): string {
  const lower = word.toLowerCase();
  let i = 0;
  let out = "";
  while (i < lower.length) {
    let matched = false;
    for (const [en, hi] of DIGRAPHS) {
      if (lower.startsWith(en, i)) {
        out += hi;
        i += en.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    out += LETTERS[lower[i]] || lower[i];
    i += 1;
  }
  return out || word;
}

function translateWord(word: string): string {
  const key = word.toLowerCase();
  if (WORDS[key] !== undefined) return WORDS[key];
  if (PHRASES[key]) return PHRASES[key];
  return transliterateWord(word);
}

export function toHindiMenuText(text: string): string {
  const raw = text.trim();
  if (!raw) return text;
  if (isMostlyDevanagari(raw)) return text;

  const exact = PHRASES[normalizeKey(raw)];
  if (exact) return exact;

  let result = text;
  for (const [en, hi] of SORTED_PHRASES) {
    if (en.length < 4) continue;
    const pattern = en
      .split(" ")
      .map((part) => escapeRegex(part))
      .join("[\\s&+/.,—–−-]+");
    result = result.replace(new RegExp(`(?<![A-Za-z])${pattern}(?![A-Za-z])`, "gi"), hi);
  }

  result = result.replace(/\bCombo\b/gi, "कॉम्बो");

  result = result.replace(/[A-Za-z][A-Za-z']*/g, (word) => translateWord(word));
  return result.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.!?:;])/g, "$1");
}
