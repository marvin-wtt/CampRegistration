export interface ReceiptListFileConfig {
  file: string;
  worksheet: string;
  categories: string[];
  sections: {
    name: string;
    startRow: number;
    rowCount: number;
  }[];
}
