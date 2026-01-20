export interface AppJob {
  name: string;
  pattern: string;

  run(): Promise<void> | void;
}
