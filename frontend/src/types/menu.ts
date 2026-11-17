/** An action in a menu, e.g. `ResponsiveMenu`; also how actions are built. */
export interface ResponsiveMenuItem {
  label: string;
  icon: string;
  /** A color role, e.g. `negative` for a destructive action. */
  color?: string | undefined;
  hidden?: boolean | undefined;
  onClick: () => void;
}
