import { CacheService } from "./cache.service";

describe("CacheService", () => {
  let service: CacheService;
  let client: {
    get: jest.Mock;
    del: jest.Mock;
  };
  let logger: {
    log: jest.Mock;
    error: jest.Mock;
    warn: jest.Mock;
    debug: jest.Mock;
    verbose: jest.Mock;
  };

  beforeEach(() => {
    client = {
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(undefined),
    };
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    service = new CacheService(logger as never);
    service["client"] = client as never;
    service["isConnected"] = true;
  });

  it("should return parsed cached JSON when entry is valid", async () => {
    client.get.mockResolvedValue('{"total":5}');

    const result = await service.get<{ total: number }>("trx:user-1:summary");

    expect(result).toEqual({ total: 5 });
    expect(client.del).not.toHaveBeenCalled();
    expect(service.getStats().hits).toBe(1);
  });

  it("should evict invalid cached JSON and treat it as a miss", async () => {
    client.get.mockResolvedValue("{broken-json}");

    const result = await service.get("trx:user-1:summary");

    expect(result).toBeNull();
    expect(client.del).toHaveBeenCalledWith("trx:user-1:summary");
    expect(logger.warn).toHaveBeenCalledWith(
      "Cache entry is invalid JSON and will be evicted: trx:user-1:summary",
      { context: "CacheService" },
    );
    expect(service.getStats().misses).toBe(1);
  });
});
