// Typed user object attached to req.user after JWT validation
export interface RequestUser {
    userId: string;
    discordId: string;
}
