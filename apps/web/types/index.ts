export interface Server {
    id: string;
    name: string;
    icon: string;
    banner?: string | null;
    description: string;
    votes: number;
    members: string; // Assuming stored as string like "14k", or number if raw. User mock data shows "14.5K".
    online?: number;
    tags: string[];
    category: string;
    tier?: "normal" | "premium" | "max" | "ad";
    inviteUrl?: string;
}

export type Category =
    | "Gaming"
    | "Social"
    | "Music"
    | "Community"
    | "Technology"
    | "Roleplay"
    | "Anime"
    | "Art"
    | "Programming"
    | "Crypto"
    | "Fun"
    | "other"; // Added fallback
