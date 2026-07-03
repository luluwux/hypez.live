"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateSchema = z.object({
    occupation: z.string().max(100).nullable(),
    gender: z.string().max(50).nullable(),
    location: z.string().max(100).nullable(),
    birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    about: z.string().max(500).nullable(),
    socialLinks: z.array(z.string().url("Geçerli bir URL giriniz").max(200)).nullable(),
});

export type UpdateProfilePayload = z.infer<typeof updateSchema>;

export async function updateProfile(
    payload: UpdateProfilePayload,
): Promise<{ ok: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yap." };

    const parsed = updateSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, error: "Geçersiz veri gönderildi." };

    const d = parsed.data;

    if (d.socialLinks) {
        if (d.socialLinks.length > 10) {
            return { ok: false, error: "En fazla 10 sosyal bağlantı ekleyebilirsiniz." };
        }
        for (const link of d.socialLinks) {
            const lower = link.toLowerCase().trim();
            if (lower.includes("discord.gg/") || lower.includes("discord.com/invite/")) {
                return { ok: false, error: "Discord davet bağlantıları yasaktır." };
            }
            if (lower.includes(`/users/${session.user.id}`)) {
                return { ok: false, error: "Kendi profil adresinizi ekleyemezsiniz." };
            }
        }
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                occupation: d.occupation,
                gender: d.gender,
                location: d.location,
                birthday: d.birthday ? new Date(d.birthday) : null,
                about: d.about,
                socialLinks: d.socialLinks ?? undefined,
            },
        });

        revalidatePath("/profile");
        revalidatePath(`/users/${session.user.id}`);
        return { ok: true };
    } catch {
        return { ok: false, error: "Kaydedilemedi, lütfen tekrar dene." };
    }
}

export async function publishProfile(): Promise<{ ok: boolean; error?: string; badges?: string[] }> {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yap." };

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { badges: true },
        });
        if (!user) return { ok: false, error: "Kullanıcı bulunamadı." };

        const badges = [...(user.badges ?? [])];
        if (!badges.includes("early_supporter")) badges.push("early_supporter");

        await prisma.user.update({
            where: { id: session.user.id },
            data: { isPublished: true, badges },
        });

        revalidatePath("/profile");
        revalidatePath(`/users/${session.user.id}`);
        return { ok: true, badges };
    } catch {
        return { ok: false, error: "Profil yayınlanamadı, lütfen tekrar dene." };
    }
}
