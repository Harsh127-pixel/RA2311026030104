import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/middleware/logger';

export async function GET(request: NextRequest) {
  const CONTEXT = 'API_Proxy';
  
  // The actual target URL
  const TARGET_URL = 'http://20.207.122.201/evaluation-service/notifications';
  
  const targetUrlWithParams = new URL(TARGET_URL);
  
  // Forward all query parameters from the client request to the target API
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrlWithParams.searchParams.append(key, value);
  });

  Logger.info(CONTEXT, `Proxying request to: ${targetUrlWithParams.toString()}`);

  try {
    const response = await fetch(targetUrlWithParams.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        'User-Agent': 'Mozilla/5.0',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.text();
      Logger.error(CONTEXT, `Target API responded with ${response.status}: ${errorData}`);
      return NextResponse.json(
        { error: `Target API error: ${response.status}`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown proxy error';
    Logger.error(CONTEXT, `Proxy failure: ${message}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
