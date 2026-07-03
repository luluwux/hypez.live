import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { safeCompare } from '../utils/crypto.js';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  @Inject(ConfigService)
  private readonly configService: ConfigService;

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // req.ip is computed by Express using the trust proxy setting (app.set('trust proxy', 1)).
    // req.ips[0] would be the leftmost (client-controlled) X-Forwarded-For value and is spoofable.
    return req.ip;
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Bot isteklerini rate limit'ten muaf tut
    const botSecret = request.headers['x-bot-secret'];
    const expectedBotSecret = this.configService.get<string>('BOT_SECRET');
    if (botSecret && expectedBotSecret && safeCompare(botSecret, expectedBotSecret)) {
      return true;
    }

    // Admin isteklerini muaf tut
    const adminKey = request.headers['x-admin-key'];
    const expectedAdminKey = this.configService.get<string>('ADMIN_API_KEY');
    if (adminKey && expectedAdminKey && safeCompare(adminKey, expectedAdminKey)) {
      return true;
    }

    // @SkipThrottle() kullanıldıysa (varsayılan adı 'default' olarak setlenir), 
    // isimli (short, medium) throttler'lar normalde bunu görmez. Biz burada manuel kontrol edip atlıyoruz.
    const isSkipped = this.reflector.getAllAndOverride<boolean>('THROTTLER:SKIPdefault', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isSkipped) {
      return true;
    }

    // Orijinal SkipThrottle vb. dekoratörlerin çalışması için super çağrısı yapıyoruz.
    return super.shouldSkip(context);
  }
}
