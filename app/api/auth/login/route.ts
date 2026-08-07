import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Use environment variable for API base URL, fallback to localhost or production
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://139.59.140.232';
    
    console.log('🔗 Login route - API_BASE_URL:', API_BASE_URL);
    console.log('🔗 NEXT_PUBLIC_API_URL env var:', process.env.NEXT_PUBLIC_API_URL);
    console.log('🔗 Request body:', body);
    
    // Forward the request to the backend
    const response = await fetch(`${API_BASE_URL}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    const data = await response.json();
    
    console.log('🔑 Login response status:', response.status);
    console.log('🔑 Login response data:', data);
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Login route error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
