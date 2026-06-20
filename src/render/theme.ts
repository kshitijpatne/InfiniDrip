// The "Blueprint" look: a dark technical canvas with a cyan measured grid,
// pale line work, and an amber highlight for the active piece. Centralised here
// so every part of the render layer (and later the UI) pulls the same tokens.

export const BLUEPRINT = {
  background: "#0E1A2B",
  grid: "#16304D",        // faint 5 cm grid lines
  gridStrong: "#27517A",  // brighter 10 cm grid lines
  line: "#DCE7F2",        // a normal piece outline
  lineActive: "#E8B23A",  // the selected piece (amber)
  fill: "rgba(220,231,242,0.04)",
  fillActive: "rgba(232,178,58,0.10)",
  marker: "#5C7A9C",      // fold lines, grainlines, labels
  label: "#8EA3BC",
} as const;
