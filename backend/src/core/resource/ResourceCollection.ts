import { JsonResource } from '#core/resource/JsonResource';

export abstract class ResourceCollection<T extends object> extends JsonResource<
  T[]
> {
  protected abstract resourceClass: typeof JsonResource<T>;

  constructor(data: T[]) {
    super(data);
  }

  /**
   * Transform the collection into an array of JSON objects.
   */
  public transform(): object[] {
    return this.data.map((item) => new this.resourceClass(item).transform());
  }
}
