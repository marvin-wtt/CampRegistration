import { AxiosInstance } from 'axios';

export function convertNullToEmptyString(axios: AxiosInstance) {
  axios.interceptors.request.use(
    (config) => {
      config.data = transformNullToEmptyString(config.data);

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
    {
      runWhen: (config) => {
        const contentType =
          config.headers['Content-Type'] || config.headers['content-type'];

        return (
          contentType != null &&
          contentType.toLowerCase() === 'multipart/form-data'
        );
      },
    },
  );

  // Function to recursively transform null to empty strings
  function transformNullToEmptyString(data: unknown): unknown {
    if (data === null) {
      return ''; // Replace null with an empty string
    }

    if (Array.isArray(data)) {
      return data.map(transformNullToEmptyString); // Process arrays
    }

    if (data instanceof File) {
      return data; // Skip files
    }

    if (typeof data === 'object') {
      return Object.keys(data).reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = transformNullToEmptyString(
          (data as Record<string, unknown>)[key],
        );
        return acc;
      }, {});
    }

    return data;
  }
}
