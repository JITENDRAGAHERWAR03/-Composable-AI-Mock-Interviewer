import { config } from "dotenv";
import { vi } from "vitest";

// Load test environment
config({ path: ".env.test.local" });

// Create a shared mock data store
const mockDataStore = new Map<string, any>();

// Mock @vercel/kv module globally
vi.mock("@vercel/kv", () => ({
  kv: {
    set: vi.fn().mockImplementation(async (key: string, value: any) => {
      mockDataStore.set(key, value);
      return "OK";
    }),
    get: vi.fn().mockImplementation(async (key: string) => {
      return mockDataStore.get(key) || null;
    }),
    del: vi.fn().mockImplementation(async (key: string) => {
      mockDataStore.delete(key);
      return 1;
    }),
  },
}));

// Export the mock data store for tests to access
export const testMockDataStore = mockDataStore;