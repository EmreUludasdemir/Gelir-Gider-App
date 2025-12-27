import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { User } from "@prisma/client";

export interface OAuthProfile {
  provider: "google" | "github";
  providerId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(private prisma: PrismaService) {}

  // Find or create user from OAuth profile
  async findOrCreateUser(profile: OAuthProfile): Promise<User> {
    // First, try to find by provider ID
    const providerField =
      profile.provider === "google" ? "googleId" : "githubId";

    let user = await this.prisma.user.findFirst({
      where: { [providerField]: profile.providerId },
    });

    if (user) {
      // Update avatar if changed
      if (profile.avatarUrl && user.avatarUrl !== profile.avatarUrl) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: profile.avatarUrl },
        });
      }
      return user;
    }

    // Check if email exists (link accounts)
    user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (user) {
      // Link OAuth to existing account
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          [providerField]: profile.providerId,
          avatarUrl: profile.avatarUrl || user.avatarUrl,
        },
      });
      return user;
    }

    // Create new user
    user = await this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        password: "", // OAuth users don't have password
        [providerField]: profile.providerId,
        avatarUrl: profile.avatarUrl,
      },
    });

    return user;
  }

  // Generate OAuth redirect URLs
  getGoogleAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3001/auth/google/callback";
    const scope = "email profile";

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}`;
  }

  getGitHubAuthUrl(): string {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri =
      process.env.GITHUB_REDIRECT_URI ||
      "http://localhost:3001/auth/github/callback";
    const scope = "user:email";

    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}`;
  }

  // Exchange code for tokens (Google)
  async exchangeGoogleCode(code: string): Promise<OAuthProfile | null> {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:3001/auth/google/callback";

      // Exchange code for token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = (await tokenResponse.json()) as { access_token?: string };
      if (!tokens.access_token) return null;

      // Get user profile
      const profileResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );

      const profile = (await profileResponse.json()) as {
        id: string;
        email: string;
        name?: string;
        picture?: string;
      };

      return {
        provider: "google",
        providerId: profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
      };
    } catch (error) {
      this.logger.error("Google OAuth error:", error);
      return null;
    }
  }

  // Exchange code for tokens (GitHub)
  async exchangeGitHubCode(code: string): Promise<OAuthProfile | null> {
    try {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      // Exchange code for token
      const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
          }),
        }
      );

      const tokens = (await tokenResponse.json()) as { access_token?: string };
      if (!tokens.access_token) return null;

      // Get user profile
      const profileResponse = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${tokens.access_token}` },
      });

      const profile = (await profileResponse.json()) as {
        id: number;
        name?: string;
        login: string;
        avatar_url?: string;
      };

      // Get primary email
      const emailsResponse = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `token ${tokens.access_token}` },
      });

      const emails = (await emailsResponse.json()) as Array<{
        email: string;
        primary: boolean;
      }>;
      const primaryEmail =
        emails.find((e) => e.primary)?.email || emails[0]?.email;

      return {
        provider: "github",
        providerId: profile.id.toString(),
        email: primaryEmail,
        name: profile.name || profile.login,
        avatarUrl: profile.avatar_url,
      };
    } catch (error) {
      this.logger.error("GitHub OAuth error:", error);
      return null;
    }
  }
}
