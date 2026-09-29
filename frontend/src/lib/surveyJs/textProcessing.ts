import type { SurveyModel } from 'survey-core';
import { createMarkdownConverter } from '@/utils/markdown';

const FILE_PREFIX = '_file.';

export function addMarkdownRenderer(model: SurveyModel) {
  const mdConverter = createMarkdownConverter();
  model.onTextMarkdown.add((_, options) => {
    options.html = mdConverter.renderInline(options.text);
  });
}

/**
 * Resolves `{_file.<slot>}` placeholders to a URL on demand; the browser only
 * requests a file when a link/image actually renders.
 */
export function addFileSlotResolver(
  model: SurveyModel,
  resolveUrl: (slot: string, locale: string) => string,
) {
  model.onProcessDynamicText.add((sender, options) => {
    if (options.isExists || !options.name.startsWith(FILE_PREFIX)) {
      return;
    }
    options.value = resolveUrl(
      options.name.slice(FILE_PREFIX.length),
      sender.locale,
    );
  });
}

// Anchored: an image link is the placeholder alone. Text that merely contains
// one (a markdown link in a description) is inline-editable on the design
// surface, which saves what it displays — resolving it would bake in the URL.
const DESIGN_IMAGE_PLACEHOLDER =
  /^\s*\{\s?(_file\.[a-z0-9_-]+|event\.logo)\s?}\s*$/;

/**
 * The designer runs in design mode, where SurveyJS skips text processing, so
 * a `{_file.<slot>}` image or the `{event.logo}` header logo would render its
 * raw placeholder. Resolves just those; other placeholders stay visible.
 */
export function addDesignerFileSlotResolver(
  model: SurveyModel,
  resolveUrl: (slot: string, locale: string) => string,
  eventLogo: string | null | undefined,
) {
  const processTextEx = model.processTextEx.bind(model);

  model.processTextEx = (params) => {
    const result = processTextEx(params);
    if (!model.isDesignMode || params.runAtDesign) {
      return result;
    }

    return {
      ...result,
      text: result.text.replace(DESIGN_IMAGE_PLACEHOLDER, (_, name: string) =>
        name === 'event.logo'
          ? (eventLogo ?? '')
          : resolveUrl(name.slice(FILE_PREFIX.length), model.locale),
      ),
    };
  };
}
