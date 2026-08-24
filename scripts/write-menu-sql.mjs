import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { categories, items, itemImagePath } from "./menu-items-data.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function esc(s) {
  return s.replace(/'/g, "''");
}

const lines = [
  "-- Keffi menu — run in Supabase SQL Editor to replace the sample menu",
  "-- Safe: order_items store item names, not menu_item IDs",
  "",
  "delete from menu_items;",
  "delete from menu_categories;",
  "",
  "insert into menu_categories (name, sort_order) values",
  categories
    .map((c, i) => `  ('${esc(c.name)}', ${c.sort_order})${i < categories.length - 1 ? "," : ";"}`)
    .join("\n"),
  "",
  "insert into menu_items (category_id, name, description, price, image_url)",
  "select c.id, v.name, v.description, v.price, v.image_url",
  "from (values",
  items
    .map(([cat, name, desc, price], i) => {
      const img = itemImagePath(name);
      const imgSql = img ? `'${esc(img)}'` : "null";
      return `  ('${esc(cat)}', '${esc(name)}', '${esc(desc)}', ${price}, ${imgSql})${i < items.length - 1 ? "," : ""}`;
    })
    .join("\n"),
  ") as v(cat, name, description, price, image_url)",
  "join menu_categories c on c.name = v.cat;",
  "",
  "update cafe_settings",
  "set app_name = 'Keffi',",
  "    tagline = 'Crafted to Refresh',",
  "    logo_url = '/keffi-logo.png'",
  "where id = 1;",
  "",
];

writeFileSync(join(root, "supabase", "seed-keffi-menu.sql"), lines.join("\n"));
console.log("Wrote supabase/seed-keffi-menu.sql");
