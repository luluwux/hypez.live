// Marks a route as publicly accessible, bypassing JwtAuthGuard
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'IS_PUBLIC';
export const Public = (): ReturnType<typeof SetMetadata> =>
    SetMetadata(IS_PUBLIC_KEY, true);
