import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Get dynamic parameters
  const title = searchParams.get('title') || 'Smart Blinds Hub';
  const subtitle = searchParams.get('subtitle') || 'Premium Custom Window Treatments';
  const type = searchParams.get('type') || 'default';

  // Colors based on type
  const colors = {
    default: { bg: '#DC2626', accent: '#B91C1C' },
    product: { bg: '#1E40AF', accent: '#1E3A8A' },
    guide: { bg: '#047857', accent: '#065F46' },
    sale: { bg: '#DC2626', accent: '#991B1B' },
  };

  const theme = colors[type as keyof typeof colors] || colors.default;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          background: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.accent} 100%)`,
          padding: '60px 80px',
        }}
      >
        {/* Logo Area */}
        <div
          style={{
            position: 'absolute',
            top: '60px',
            left: '80px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: '12px' }}>🏠</span>
            Smart Blinds Hub
          </div>
        </div>

        {/* Type Badge */}
        {type !== 'default' && (
          <div
            style={{
              position: 'absolute',
              top: '60px',
              right: '80px',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '18px',
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            {type === 'sale' ? '🔥 Sale' : type}
          </div>
        )}

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              lineHeight: 1.1,
              marginBottom: '20px',
              maxWidth: '900px',
            }}
          >
            {title.length > 50 ? `${title.slice(0, 50)}...` : title}
          </div>
          <div
            style={{
              fontSize: '32px',
              color: 'rgba(255, 255, 255, 0.9)',
              maxWidth: '800px',
            }}
          >
            {subtitle.length > 80 ? `${subtitle.slice(0, 80)}...` : subtitle}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '40px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '24px',
          }}
        >
          <span>smartblindshub.com</span>
          <span style={{ margin: '0 16px' }}>•</span>
          <span>Free Shipping on eligible orders</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
