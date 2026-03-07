import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

// POST /api/translate — translate Marathi text to English using Google Translate
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, from = 'mr', to = 'en' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Use Google Translate free API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();

    // Response format: [[["translated text","original text",null,null,10]],null,"mr"]
    if (data && data[0]) {
      const translated = data[0].map((item: string[]) => item[0]).join('');
      return NextResponse.json({ translated, original: text });
    }

    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
