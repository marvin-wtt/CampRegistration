/** An entry in the balance tile's menu. */
export interface BalanceAction {
  key: string;
  icon: string;
  label: string;
  run: () => void;
}
