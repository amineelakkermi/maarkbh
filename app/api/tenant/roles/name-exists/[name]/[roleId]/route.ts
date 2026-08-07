import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string; roleId: string }> }) {
  try {
    const { name, roleId } = await params;
    
    const response = await fetch(`http://139.59.140.232/api/tenant/roles/name-exists/${name}/${roleId}`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { error: errorData?.message || 'Failed to check role name existence' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking role name existence:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
