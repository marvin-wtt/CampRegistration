import type { ITheme } from 'survey-core';
import { DefaultLight, DefaultDark } from 'survey-core/themes';

export const themes: Record<string, ITheme> = {
  light: DefaultLight,
  dark: DefaultDark,
};

export default themes;
