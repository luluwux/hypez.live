import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: userId } = await context.params;

    // 1. Session ve sahiplik kontrolü (Başka kullanıcının banner'ını indirmek engellenir)
    const session = await auth();
    if (!session?.user?.id || session.user.id !== userId) {
        return new Response("Forbidden", { status: 403 });
    }

    // 2. Kullanıcıyı DB'den çek
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { banner: true, isPublished: true },
    });

    if (!user) {
        return new Response("User not found", { status: 404 });
    }

    if (!user.banner) {
        return new Response("Banner not found", { status: 404 });
    }

    // SSRF Koruması: Sadece güvenli Discord CDN adreslerinden indirmeye izin ver
    if (!user.banner.startsWith("https://cdn.discordapp.com/") && !user.banner.startsWith("https://media.discordapp.net/")) {
        return new Response("Forbidden: Invalid media source", { status: 400 });
    }

    // 3. CDN'den binary olarak al
    try {
        const response = await fetch(user.banner);
        if (!response.ok) {
            return new Response("Failed to fetch banner from CDN", { status: 502 });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const contentType = response.headers.get("content-type") || "image/png";
        
        let ext = "png";
        if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
        else if (contentType.includes("gif")) ext = "gif";
        else if (contentType.includes("webp")) ext = "webp";

        return new Response(buffer, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="banner_${userId}.${ext}"`,
            },
        });
    } catch (error) {
        return new Response("Internal Server Error", { status: 500 });
    }
}
