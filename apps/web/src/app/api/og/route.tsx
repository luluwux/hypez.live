import { ImageResponse } from 'next/og';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        <h1 style={{ fontSize: '80px', fontWeight: 900, margin: 0 }}>Hypez</h1>
        <p style={{ fontSize: '32px', opacity: 0.8, marginTop: '20px' }}>
          Discover the best Discord servers
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
