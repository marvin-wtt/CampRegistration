export interface DataProvider {
  name: string;
  title: string;

  isFit(data: unknown): boolean;

  generate(data: unknown): object | string | number;
}
