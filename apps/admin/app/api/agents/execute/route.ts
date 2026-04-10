import { NextResponse } from 'next/server';

import { resolveApiBase } from '../../../../lib/api-base';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const response = await fetch(`${resolveApiBase()}/agents/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'API backend no disponible para ejecutar agentes.' },
      { status: 503 },
    );
  }
}
