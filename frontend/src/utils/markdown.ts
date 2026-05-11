import markdownit from 'markdown-it';

export function createMarkdownConverter() {
  const converter = markdownit({});

  // Open all links in a new tab.
  // https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer

  const defaultRender =
    converter.renderer.rules.link_open ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

  converter.renderer.rules.link_open = function (
    tokens,
    idx,
    options,
    env,
    self,
  ) {
    // Add a new `target` attribute, or replace the value of the existing one.
    tokens[idx]?.attrSet('target', '_blank');
    // Add `rel="noopener"` to prevent tabnabbing attacks.
    tokens[idx]?.attrSet('rel', 'noopener');

    // Pass the token to the default renderer.
    return defaultRender(tokens, idx, options, env, self);
  };

  return converter;
}
