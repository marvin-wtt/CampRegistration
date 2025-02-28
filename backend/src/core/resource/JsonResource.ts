export type ResourceMetadata<T = unknown> = Record<string, T>;

export abstract class JsonResource<TInput, TOutput> {
  constructor(
    protected data: TInput,
    protected metadata: ResourceMetadata = {},
  ) {}

  /**
   * Must be implemented by subclasses to transform
   * the input into a safe/serialized output.
   */
  public abstract transform(): TOutput;

  public withMeta(metadata: ResourceMetadata): JsonResource<TInput, TOutput> {
    this.metadata = metadata;

    return this;
  }

  /**
   * Retrieve all metadata as an untyped object.
   */
  public getAllMetadata(): ResourceMetadata {
    return this.metadata;
  }

  /**
   * Return a serializable structure (i.e., plain object)
   * containing the transformed data and any metadata.
   */
  public toObject(): object {
    return {
      data: this.transform(),
      meta: this.getAllMetadata(),
    };
  }

  /**
   * Static helper to create a ResourceCollection
   * from an array of data using the current Resource class.
   */
  public static collection<
    TData,
    TOutput,
    TResource extends JsonResource<TData, TOutput>,
  >(
    this: new (
      input: TData,
      metadata?: ResourceMetadata,
    ) => TResource & { transform(): TOutput },
    dataArray: TData[],
    meta: ResourceMetadata = {},
  ) {
    // The second argument is a reference to the class that extends JsonResource
    // so that ResourceCollection can instantiate it for each item.
    // Construct one Resource subclass instance per data element.
    const items = dataArray.map((dataItem) => new this(dataItem));

    // Return a ResourceCollection initialized with those items.
    return new ResourceCollection<TData, TOutput, TResource>(items, meta);
  }
}

export class ResourceCollection<
  TInput,
  TOutput,
  TResource extends JsonResource<TInput, TOutput>,
> extends JsonResource<TResource[], TOutput[]> {
  constructor(data: TResource[], metaData: ResourceMetadata = {}) {
    super(data, metaData);
  }

  /**
   * Transform the entire collection by transforming each child resource.
   * The result is an array of TOutput.
   */
  public transform(): TOutput[] {
    return this.data.map((resource) => resource.transform());
  }

  public entries(): TResource[] {
    return this.data;
  }
}
