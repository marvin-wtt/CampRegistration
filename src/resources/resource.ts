export interface JsonResource<T> {
  meta: object;
  data: T;
}

export interface JsonCollection<T> {
  meta: object;
  data: T[];
}

export const resource = <T>(data: T, meta: object = {}): JsonResource<T> => {
  return {
    meta: meta,
    data: data,
  };
};

export const collection = <T>(
  data: T[],
  meta: object = {}
): JsonCollection<T> => {
  return {
    meta: meta,
    data: data,
  };
};
