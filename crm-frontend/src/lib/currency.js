// Poore app ka paisa yahin se format hota hai.
// Database mein sirf number rakha jata hai, currency alag se store nahi hoti.
export const CURRENCY_CODE = "PKR";
export const CURRENCY_PREFIX = "Rs.";

export const formatMoney = (amount) =>
  `${CURRENCY_PREFIX} ${Math.round(Number(amount) || 0).toLocaleString("en-US")}`;