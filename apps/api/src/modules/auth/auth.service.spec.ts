import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma.service";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt");

describe("AuthService", () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue("mock-jwt-token"),
  };

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    password: "hashed-password",
    name: "Test User",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should successfully register a new user", async () => {
      const registerDto = {
        email: "new@example.com",
        password: "password123",
        name: "New User",
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        name: registerDto.name,
      });

      const result = await service.register(registerDto);

      expect(result.email).toBe(registerDto.email);
      expect(result.name).toBe(registerDto.name);
      expect(result).not.toHaveProperty("password");
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: registerDto.email,
            password: "hashed-password",
          }),
        })
      );
    });

    it("should throw ConflictException if user already exists", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("login", () => {
    it("should return access token and user info on successful login", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.access_token).toBe("mock-jwt-token");
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.id).toBe("user-123");
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it("should throw UnauthorizedException for non-existent user", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: "nonexistent@example.com",
          password: "password123",
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for wrong password", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: "test@example.com",
          password: "wrongpassword",
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
