import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenFromRequest } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Vehicle create payload:', JSON.stringify(body, null, 2));
    
    const response = await fetch('http://139.59.140.232/api/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
'Authorization': `Bearer ${getAccessTokenFromRequest(request) || ''}`
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Vehicle create failed:', response.status, JSON.stringify(errorData));
      return NextResponse.json(
        {
          error: errorData?.message || errorData?.title || 'Failed to create vehicle',
          errors: errorData?.errors,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
