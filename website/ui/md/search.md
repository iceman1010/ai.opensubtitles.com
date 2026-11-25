# AI.OpenSubtitles.com — Search & download subtitles

> Search the opensubtitles.com subtitle catalog: subtitles for movies and TV shows in dozens of languages. **Search is free and needs no account.** Downloading a subtitle file requires a (free) opensubtitles.com account.

- Base URL for all API calls: `{API_BASE_URL}`
- Every request needs the header `Api-Key: {API_KEY}` — this key is public, no signup required.
- Download requests additionally need `Authorization: Bearer <token>` (see Login below).
- All responses are JSON.

## Search subtitles

```
GET {API_BASE_URL}/ai/proxy/subtitles
```

Query parameters (all optional except you need at least `query`, `imdb_id` or `parent_imdb_id`):

| Param | Meaning |
|---|---|
| `query` | Movie or episode name, or release name |
| `imdb_id` | IMDb feature id, e.g. `tt0133093` (movie) |
| `parent_imdb_id` | IMDb id of the show for episode searches |
| `year` | Release year |
| `type` | `movie` or `episode` |
| `languages` | ISO language code, e.g. `en`, `de` |
| `page` | Page number (results are paginated) |

Response (abridged):

```json
{
  "total_count": 123,
  "total_pages": 7,
  "data": [
    {
      "attributes": {
        "release": "The.Matrix.1999.1080p.BluRay.x264",
        "language": "en",
        "hearing_impaired": false,
        "ai_translated": false,
        "foreign_parts_only": false,
        "from_trusted": true,
        "upload_date": "2024-01-15T12:00:00Z",
        "uploader": { "name": "…" },
        "download_count": 1520,
        "feature_details": {
          "title": "The Matrix",
          "year": 1999,
          "imdb_id": 133093,
          "feature_type": "Movie"
        },
        "files": [ { "file_id": 1234567, "file_name": "the.matrix.srt" } ]
      }
    }
  ]
}
```

`files[0].file_id` is what you pass to the download endpoint.

## Search movies & TV shows

```
GET {API_BASE_URL}/ai/proxy/features
```

Same query parameters as above (without `languages`). Response attributes per item: `title`, `year`, `imdb_id`, `feature_type` (`Movie` or `Tvshow`), `parent_title`, `seasons_count` (shows), `subtitles_count` (movies), `img_url` (poster).

## Download a subtitle (login required)

1. Log in with an opensubtitles.com account:

```
POST {API_BASE_URL}/login
Content-Type: application/json

{ "username": "…", "password": "…" }
```

→ `{ "token": "…", "user": { "user_id": … } }` (token valid ~6 hours)

2. Request the subtitle:

```
POST {API_BASE_URL}/ai/proxy/download
Content-Type: application/json
Api-Key: {API_KEY}
Authorization: Bearer <token>

{ "file_id": 1234567 }
```

→ `{ "link": "https://…" }` (GET the link, the response body is the subtitle file) or `{ "file": "…" }` (content returned inline).

## Languages list

```
GET {API_BASE_URL}/infos/languages
```

→ `{ "data": [ { "language_code": "en", "language_name": "English" }, … ] }`

## Example

```
curl -H "Api-Key: {API_KEY}" \
  "{API_BASE_URL}/ai/proxy/subtitles?query=matrix&year=1999&languages=en"
```

## Shareable page links (for humans)

When your answer is shown to a person, link these pages instead of raw API endpoints.
They are HTML pages of this website — for programmatic use, keep using the JSON endpoints above.

| Page | URL pattern |
|---|---|
| Search results for one movie/episode | `https://ai.opensubtitles.com/search/imdb/{imdb_id}` |
| Episode search via the parent show | `https://ai.opensubtitles.com/search/imdb/parent/{imdb_id}` |
| One subtitle's detail page | `https://ai.opensubtitles.com/search/file/{file_id}` |

`imdb_id` may be given with or without the `tt` prefix — `tt0133093` and `133093` are
equivalent (the numeric form matches `feature_details.imdb_id` in API responses).
`file_id` is the numeric `files[0].file_id` from the search response.

## Notes

- Search and download are free — no credits needed.
- Some subtitles are generated on demand by AI when downloaded (`uploader.name` marks them).
- AI transcription and translation of your own files are paid services: see the [API reference](https://ai.opensubtitles.com/api-docs.md) and [pricing](https://ai.opensubtitles.com/pricing.md).
