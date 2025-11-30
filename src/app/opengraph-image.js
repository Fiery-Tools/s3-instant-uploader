// src/app/opengraph-image.js
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const alt = 'S3 Tools - Secure Client';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      // Container
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', // Slate-50 to Slate-200
          fontFamily: 'sans-serif',
        }}
      >
        {/* Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            padding: '40px 80px',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            border: '1px solid #cbd5e1',
          }}
        >
          {/* Logo / Icon */}
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(to bottom right, #4f46e5, #0f172a)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold',
            }}
          >
            S3
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#0f172a', // Slate-900
              marginBottom: '10px',
              letterSpacing: '-2px',
            }}
          >
            S3 Tools
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '30px',
              color: '#64748b', // Slate-500
              marginBottom: '40px',
            }}
          >
            Browser & Uploader for R2 + AWS
          </div>

          {/* Privacy Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#eff6ff', // Blue-50
              border: '2px solid #bfdbfe', // Blue-200
              borderRadius: '50px',
              padding: '10px 24px',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: '12px' }}
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span style={{ fontSize: '20px', color: '#1e40af', fontWeight: 600 }}>
              Privacy First: Keys stay in your browser
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}