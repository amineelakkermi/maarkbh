import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest , { params }: { params: Promise<{ id: string }> }){
    
    const customerId = Number((await params).id);
    if(isNaN(customerId) || customerId <= 0){
         return NextResponse.json(
            { error: 'Invalid customer id'},
            { status: 400 }
        )
        }
    
    try{
        const response = await fetch(`http://139.59.140.232/api/customers/${customerId}/verification/verify`, {
        method: 'POST',
        headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
        });

        if(!response.ok){
        const errorData = await response.json().catch(() => null);
        return NextResponse.json({ error: errorData?.error || 'Failed to verify customer' }, { status: response.status });

    }

    const data = await response.json();
    return NextResponse.json(data);

    } catch(error){
        console.error('Error verifying customer:', error);
         return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    }
}