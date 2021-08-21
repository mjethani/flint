export default [
  {
    pattern: "^\\s+",
    type: "warning",
    message: "Leading whitespace"
  },
  {
    // Trailing whitespace is OK in comments.
    pattern: "^\\s*[^!].*\\s+$",
    type: "warning",
    message: "Trailing whitespace"
  },
];
