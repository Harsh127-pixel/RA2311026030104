import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_LOGS_URL = 'http://20.207.122.201/evaluation-service/logs';

export async function POST(request: NextRequest) {
  const token = process.env.NEXT_PUBLIC_AUTH_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'Authentication token not found' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const response = await fetch(EXTERNAL_LOGS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to proxy logs' }, { status: 500 });
  }
}
