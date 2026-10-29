import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** خط الدفاع الأول: توكن JWT صالح في الترويسة Authorization: Bearer */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
