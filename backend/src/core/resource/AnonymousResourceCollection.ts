import { JsonResource } from '#core/resource/JsonResource';
import { ResourceCollection } from '#core/resource/ResourceCollection';

export class AnonymousResourceCollection<
  T extends object,
> extends ResourceCollection<T> {
  constructor(
    data: T[],
    protected resourceClass: typeof JsonResource<T>,
  ) {
    super(data);
  }

  /**
   * Transform the collection into an array of JSON objects.
   */
  public transform(): object[] {
    return this.data.map((item) => new this.resourceClass(item).transform());
  }
}
