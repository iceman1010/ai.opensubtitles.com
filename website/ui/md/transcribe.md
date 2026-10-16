# AI Transcription — video & audio to subtitles

> Upload a video or audio file and get accurate subtitles in minutes. Your file is converted locally in your browser — only the audio track (mono 16 kHz MP3) is uploaded for transcription.

- Start a job in the web app: https://ai.opensubtitles.com/new (opensubtitles.com account required)
- Output formats: SRT or VTT
- Pricing is per second of audio in credits: see [pricing](https://ai.opensubtitles.com/pricing.md)
- API: see the [API reference](https://ai.opensubtitles.com/api-docs.md) (`POST /ai/transcribe`)

## FAQ

### What happens to my file?

Media is converted to a mono MP3 in your browser; only that audio track is uploaded for transcription.

### Which formats work?

Common video and audio formats are supported. You always receive SRT or VTT subtitles.

### What if the transcription is in the wrong language?

The selected language must match the spoken language of your file. Transcription and translation are separate steps — transcribe first, then translate the result into any language.
