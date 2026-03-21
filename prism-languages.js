/**
 * Loads Prism core + language components. Include after prism.min.js.
 * Single source of truth for which languages are available.
 */
(function () {
  var base = "https://cdn.jsdelivr.net/npm/prismjs@1.29.0";
  var components = [
    "components/prism-yaml.min.js",
    "components/prism-javascript.min.js",
    "components/prism-typescript.min.js",
    "components/prism-json.min.js",
    "components/prism-bash.min.js",
    "components/prism-powershell.min.js",
    "components/prism-sql.min.js",
    "components/prism-docker.min.js",
    "components/prism-toml.min.js",
    "components/prism-markdown.min.js",
    "components/prism-python.min.js",
    "components/prism-go.min.js",
    "components/prism-rust.min.js",
    "components/prism-ruby.min.js",
    "components/prism-php.min.js",
    "components/prism-csharp.min.js",
    "components/prism-java.min.js",
    "components/prism-kotlin.min.js",
    "components/prism-html.min.js",
    "components/prism-css.min.js"
  ];
  for (var i = 0; i < components.length; i++) {
    document.write('<script src="' + base + "/" + components[i] + '"><' + '/script>');
  }
})();
