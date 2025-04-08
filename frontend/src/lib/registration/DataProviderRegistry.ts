import type { DataProvider } from 'src/lib/registration/DataProvider';

export class DataProviderRegistry {
  public static INSTANCE: DataProviderRegistry = new DataProviderRegistry();

  private _providers: DataProvider[] = [];

  register(provider: DataProvider): void {
    this._providers.push(provider);
  }

  get providers(): DataProvider[] {
    return this._providers;
  }
}
