import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { RoleCode, ROLE_NAMES } from '../rbac/permissions.catalog';
import { JwtPayload, RequestUser } from './types';
import { getJwtExpiresIn, getJwtSecret } from './jwt-secret';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 أيام
const REFRESH_TOKEN_PATTERN = /^[a-f\d]{96}$/i;
const INVALID_REFRESH_MESSAGE = 'جلسة غير صالحة، يرجى تسجيل الدخول من جديد';

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');
const isRoleCode = (value: string): value is RoleCode =>
  Object.values(RoleCode).includes(value as RoleCode);

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private rbac: RbacService,
  ) {}

  async login(email: unknown, password: unknown) {
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      email.length > 320 ||
      !password ||
      password.length > 1024
    ) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { role: true },
    });
    // رسالة واحدة غامضة لكلا الحالتين — لا نكشف أيهما خطأ
    if (!user || !user.isActive || !user.role.isActive || !isRoleCode(user.role.code)) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user.id, user.email, user.fullName, user.role.code as RoleCode);
  }

  /** تدوير توكن التحديث: يُستهلك القديم ويُصدر جديد (يُكشف إعادة الاستخدام بالحذف) */
  async refresh(refreshToken: unknown) {
    if (typeof refreshToken !== 'string' || !REFRESH_TOKEN_PATTERN.test(refreshToken)) {
      throw new UnauthorizedException(INVALID_REFRESH_MESSAGE);
    }

    const now = new Date();
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
      include: { user: { include: { role: true } } },
    });
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() <= now.getTime() ||
      !stored.user.isActive ||
      !stored.user.role.isActive ||
      !isRoleCode(stored.user.role.code)
    ) {
      throw new UnauthorizedException(INVALID_REFRESH_MESSAGE);
    }

    // التحديث الشرطي يجعل استهلاك الرمز ذريًا؛ طلبان متزامنان لا يصدران جلستين.
    const consumed = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now },
    });
    if (consumed.count !== 1) throw new UnauthorizedException(INVALID_REFRESH_MESSAGE);

    return this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.fullName,
      stored.user.role.code as RoleCode,
    );
  }

  async logout(refreshToken: unknown): Promise<void> {
    if (typeof refreshToken !== 'string' || !REFRESH_TOKEN_PATTERN.test(refreshToken)) return;

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** بروفايل المستخدم + صلاحيات دوره — تبني منه الواجهة قوائمها وشاشاتها */
  async me(user: RequestUser) {
    return {
      user,
      role: ROLE_NAMES[user.roleCode],
      permissions: await this.rbac.getRolePermissions(user.roleCode),
    };
  }

  private async issueTokens(
    userId: number,
    email: string,
    fullName: string,
    roleCode: RoleCode,
  ) {
    const payload: JwtPayload = { sub: userId, email, fullName, roleCode };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: getJwtSecret(),
      expiresIn: getJwtExpiresIn(),
    });

    const refreshToken = randomBytes(48).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: sha256(refreshToken),
        userId,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, fullName, roleCode, roleAr: ROLE_NAMES[roleCode].ar },
    };
  }
}
