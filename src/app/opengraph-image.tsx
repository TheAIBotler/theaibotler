import { ImageResponse } from 'next/og';

export const alt = 'The AI Botler - Making AI accessible to everyone';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #1E40AF, #4F46E5)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '40px',
            width: '90%',
            maxWidth: '1000px',
          }}
        >
          <h1
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            The AI Botler
          </h1>
          <div
            style={{
              fontSize: '32px',
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              marginBottom: '40px',
              maxWidth: '800px',
            }}
          >
            Leveraging AI to solve real world problems
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid white',
              borderRadius: '50px',
              padding: '12px 30px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: '24px',
              }}
            >
              theaibotler.com
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