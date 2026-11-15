# FAQ — AI subtitle transcription & translation

Answers about transcription, translation, credits and refunds at AI.OpenSubtitles.com.

## General

### A job failed or I'm not happy with the result — do I get my credits back?

Failed jobs are never charged: an automatic quality check validates every transcription and translation. If you are unhappy with a result, contact us anytime and we will refund your credits.

### How do credits work?

Pay as you go: buy credits and use them for any AI service. Credits never expire and you only pay for what you actually use. See [pricing](https://ai.opensubtitles.com/pricing.md).

### Can I log in with my opensubtitles.org account?

No — opensubtitles.org and opensubtitles.com accounts are separate, and your .org login will not work on this site. Please keep using the legacy website: [ai.opensubtitles.org](https://ai.opensubtitles.org). If you'd like to switch to this site, we can transfer your remaining credit balance — just contact us via [the support page](https://ai.opensubtitles.com/support).

## Transcription

### Where does my media go when I upload it?

Nothing leaves your machine at first — the browser extracts a mono MP3 audio track, and that file alone is sent to the transcription service.

### Which input files can I transcribe?

All the everyday video and audio containers are fine. Whatever you feed in, the finished subtitles come back as SRT or VTT.

### The transcript came out in the wrong language — why?

The language you pick must be the one actually spoken in the file. Getting subtitles in another language is a second pass: run the transcription first, then send the result through translation.

## Translation

### What happens if a translation fails the quality check?

Every translation is checked automatically against the original subtitle file: completeness, timing, untranslated passages, wrong alphabets and reading speed. If a translation fails, you still receive the file — and the credits are refunded automatically.

### What can I upload for translating?

Subtitle files go in, subtitle files come out: SRT and VTT are what you receive, and a range of other formats is accepted as input.

### Are my timestamps preserved?

Usually yes, but not guaranteed. The model tries to keep your original timing; when a target language needs tighter captions (Japanese, for example), lines get split and the timing shifts accordingly.

### My translated file is full of strange characters — what went wrong?

In almost every case the file wasn't UTF-8. Re-save it as UTF-8 without BOM and upload again; older encodings such as Windows-1252 tend to break or garble the text.
