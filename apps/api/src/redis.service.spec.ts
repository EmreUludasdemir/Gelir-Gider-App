import { Logger } from "@nestjs/common";
import { RedisService } from "./redis.service";

describe("RedisService", () => {
  let service: RedisService;
  let client: {
    get: jest.Mock;
    del: jest.Mock;
    quit: jest.Mock;
  };

  beforeEach(() => {
    service = new RedisService();
    client = {
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(Logger.prototype, "warn").mockImplementation();
    jest.spyOn(Logger.prototype, "error").mockImplementation();
    service["client"] = client as never;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return parsed cached JSON", async () => {
    client.get.mockResolvedValue('{"ok":true,"count":2}');

    const result = await service.get<{ ok: boolean; count: number }>("user:1:summary");

    expect(result).toEqual({ ok: true, count: 2 });
    expect(client.del).not.toHaveBeenCalled();
  });

  it("should evict invalid cached JSON and return null", async () => {
    client.get.mockResolvedValue("{invalid-json}");

    const result = await service.get("user:1:summary");

    expect(result).toBeNull();
    expect(client.del).toHaveBeenCalledWith("user:1:summary");
  });
});
