import { NextResponse } from 'next/server';

import { resolveApiBase } from '../../../../../lib/api-base';

export async function POST() {
  try {
    const response = await fetch(`${resolveApiBase()}/agents/execute/phase-two-wave`, {
      method: 'POST',
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
      { message: 'API backend no disponible para ejecutar la fase 2.' },
      { status: 503 },
    );
  }
}
