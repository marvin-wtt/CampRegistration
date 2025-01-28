import { JsonResource } from '#core/resource/JsonResource';

export class ResourceCollection<T extends object> extends JsonResource<T[]> {
  /**
   * Override this in subclasses to transform the raw data
   * into the final shape that should be exposed.
   */
  public transform(): object[] {
    // By default, just return the raw data as is.
    // Subclasses should override to format/transform as needed.
    return this.data;
  }
}
