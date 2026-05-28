import axios, { AxiosRequestConfig } from "axios";

export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 500
): Promise<T> => {
  let attempt = 0;
  // Exponential backoff with finite retries for transient API issues.
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt > retries) {
        throw error;
      }
      const wait = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
};

export const httpRequest = async <T>(config: AxiosRequestConfig): Promise<T> => {
  return withRetry(async () => {
    const response = await axios.request<T>(config);
    return response.data;
  });
};
