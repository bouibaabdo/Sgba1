import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, RequestUser } from './types';
import { RoleCode } from '../rbac/permissions.catalog';
import { getJwtSecret } from './jwt-secret';

/**
 * يثق بمطالبات الـ JWT (بلا جلب مستخدم من القاعدة في كل طلب).
 * توكن الوصول قصير (15 دقيقة) ⇒ تغيير الدور يسري خلال مدته كحد أقصى؛
 * للإلغاء الفوري: قائمة سوداء بالـ jti (تُضاف في المرحلة 4).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    if (
      !payload ||
      !Number.isSafeInteger(payload.sub) ||
      payload.sub < 1 ||
      typeof payload.email !== 'string' ||
      typeof payload.fullName !== 'string' ||
      !Object.values(RoleCode).includes(payload.roleCode)
    ) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      roleCode: payload.roleCode,
    };
  }
}
