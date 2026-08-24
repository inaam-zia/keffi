export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Category-level styling hints for image prompts */
const categoryStyle = {
  Soup: "Asian restaurant soup in ceramic bowl, steam rising, garnish, dark table",
  Salads: "fresh composed salad on white plate, restaurant plating, vibrant vegetables",
  Starters: "Asian starter platter, restaurant appetizer, golden crispy, elegant plate",
  Steam: "steamed dumplings or momos in bamboo basket, restaurant style, steam",
  Burgers: "gourmet burger with fries, sesame bun, restaurant photography",
  Sandwiches: "toasted cafe sandwich cut diagonally, golden bread, restaurant plate",
  "From the Wok": "wok tossed noodles in bowl with chopsticks, Asian restaurant, steam",
  Rice: "fried rice in bowl, restaurant plating, herbs, dark background",
  "Sharing Bites": "shareable fries or wedges in basket, cafe snack, golden crispy",
  "Mouth-Melting Cheese Bites":
    "melted cheese appetizer, golden fried, restaurant sharing plate",
  "Keffi Signatures": "signature restaurant dish, elegant plating, herb garnish",
  "Pizza — Thin Crust": "thin crust pizza, melted cheese, basil, wood-fired look",
  Pasta: "Italian pasta on white plate, sauce, parmesan, restaurant garnish",
  Desserts: "plated dessert, chocolate or cheesecake, elegant restaurant sweet",
  "Add-ons": "small ramekin of extra topping, restaurant side portion",
};

export function buildImagePrompt(category, name) {
  const style = categoryStyle[category] || "upscale Indian restaurant food photography";
  return [
    `Professional high-end food photography of ${name}`,
    style,
    "appetizing, sharp focus, soft natural window lighting",
    "clean dark restaurant background, menu hero shot",
    "photorealistic, 8k quality, no text, no watermark, no logo",
  ].join(", ");
}

export const categories = [
  { name: "Soup", sort_order: 1 },
  { name: "Salads", sort_order: 2 },
  { name: "Starters", sort_order: 3 },
  { name: "Steam", sort_order: 4 },
  { name: "Burgers", sort_order: 5 },
  { name: "Sandwiches", sort_order: 6 },
  { name: "From the Wok", sort_order: 7 },
  { name: "Rice", sort_order: 8 },
  { name: "Sharing Bites", sort_order: 9 },
  { name: "Mouth-Melting Cheese Bites", sort_order: 10 },
  { name: "Keffi Signatures", sort_order: 11 },
  { name: "Pizza — Thin Crust", sort_order: 12 },
  { name: "Pasta", sort_order: 13 },
  { name: "Desserts", sort_order: 14 },
  { name: "Add-ons", sort_order: 15 },
];

const PASTA_SHAPES = ["Spaghetti", "Penne", "Fettuccine"];
const PASTA_SAUCES = [
  ["Pomodoro", "Tomato basil sauce"],
  ["Arrabbiata", "Spicy tomato sauce"],
  ["Aglio e Olio", "Garlic and olive oil"],
  ["Alfredo", "Creamy cheese sauce"],
  ["Pink Sauce", "Tomato-cream sauce"],
];

const pastaItems = PASTA_SHAPES.flatMap((shape) =>
  PASTA_SAUCES.map(([sauce, sauceDesc]) => [
    "Pasta",
    `${shape} — ${sauce}`,
    sauceDesc,
    345,
  ])
);

/** [category, name, description, price] */
export const items = [
  ["Soup", "Hot & Sour Soup (Veg)", "", 245],
  ["Soup", "Hot & Sour Soup (Chicken)", "", 245],
  ["Soup", "Manchow Soup (Veg)", "", 245],
  ["Soup", "Manchow Soup (Chicken)", "", 245],

  ["Salads", "Classic Caesar Salad", "", 395],
  ["Salads", "Pickled Fruits & Nut Salad with Feta Cheese", "", 445],

  ["Starters", "Golden Silk Spring Roll", "", 295],
  ["Starters", "Chicken Teriyaki Spring Roll", "", 315],
  ["Starters", "Street Chilli Chicken", "", 349],
  ["Starters", "Thai Chilli Paneer", "", 395],
  ["Starters", "Crispy Corn Salt & Pepper", "", 295],
  ["Starters", "Chongqing Mushroom", "", 295],
  ["Starters", "Honey Chilli Potato", "", 249],

  ["Steam", "Thai Chicken Dumpling", "", 395],
  ["Steam", "Cream Cheese Truffle Mushroom Dumpling", "", 395],
  ["Steam", "Jhol Momo Chicken", "", 395],
  ["Steam", "Jhol Momo Veg", "", 349],

  ["Burgers", "Tokyo Veg Katsu Burger", "", 249],
  ["Burgers", "Seoul Fried Chicken Burger", "", 315],
  ["Burgers", "Herb Mushroom Burger", "", 295],
  ["Burgers", "Thecha Chicken Burger", "", 345],

  ["Sandwiches", "Chicken Club Sandwich", "", 395],
  ["Sandwiches", "Korean Crispy Chicken Sandwich", "", 349],
  ["Sandwiches", "Mouth Melting Vegetable Cheese Sandwich", "", 315],
  ["Sandwiches", "Tuscan Mushroom Melt", "", 249],

  ["From the Wok", "Wok Tossed Noodles", "", 349],
  ["From the Wok", "Masala Maggi Monsoon Bowl", "", 245],
  ["From the Wok", "Spicy Chilli Bowl", "", 349],
  ["From the Wok", "Korean Kimchi Bowl", "", 349],
  ["From the Wok", "Chilli Basil Noodles", "", 315],
  ["From the Wok", "Chilli Garlic Noodles", "", 315],
  ["From the Wok", "Singapore Laksa Bowl", "", 345],

  ["Rice", "Chilli Garlic Fried Rice", "", 345],
  ["Rice", "Fried Rice", "", 315],
  ["Rice", "Chicken Fried Rice", "", 395],

  ["Sharing Bites", "Salted Fries", "", 149],
  ["Sharing Bites", "Peri Peri Fries", "", 159],
  ["Sharing Bites", "Cheese Fries", "", 179],
  ["Sharing Bites", "Mexican Potato Wedges", "", 195],

  ["Mouth-Melting Cheese Bites", "Mozzarella Cheese Sticks", "", 195],
  ["Mouth-Melting Cheese Bites", "Cheese Balls", "", 195],
  ["Mouth-Melting Cheese Bites", "Crispy Onion Rings", "", 195],
  ["Mouth-Melting Cheese Bites", "Chipotle Chicken Taco", "", 245],
  ["Mouth-Melting Cheese Bites", "Tangy Cottage Cheese Taco", "", 245],

  ["Keffi Signatures", "Falafel Platter", "", 295],
  ["Keffi Signatures", "Nachos with Salsa and Sour Cream", "", 245],
  ["Keffi Signatures", "Cheese Garlic Bread", "", 195],

  ["Pizza — Thin Crust", "Margherita Pizza", "", 395],
  ["Pizza — Thin Crust", "Mutton Pepperoni Pizza", "", 445],
  ["Pizza — Thin Crust", "Chicken Tikka Pizza", "", 395],
  ["Pizza — Thin Crust", "Bianca Pizza", "", 345],
  ["Pizza — Thin Crust", "Farmhouse Vegetable Pizza", "", 395],

  ...pastaItems,

  ["Desserts", "Hot Chocolate Brownie", "", 245],
  ["Desserts", "Chocolate Crunch Cake", "", 245],
  ["Desserts", "Baked Yogurt & Granola", "", 225],
  ["Desserts", "Vegan Chocolate Cake", "", 245],
  ["Desserts", "No-Bake Cheesecake", "", 265],

  ["Add-ons", "Chicken", "Soup, salad, or pasta", 70],
  ["Add-ons", "Prawns", "Pasta add-on", 90],
  ["Add-ons", "Vegetable", "Pasta add-on", 70],
  ["Add-ons", "Cottage Cheese", "Pasta add-on", 99],
];

export function itemImagePath(name) {
  return `/menu/items/${slugify(name)}.jpg`;
}

export function enrichedItems() {
  return items.map(([category, name, description, price]) => ({
    category,
    name,
    description,
    price,
    slug: slugify(name),
    image_url: itemImagePath(name),
    prompt: buildImagePrompt(category, name),
  }));
}
