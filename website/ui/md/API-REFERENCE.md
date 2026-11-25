# AI API Reference (distilled from client docs + web client source)

Authoritative sources: `ai-opensubtitles-clients/docs/api/*.md`, web client
`src/services/api/*.ts`, `src/workers/ffmpeg.worker.ts`, `src/config/fileFormats.json`.

## Quickstart

```
1) Login (Api-Key header only; 1 request/second):
curl -X POST https://api.opensubtitles.com/api/v1/login \
  -H "Api-Key: <API_KEY>" -H "Content-Type: application/json" \
  -d '{"username":"<USER>","password":"<PASS>"}'
-> {"token":"<TOKEN>","user":{...},"base_url":"api.opensubtitles.com"}

2) Start an AI translation (multipart form; costs credits; both headers):
curl -X POST https://api.opensubtitles.com/api/v1/ai/translate \
  -H "Api-Key: <API_KEY>" -H "Authorization: Bearer <TOKEN>" \
  -F "file=@movie.srt" -F "api=nano" -F "translate_to=de"
-> {"status":"CREATED","correlation_id":"<ID>"}

3) Poll status every 3-5 s (NOTE: /ai/translation, not /ai/translate):
curl -X POST https://api.opensubtitles.com/api/v1/ai/translation/<ID> \
  -H "Api-Key: <API_KEY>" -H "Authorization: Bearer <TOKEN>"
-> {"status":"PENDING" | "COMPLETED" (data.url) | "ERROR"/"TIMEOUT" (errors[])}

4) Download the result (auth headers on the file URL too):
curl -O -J -H "Api-Key: <API_KEY>" -H "Authorization: Bearer <TOKEN>" "<data.url>"
```

`base_url` from the login response is a **hostname only** — build URLs as
`https://<base_url>/api/v1/<endpoint>`. Transcription works the same way
(`POST /ai/transcribe`, then `POST /ai/transcribe/<ID>`).

## Base URL & headers

- Base: `/ai-web/api/v1` (same-domain proxy, prod). Login is `{base}/login`;
  AI endpoints are `{base}/ai{endpoint}`. Direct API:
  `https://api.opensubtitles.com/api/v1` (or the login-returned `base_url`).
- Standard headers: `Accept: application/json`, `Api-Key: <key>`,
  `User-Agent: aios v1`, `X-User-Agent: aios v1`, `Content-Type: application/json`
  (JSON calls only — NOT FormData).
- Auth rule: AI endpoints are user-scoped (they spend a user's credits) — send
  BOTH `Api-Key` (application) and `Authorization: Bearer <token>` (user).
  Anonymous endpoints (subtitle/feature search, infos) need `Api-Key` only.
  `/ai/osticket`: `Api-Key` required, Bearer optional.

## Auth

- `POST {base}/login` JSON `{username, password}` → `{token, user: {user_id}, base_url}`.
  `base_url` is a hostname only — request URLs are `https://<base_url>/api/v1/<endpoint>`.
- Token: localStorage, 6h TTL, verified via getCredits(). NO auto-login without
  cached token (429 protection). Login = single attempt, no retry.
- Errors: 401 invalid credentials, 429 rate limit, body "blocked" = temp block.
- On 401/403 from any call: clear token, session-expired handling.

## Job lifecycle (both services)

`initiate` (FormData) → `{status: 'CREATED', correlation_id}` → poll status →
`PENDING` … → `COMPLETED` (`data`) | `ERROR`/`TIMEOUT` (`errors[]`).
Poll every 3-5s, backoff to 30s. COMPLETED `data`: `file_name`, `url` (GET with
auth headers to download), `characters_count`, `unit_price`, `total_price`,
`credits_left`; translations add `quality` (validator report; `valid` verdict),
`readability`, and `quality_refund` when failed (auto-refund).

## Endpoints

| Purpose | Method + path | Body |
|---|---|---|
| Login | POST `{base}/login` | JSON `{username,password}` |
| Credits balance | POST `/ai/credits` | `{}` → `{data:{credits}}` |
| Credit packages | POST `/ai/credits/buy` | FormData, optional `email` → `{data:[{name,value,discount_percent,checkout_url}]}` |
| Transcription models | POST `/ai/info/transcription_apis` | `{}` |
| Transcription languages | POST `/ai/info/transcription_languages` | `{}` or `{api}` |
| Translation models | POST `/ai/info/translation_apis` | `{}` |
| Translation languages | POST `/ai/info/translation_languages` | `{}` or `{api}` (shape: array OR keyed object) |
| Detect language | POST `/ai/detect_language` | FormData `file` (+ optional `duration` secs) → `data.language` sync OR `correlation_id` |
| Detection status | POST `/ai/detectLanguage/{id}` | `{}` (match language codes by ISO_639_1 base) |
| Start transcription | POST `/ai/transcribe` | FormData `file`,`language`,`api`,`return_content`? |
| Transcription status | POST `/ai/transcribe/{id}` | `{}` (NOTE: transcribe) |
| Start translation | POST `/ai/translate` | FormData `file`,`translate_from`,`translate_to`,`api`,`return_content`? |
| Translation status | POST `/ai/translation/{id}` | `{}` (NOTE: translation, not translate) |
| Recent media | POST `/ai/recent_media?page=N` | `{}` |
| Recent activities | POST `/ai/recent_activities?page=N` | `{}` (types: 1 trans, 2 transl, 3 purchase) |
| Support ticket | POST `/ai/osticket` | FormData `problem_description`,`email`,`name` (Api-Key required, Bearer token optional) → `{ticket_id}`; non-JSON body = success |
| Subtitle search | GET `/ai/proxy/subtitles` | query params `query`,`imdb_id`,`parent_imdb_id`,`year`,`type`,`languages`,`page` (Api-Key only, free). Also accepts `file_id` (undocumented upstream): `?file_id=496565` → exactly one search item — used by the `/search/file/@id` detail page |
| Feature search | GET `/ai/proxy/features` | same params minus `languages` (Api-Key only) |
| Subtitle download | POST `/ai/proxy/download` | JSON `{file_id}` (Api-Key + Bearer token) → `{link}` (GET → file) or `{file}` |
| Search languages | GET `/infos/languages` | → `{data:[{language_code,language_name}]}` (Api-Key only) |

## Client-side conversion (authoritative profile)

ffmpeg.wasm (`@ffmpeg/ffmpeg` 0.12 + core 0.12.6), in a Web Worker, args:
`-i in -vn -acodec libmp3lame -ac 1 -ar 16000 out.mp3`
→ **mono 16 kHz MP3** ("same parameters as desktop app"). NOT "keep source
bitrate". Progress via worker messages. File limits: warn >500MB, hard 2GB.
Output name: `<base>.mp3`.

## File-type routing (web client's real logic — NO mediainfo.wasm)

1. Extension lists (fileFormats.json): subtitle = **srt, vtt only**;
   video = mp4,mkv,avi,mov,wmv,flv,webm,m4v,mpg,mpeg,mp2,mpe,mpv,m2v,3gp,3g2,
   f4v,f4p,f4a,f4b,mxf,roq,nsv,vob,dv,ts,mts,m2ts,asf; audio = mp3,wav,flac,
   aac,ogg,wma,m4a,aiff,au,raw,pcm,opus,vorbis,ac3,dts,ape,wv,amr,awb,gsm,spx.
2. Unknown extension → ffmpeg probe (run `-i -f null -`, parse log for
   Audio:/Video:/Duration), first 10MB slice only (moov-at-end fallback to
   extension assumption).
3. Subtitle → translation flow; audio/video → convert → transcription flow.

## Website implementation plan (simpler interface)

- `js/config.js` — reads meta tags: api-base, api-key, user-agent.
- `js/api.js` — faithful port of the client's surface (login/token/TTL, headers,
  retry 3x non-auth, 401/403 → session-expired event, XHR upload w/ progress).
- `js/auth.js` — login form, auto-login w/ getCredits verification, logout.
- `js/detect.js` — extension routing + optional ffmpeg probe fallback.
- `js/ffmpeg-worker.js` — self-hosted core (public/vendor/ffmpeg/), mono 16k MP3.
- `js/new-job.js` — smart page: detect → auto language detect → options form (model+language
  selects from info endpoints) → convert (if media) → upload → redirect to job page.
- `js/job.js` — poll correct endpoint per type; COMPLETED → download + preview
  (authed GET), credits used, quality verdict for translations.
- `js/dashboard.js` — credits + recent activities + recent media.
- PHP PricingCache: fix to POST FormData to `{base}/ai/credits/buy`, keep `data`.

Open: where does the site's Api-Key come from — baked into config/meta, or a
third login-form field like the clients? (Clients require user-supplied key.)
