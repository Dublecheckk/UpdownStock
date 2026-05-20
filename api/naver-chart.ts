interface VercelRequest {
  query: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  send(body: string): void;
}

function getQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const symbol = getQueryValue(req.query.symbol);
  const timeframe = getQueryValue(req.query.timeframe) ?? 'day';
  const requestType = getQueryValue(req.query.requestType) ?? '0';
  const rawCount = Number(getQueryValue(req.query.count) ?? '260');
  const count = Number.isFinite(rawCount) ? Math.min(Math.max(Math.floor(rawCount), 1), 500) : 260;

  if (!symbol || !/^\d{6}$/.test(symbol)) {
    res.status(400).send('Invalid stock symbol');
    return;
  }

  if (!['day', 'week', 'month'].includes(timeframe)) {
    res.status(400).send('Invalid timeframe');
    return;
  }

  const upstreamUrl = new URL('https://fchart.stock.naver.com/sise.nhn');
  upstreamUrl.searchParams.set('symbol', symbol);
  upstreamUrl.searchParams.set('timeframe', timeframe);
  upstreamUrl.searchParams.set('count', String(count));
  upstreamUrl.searchParams.set('requestType', requestType);

  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
  });
  const body = await upstreamResponse.text();

  res.setHeader('content-type', 'application/xml; charset=utf-8');
  res.setHeader('cache-control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(upstreamResponse.status).send(body);
}
