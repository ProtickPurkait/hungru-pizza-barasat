export type OrderItemOption = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
};

/** A line item frozen at the moment the order was placed (names and prices never change afterwards). */
export type OrderItem = {
  productId: string;
  name: string;
  diet: "veg" | "non_veg";
  quantity: number;
  options: OrderItemOption[];
  /** Unit price actually charged (after product discount, including options), in paise. */
  unitPrice: number;
  /** Unit price before product discount (including options), in paise. */
  unitOriginalPrice: number;
  lineTotal: number;
};
