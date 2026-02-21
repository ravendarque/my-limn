export function makeTile(type) {
  const div = document.createElement("div");
  div.className = `tile tile-${type}`;
  return div;
}
