# AI Subtitle Translation — SRT & VTT

> Upload an SRT or VTT file, pick a target language, and let AI translate it while keeping your timing intact.

- Start a job in the web app: https://ai.opensubtitles.com/new (opensubtitles.com account required)
- Pricing is per character in credits: see [pricing](https://ai.opensubtitles.com/pricing.md)
- Every translation is checked automatically before delivery — over 99% pass the check. If one doesn't, you still receive it, free of charge.
- API: see the [API reference](https://ai.opensubtitles.com/api-docs.md) (`POST /ai/translate`)

## FAQ

### Which subtitle formats?

SRT and VTT are the standard output formats; more input formats are supported.

### Will the timing change?

Possibly — it depends on the language pair and the model. Timestamps are kept when possible, but if the target language needs shorter captions (e.g. Japanese), captions may be split differently.

### Why does my translation fail or produce strange characters?

Almost always an incorrect character encoding. Save subtitle files as UTF-8 without BOM before uploading — files in legacy encodings (e.g. Windows-1252) may fail or produce broken text.
