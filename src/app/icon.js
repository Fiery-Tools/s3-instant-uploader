// src/app/icon.js
import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(to bottom right, #4f46e5, #0f172a)', // Indigo-600 to Slate-900
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '6px',
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        S3
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}