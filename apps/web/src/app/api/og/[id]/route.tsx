import { ImageResponse } from 'next/og';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    
    let serverName = 'Discord Server';
    let description = 'Join this server on Hypez';
    let memberCount = 0;
    
    try {
        const server = await prisma.server.findUnique({
            where: { id },
            select: { name: true, description: true, memberCount: true }
        });
        if (server) {
            serverName = server.name;
            description = server.description || 'Join this community on Hypez!';
            memberCount = server.memberCount || 0;
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }

    return new ImageResponse(
        (
            <div
                style={{
                    width: '1200px',
                    height: '630px',
                    background: 'linear-gradient(135deg, #09090b, #18181b, #27272a)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '80px',
                    justifyContent: 'space-between',
                    fontFamily: 'sans-serif',
                    color: 'white',
                    border: '8px solid #3b82f6',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ background: '#3b82f6', width: '20px', height: '40px', borderRadius: '4px', marginRight: '15px' }} />
                        <span style={{ fontSize: '24px', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '2px' }}>Discord Server</span>
                    </div>
                    <h1 style={{ fontSize: '72px', fontWeight: 900, margin: '0 0 20px 0', lineHeight: 1.1, wordBreak: 'break-word' }}>
                        {serverName}
                    </h1>
                    <p style={{ fontSize: '28px', opacity: 0.7, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                        {description}
                    </p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '32px', fontWeight: 700, color: '#10b981', marginRight: '10px' }}>
                            {memberCount.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '24px', opacity: 0.5 }}>members</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '1px' }}>Hypez</span>
                        <span style={{ fontSize: '20px', opacity: 0.5, marginLeft: '10px', marginTop: '12px' }}>.live</span>
                    </div>
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}
