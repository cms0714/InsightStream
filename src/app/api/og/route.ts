import { NextRequest, NextResponse } from 'next/server';

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url parameter required' }, { status: 400 });
  }

  try {
    const ytId = extractYouTubeId(url);
    if (ytId) {
      return NextResponse.json({
        title: '',
        thumbnail: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InsightStream/1.0)' },
    });
    clearTimeout(timeout);

    const html = await res.text();

    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i)?.[1];

    const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i)?.[1];

    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];

    // For YouTube URLs that weren't caught above, also try to fetch the title
    const finalTitle = ogTitle || titleTag || '';

    return NextResponse.json({
      title: finalTitle.trim(),
      thumbnail: ogImage || '',
    });
  } catch {
    return NextResponse.json({ title: '', thumbnail: '' });
  }
}
