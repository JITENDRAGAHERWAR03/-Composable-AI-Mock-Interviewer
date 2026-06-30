import { config } from "dotenv";
import { vi } from "vitest";

// Load test environment
config({ path: ".env.test.local" });

// Mock @vercel/kv module
vi.mock("@vercel/kv", () => {
  const mockData = new Map<string, any>();
  
  return {
    kv: {
      set: vi.fn().mockImplementation(async (key: string, value: any) => {
        mockData.set(key, value);
        return "OK";
      }),
      get: vi.fn().mockImplementation(async (key: string) => {
        return mockData.get(key) || null;
      }),
      del: vi.fn().mockImplementation(async (key: string) => {
        mockData.delete(key);
        return 1;
      }),
    },
  };
});