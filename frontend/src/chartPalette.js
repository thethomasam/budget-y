export const UNCATEGORIZED_LABEL = 'Uncategorized';
const UNCATEGORIZED_COLOR = '#B0B0C3';

// A fixed hue rotation so a category keeps the same color across renders
// regardless of how many categories are present or in what order.
const PALETTE = [
  '#5B6FED', '#FF6B9D', '#FFC542', '#00D4AA',
  '#9B7EFF', '#FF8A65', '#4CAF50', '#29B6F6',
  '#EF5350', '#AB47BC', '#8D6E63', '#26A69A',
];

export const buildCategoryColorMap = (names) => {
  const unique = [...new Set(names.filter((n) => n && n !== UNCATEGORIZED_LABEL))].sort();
  const map = {};
  unique.forEach((name, i) => {
    map[name] = PALETTE[i % PALETTE.length];
  });
  return map;
};

export const colorForCategory = (map, name) => {
  if (name === UNCATEGORIZED_LABEL) return UNCATEGORIZED_COLOR;
  return map[name] || UNCATEGORIZED_COLOR;
};
