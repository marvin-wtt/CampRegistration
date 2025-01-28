import { AnonymousResourceCollection } from '#core/resource/AnonymousResourceCollection';
import { ResourceCollection } from '#core/resource/ResourceCollection.js';

export type MetaData<T = unknown> = Record<string, T>;

export class JsonResource<T extends object> {
  static wrap = 'data';

  constructor(
    protected data: T,
    protected metadata: MetaData = {},
  ) {}

  /**
   * Override this in subclasses to transform the raw data
   * into the final shape that should be exposed.
   */
  public transform(): object {
    // By default, just return the raw data as is.
    // Subclasses should override to format/transform as needed.
    return this.data;
  }

  public withMeta(metadata: MetaData): JsonResource<T> {
    this.metadata = metadata;

    return this;
  }

  /**
   * Return a serializable structure (i.e., plain object)
   * containing the transformed data and any metadata.
   */
  public toJSON(): object {
    return {
      [`${JsonResource.wrap}`]: this.transform(),
      meta: this.metadata,
    };
  }

  /**
   * Static helper to create a ResourceCollection
   * from an array of data using the current Resource class.
   */
  public static collection<T extends object>(data: T[]): ResourceCollection<T> {
    // The second argument is a reference to the class that extends JsonResource
    // so that ResourceCollection can instantiate it for each item.
    return new AnonymousResourceCollection<T>(data, this);
  }
}
