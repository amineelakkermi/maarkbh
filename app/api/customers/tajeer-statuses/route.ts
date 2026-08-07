import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest){
    try{
    const response = await fetch('http://139.59.140.232/api/customers/tajeer-statuses' , {
    method: 'GET',
    headers: { 
        'Authorization': request.headers.get('Authorization') || '',
     }
     });

     if(!response.ok){
     const errorData = await response.json().catch(() => null);
     return NextResponse.json({ error: 'Failed to fetch tajeer statuses' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

    } catch(error){
        console.error('Error fetching tajeer statuses:', error);
        return NextResponse.json({ error: 'Failed to fetch tajeer statuses' }, { status: 500 });

    }
}
