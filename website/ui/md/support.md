# Support

> Contact the AI.OpenSubtitles.com support team for help with AI transcription, subtitle translation, credits, or your account.

## Ticket form

Submit via the website (login required): https://ai.opensubtitles.com/support

Fields:

- **Name** (required)
- **Email** (required) — the team replies by email
- **Support scope** — two options:
  - *AI.OpenSubtitles.com product*: issues with the AI subtitle generator, transcription, translation, credits, or your account here.
  - *Other OpenSubtitles.com product*: the classic subtitle search, API, downloader, forum, or any other OpenSubtitles.com service — pick this so the request is routed correctly.
- **Problem description** (required)

## API endpoint

Tickets can also be submitted programmatically (Api-Key required, Bearer token optional):

```
POST /ai/osticket
Content-Type: multipart/form-data

problem_description=…&email=…&name=…
```

→ `{ "ticket_id": … }`
