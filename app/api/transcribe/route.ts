import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

const execFileAsync = promisify(execFile);

// POST /api/transcribe — accept audio file, transcribe Marathi to English
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Save audio to temp file
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const ext = audioFile.name?.split('.').pop() || 'webm';
    const tempPath = join(tmpdir(), `transcribe_${randomUUID()}.${ext}`);

    await writeFile(tempPath, buffer);

    try {
      // Run Python transcription script
      const scriptPath = join(process.cwd(), 'scripts', 'transcribe.py');
      const { stdout, stderr } = await execFileAsync('python3', [scriptPath, tempPath], {
        timeout: 60000,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      });

      if (stderr) {
        console.error('Transcribe stderr:', stderr);
      }

      const result = JSON.parse(stdout.trim());
      return NextResponse.json(result);
    } finally {
      // Clean up temp file
      try { await unlink(tempPath); } catch { /* ignore */ }
    }
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed. Please try again.' }, { status: 500 });
  }
}
