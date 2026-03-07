#!/usr/bin/env python3
"""Transcribe audio file from Marathi to English text.
Usage: python3 transcribe.py <audio_file_path>
Output: JSON with { "marathi": "...", "english": "..." } or { "error": "..." }
"""
import sys
import json
import os
import subprocess
import tempfile

def transcribe(audio_path):
    import speech_recognition as sr

    recognizer = sr.Recognizer()

    # Convert audio to WAV using ffmpeg (handles webm, ogg, mp4, m4a, etc.)
    wav_path = tempfile.mktemp(suffix='.wav')
    try:
        result = subprocess.run(
            ['ffmpeg', '-i', audio_path, '-ar', '16000', '-ac', '1', '-f', 'wav', wav_path, '-y'],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            return {"error": f"Audio conversion failed: {result.stderr[:200]}"}

        # Transcribe using Google's free speech recognition (supports Marathi)
        with sr.AudioFile(wav_path) as source:
            audio = recognizer.record(source)

        # Recognize in Marathi
        try:
            marathi_text = recognizer.recognize_google(audio, language='mr-IN')
        except sr.UnknownValueError:
            return {"error": "Could not understand audio. Please speak clearly and try again."}
        except sr.RequestError as e:
            return {"error": f"Speech recognition service error: {str(e)[:200]}"}

        if not marathi_text:
            return {"error": "No speech detected in the audio."}

        # Translate Marathi to English using Google Translate
        import urllib.request
        import urllib.parse
        translate_url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=mr&tl=en&dt=t&q={urllib.parse.quote(marathi_text)}"
        req = urllib.request.Request(translate_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            translate_data = json.loads(resp.read().decode())

        english_text = ''.join(item[0] for item in translate_data[0] if item[0])

        return {"marathi": marathi_text, "english": english_text}

    finally:
        if os.path.exists(wav_path):
            os.unlink(wav_path)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No audio file provided"}))
        sys.exit(1)

    audio_path = sys.argv[1]
    if not os.path.exists(audio_path):
        print(json.dumps({"error": f"File not found: {audio_path}"}))
        sys.exit(1)

    result = transcribe(audio_path)
    print(json.dumps(result, ensure_ascii=False))
