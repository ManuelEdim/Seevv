// This file exists purely to prevent Tailwind from purging
// custom colour classes used dynamically in components.
// Tailwind scans all src files — any class written here gets included.

const safelist = [
  // Brand
  "bg-brand-50 bg-brand-100 bg-brand-200 bg-brand-400 bg-brand-600 bg-brand-800 bg-brand-900",
  "text-brand-50 text-brand-100 text-brand-200 text-brand-400 text-brand-600 text-brand-800 text-brand-900",
  "border-brand-50 border-brand-100 border-brand-200 border-brand-400 border-brand-600 border-brand-800",
  "hover:bg-brand-50 hover:bg-brand-100 hover:bg-brand-800",
  "ring-brand-600 focus:ring-brand-600",

  // Teal
  "bg-teal-50 bg-teal-400 bg-teal-600 bg-teal-800",
  "text-teal-50 text-teal-400 text-teal-600 text-teal-800",
  "border-teal-400",

  // Amber
  "bg-amber-50 bg-amber-400 bg-amber-600 bg-amber-800",
  "text-amber-50 text-amber-400 text-amber-600 text-amber-800",
  "border-amber-400",

  // Coral
  "bg-coral-50 bg-coral-400 bg-coral-600 bg-coral-800",
  "text-coral-50 text-coral-400 text-coral-600 text-coral-800",
  "border-coral-400 border-coral-600",
  "hover:bg-coral-600",
];

export default safelist;
