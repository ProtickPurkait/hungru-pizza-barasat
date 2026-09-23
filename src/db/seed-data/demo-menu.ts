import type { ProductOptionGroup } from "@/lib/content/schemas";
import type { MenuSeed } from "./types";

/**
 * ⚠️ DEVELOPMENT / TEST FIXTURE ONLY — loaded only with `npm run db:seed -- --demo`.
 * Every item is flagged as SAMPLE in the database and on the website. These are NOT Hungru's real
 * items, prices or options; they exist so the ordering flow can be designed and tested end-to-end.
 */
const pizzaOptions = (): ProductOptionGroup[] => [
  {
    id: "size",
    name: "Size",
    type: "single",
    required: true,
    maxSelect: 0,
    options: [
      { id: "regular", name: "Regular", priceDelta: 0, isDefault: true, isAvailable: true },
      { id: "medium", name: "Medium", priceDelta: 15000, isDefault: false, isAvailable: true },
      { id: "large", name: "Large", priceDelta: 30000, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: "crust",
    name: "Crust",
    type: "single",
    required: false,
    maxSelect: 0,
    options: [
      { id: "classic", name: "Classic hand-tossed", priceDelta: 0, isDefault: true, isAvailable: true },
      { id: "thin", name: "Thin crust", priceDelta: 0, isDefault: false, isAvailable: true },
      { id: "cheese-burst", name: "Cheese burst", priceDelta: 9900, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: "addons",
    name: "Add-ons",
    type: "multiple",
    required: false,
    maxSelect: 3,
    options: [
      { id: "extra-cheese", name: "Extra cheese", priceDelta: 6000, isDefault: false, isAvailable: true },
      { id: "jalapeno", name: "Jalapeños", priceDelta: 4000, isDefault: false, isAvailable: true },
      { id: "olives", name: "Black olives", priceDelta: 4000, isDefault: false, isAvailable: true },
    ],
  },
];

export const demoMenu: MenuSeed = {
  categories: [
    {
      name: "Pizzas",
      products: [
        {
          name: "Margherita",
          description: "Tomato sauce, loads of mozzarella, oregano.",
          price: 199,
          diet: "veg",
          isBestseller: true,
          options: pizzaOptions(),
        },
        {
          name: "Farmhouse",
          description: "Onion, capsicum, mushroom and sweet corn.",
          price: 299,
          discountPrice: 259,
          diet: "veg",
          isBestseller: true,
          badge: "Hot deal",
          options: pizzaOptions(),
        },
        {
          name: "Paneer Tikka",
          description: "Tandoori paneer, onion, capsicum, mint mayo drizzle.",
          price: 329,
          diet: "veg",
          isBestseller: true,
          badge: "Spicy",
          options: pizzaOptions(),
        },
        {
          name: "Veg Supreme",
          description: "Olives, jalapeño, onion, capsicum, corn and mushroom.",
          price: 349,
          diet: "veg",
          options: pizzaOptions(),
        },
        {
          name: "Chicken Tikka",
          description: "Smoky chicken tikka, onion and capsicum.",
          price: 379,
          diet: "non_veg",
          isBestseller: true,
          options: pizzaOptions(),
        },
        { name: "Pepperoni", description: "Chicken pepperoni and extra mozzarella.", price: 399, diet: "non_veg", options: pizzaOptions() },
        { name: "BBQ Chicken", description: "BBQ chicken, onion and jalapeño.", price: 389, diet: "non_veg", options: pizzaOptions() },
      ],
    },
    {
      name: "Combos",
      products: [{ name: "Duo Combo", description: "Any two regular pizzas with garlic bread.", price: 549, diet: "veg" }],
    },
    {
      name: "Sides",
      products: [
        { name: "Cheesy Garlic Bread", description: "Buttery garlic bread with melted cheese.", price: 129, diet: "veg" },
        { name: "Peri Peri Fries", description: "Crispy fries tossed in peri peri.", price: 109, diet: "veg" },
        { name: "Chicken Wings", description: "Six wings in smoky BBQ glaze.", price: 219, diet: "non_veg" },
      ],
    },
    {
      name: "Beverages",
      products: [
        { name: "Cola", description: "Chilled, 500 ml.", price: 60, diet: "veg" },
        { name: "Cold Coffee", description: "Thick, creamy and sweet.", price: 119, diet: "veg" },
      ],
    },
    { name: "Deals", products: [] },
  ],
};
