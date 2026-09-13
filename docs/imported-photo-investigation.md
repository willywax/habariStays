# Imported photo investigation — 2026-09-13

## Root cause

The two applications used different JSON photo contracts. Pipeline import wrote `url`, `thumb_url`, and `is_primary`, while HabariStays `getPhotoUrl` only recognized `cloudinary_*`. As a result, gallery and backoffice image elements had no `src`. The cover often worked because `cover_photo` was populated separately.

## Checks and evidence

- **Database:** Production has `hotels.photos` JSON and `scrape_results`, not `hotel_photos`. Welcome Lodge - Dodoma (`a0e507af-def7-4b6c-a7ac-3235fb91d539`) had three photos, full HTTPS Cloudinary URLs, and a primary photo.
- **Import:** Actual code is `habariPipeline/backend/routers/imports.py`, not `import_task.py`. It selected `web_url` / `original_url` correctly but emitted the wrong JSON keys, without photo IDs or sort order. The batch commits hotel records successfully. Scrape data contained all responsive URL variants and three `cloudinary_urls`.
- **API:** `/api/hotels/a0e507af-def7-4b6c-a7ac-3235fb91d539` included all three photos. No missing relationship or eager-load issue: photos are a JSON column.
- **Frontend:** URLs were not incorrectly prefixed. The shared helper ignored the pipeline keys. In Chromium before repair, the cover had naturalWidth 840; the three gallery images had no src and naturalWidth 0.
- **Cloudinary/CORS:** Representative web and thumbnail URLs returned HTTP 200, image/jpeg and `Access-Control-Allow-Origin: *` with the HabariStays Origin header. All 270 unique image URLs from the public listings API returned images successfully. No URL-prefix migration is appropriate.

## Fixes

- Pipeline now imports canonical responsive photo keys, unique IDs, sort order and a primary flag on the first accepted photo. It falls back to `cloudinary_urls`, deduplicates URLs, rejects local paths/public IDs, and logs the actual selected URL before insertion.
- HabariStays supports both photo object formats, plus legacy string photos. Backend cover selection also accepts pipeline URL keys. Gallery and photo-manager error handlers use a bundled placeholder without a retry loop.
- `backend/scripts/repair_pipeline_photos.py` is dry-run by default. With `--apply`, it locks imported hotel rows, backs up original photo data before updates, and commits normalization in one transaction. It preserves URLs and existing metadata, assigns missing IDs, and is idempotent.

## Production repair and browser verification

Initial repair: 43 hotels, 128 photos. Backup: `C:/Users/LENOVO/AppData/Local/Temp/photos-backup-20260913T052204Z.json`.

After repair, Welcome Lodge's public gallery and authenticated backoffice each loaded all three photos, with natural widths 840, 919 and 399. Neither page emitted a browser runtime error. Two additional legacy-format hotels were imported during the investigation, demonstrating why the importer fix is also necessary.

## Tests

- Frontend: 39 tests passed, including photo-format compatibility, bounded error fallback, admin password reset and room input focus.
- Pipeline photo conversion: 3 tests passed (canonical contract, fallback/deduplication, invalid paths).
- Database repair: 2 tests passed (preservation/idempotency and no blind URL prefixing).
- Legacy backend integration tests need a separately configured test server; the broad run failed on missing URLs / old endpoints. These are not evidence of a production photo failure.
