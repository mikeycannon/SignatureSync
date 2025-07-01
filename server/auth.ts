import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "./prisma";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret-key";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export interface AuthTokenPayload {
  userId: number;
  tenantId: number;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: number;
  tokenVersion: number;
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate access token (15 minutes)
  static generateAccessToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  }

  // Generate refresh token (7 days)
  static generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });
  }

  // Verify access token
  static verifyAccessToken(token: string): AuthTokenPayload | null {
    try {
      return jwt.verify(token, JWT_ACCESS_SECRET) as AuthTokenPayload;
    } catch (error) {
      return null;
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch (error) {
      return null;
    }
  }

  // Create user with hashed password
  static async createUser(userData: {
    tenant_id: number;
    email: string;
    password: string;
    role: string;
    first_name: string;
    last_name: string;
    title?: string;
    department?: string;
  }) {
    const hashedPassword = await this.hashPassword(userData.password);
    
    return prisma.user.create({
      data: {
        tenant_id: userData.tenant_id,
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        title: userData.title,
        department: userData.department,
      },
      include: {
        tenant: true,
      },
    });
  }

  // Authenticate user credentials
  static async authenticateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  // Generate token pair for user
  static async generateTokensForUser(user: any) {
    const accessTokenPayload: AuthTokenPayload = {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: user.id,
      tokenVersion: user.token_version || 0,
    };

    const accessToken = this.generateAccessToken(accessTokenPayload);
    const refreshToken = this.generateRefreshToken(refreshTokenPayload);

    return { accessToken, refreshToken };
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { tenant: true },
    });

    if (!user || (user.token_version || 0) !== payload.tokenVersion) {
      return null;
    }

    const accessTokenPayload: AuthTokenPayload = {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
    };

    return this.generateAccessToken(accessTokenPayload);
  }

  // Revoke refresh tokens for user (logout all devices)
  static async revokeUserTokens(userId: number) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        token_version: {
          increment: 1,
        },
      },
    });
  }

  // Get user by ID with tenant
  static async getUserById(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
  }
}