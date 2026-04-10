import { NextResponse } from 'next/server';

import { resolveApiBase } from '../../../../../../lib/api-base';

type RouteContext = {
  params: {
    key: string;
  };
};

export async function PATCH(request: Request, context: RouteContext) {
  const body = await request.json().catch(() => ({}));
  const response = await fetch(
    `${resolveApiBase()}/agents/prompts/${encodeURIComponent(context.params.key)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  );

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
    },
  });
}
