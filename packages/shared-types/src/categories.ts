// Kategori listesi — 16 flat kategori, alt kategori yok.
// Max 3 kategori seçilebilir.

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
}

// Fallback categories for SSR/build time (when API is unavailable)
export const FALLBACK_CATEGORIES: Category[] = [
  { id: 'gaming', name: 'Gaming', slug: 'gaming', emoji: 'Gamepad2', color: '#6366f1', sortOrder: 0, isActive: true },
  { id: 'anime', name: 'Anime', slug: 'anime', emoji: 'Tv', color: '#ec4899', sortOrder: 1, isActive: true },
  { id: 'public', name: 'Public', slug: 'public', emoji: 'Globe', color: '#3b82f6', sortOrder: 2, isActive: true },
  { id: 'community', name: 'Community', slug: 'community', emoji: 'Users', color: '#10b981', sortOrder: 3, isActive: true },
  { id: 'music', name: 'Music', slug: 'music', emoji: 'Music', color: '#f59e0b', sortOrder: 4, isActive: true },
  { id: 'art', name: 'Art', slug: 'art', emoji: 'Palette', color: '#ec4899', sortOrder: 5, isActive: true },
  { id: 'design', name: 'Design', slug: 'design', emoji: 'PenTool', color: '#8b5cf6', sortOrder: 6, isActive: true },
  { id: 'programming', name: 'Programming', slug: 'programming', emoji: 'Code', color: '#06b6d4', sortOrder: 7, isActive: true },
  { id: 'science', name: 'Science', slug: 'science', emoji: 'Atom', color: '#14b8a6', sortOrder: 8, isActive: true },
  { id: 'technology', name: 'Technology', slug: 'technology', emoji: 'Cpu', color: '#f97316', sortOrder: 9, isActive: true },
  { id: 'education', name: 'Education', slug: 'education', emoji: 'GraduationCap', color: '#3b82f6', sortOrder: 10, isActive: true },
  { id: 'chill', name: 'Chill', slug: 'chill', emoji: 'Coffee', color: '#10b981', sortOrder: 11, isActive: true },
  { id: 'roleplay', name: 'Roleplay', slug: 'roleplay', emoji: 'Swords', color: '#8b5cf6', sortOrder: 12, isActive: true },
  { id: 'crypto', name: 'Crypto', slug: 'crypto', emoji: 'Bitcoin', color: '#f59e0b', sortOrder: 13, isActive: true },
  { id: 'creators', name: 'Creators', slug: 'creators', emoji: 'Video', color: '#ef4444', sortOrder: 14, isActive: true },
  { id: 'other', name: 'Other', slug: 'other', emoji: 'Box', color: '#6366f1', sortOrder: 15, isActive: true },
];

// Client-side cache for API-fetched categories
let cachedCategories: Category[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchCategories(apiBaseUrl?: string): Promise<Category[]> {
  if (cachedCategories && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedCategories;
  }

  try {
    // Public endpoint — no admin key required. Works for browser, SSR, and bot.
    const url = apiBaseUrl || '/api/categories';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);

    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.data ?? []);

    if (Array.isArray(list) && list.length > 0) {
      cachedCategories = list.map((cat: Record<string, unknown>) => ({
        id: cat.id as string,
        name: cat.name as string,
        slug: cat.slug as string,
        emoji: (cat.emoji as string) || '📁',
        color: (cat.color as string) || '#6366f1',
        sortOrder: (cat.sortOrder as number) || 0,
        isActive: cat.isActive !== false,
      }));
      cacheTimestamp = Date.now();
      return cachedCategories;
    }
  } catch {
    // Silently fall back — caller gets FALLBACK_CATEGORIES
  }

  return FALLBACK_CATEGORIES;
}

export function invalidateCategoryCache() {
  cachedCategories = null;
  cacheTimestamp = 0;
}

// For SSR/edge cases - returns fallback immediately
export function getCategories(): Category[] {
  return cachedCategories || FALLBACK_CATEGORIES;
}

export function getCategory(idOrSlug: string): Category | undefined {
  const cats = getCategories();
  return cats.find(c => c.id === idOrSlug || c.slug === idOrSlug);
}

// Legacy compatibility
export const CATEGORIES = FALLBACK_CATEGORIES;
export type CategoryId = string;
export const CATEGORY_IDS = FALLBACK_CATEGORIES.map(c => c.id);

// @deprecated — eski yapıyla uyumluluk için. Yeni kodda getCategories() veya fetchCategories() kullan.
export const MAIN_CATEGORIES = FALLBACK_CATEGORIES;
