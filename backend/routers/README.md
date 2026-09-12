# Business analytics

The PostgreSQL application (`server_postgres:app`) mounts these routes:

- `POST /api/analytics/event`: anonymous ingestion, 201 with event ID/type/time;
  SlowAPI limits requests to 30 per minute per client IP. Unknown event types,
  negative counts/budgets, reversed budgets, and extra fields return 422.
  A supplied hotel ID must exist (otherwise 404). JSON metadata defaults to `{}`.
- `GET /api/analytics/summary?days=30`
- `GET /api/analytics/calls?days=30`
- `GET /api/analytics/hotels?days=30`

All GET routes require the existing admin cookie or bearer-token authentication.
`days` defaults to 30 and accepts 1–365. Time windows include today and the previous
N−1 UTC calendar days, through the current instant. Daily series include zero days.
All aggregation runs in SQL; raw event histories are not loaded into application memory.

## Apply the migration

From `backend`, set `DATABASE_URL` to the target PostgreSQL asyncpg URL and run
`alembic upgrade head`. Revision `005_add_analytics_events` follows `004_add_backoffice`.
It creates the PostgreSQL enum, JSONB table, four indexes, and a nullable hotel
foreign key using `ON DELETE SET NULL` so deleting a hotel preserves event history.
The downgrade drops the table and enum, deleting stored analytics events.

## Metric definitions

- Search/view/contact totals count events, not unique sessions or people.
  `zero_results_searches` counts explicit `zero_results` events. Send one
  `hotel_search` with results count for each completed search, plus one
  `zero_results` when empty. Failed requests should not be logged as empty searches.
- Conversion percentages are WhatsApp clicks / hotel views × 100, rounded to two
  decimals, or zero with no views. Multiple clicks can produce a rate over 100%.
- Budget distribution uses `budget_min`, falling back to `budget_max`. Searches
  without either bound are omitted. Buckets are [0, 30000), [30000, 60000),
  [60000, 100000), and [100000, infinity), in TZS.
- Summary city and hotel rankings return up to 10 rows with deterministic tie ordering.
  Detailed hotel rankings return all matching rows for client pagination at 20 rows.
  Missing cities are excluded from city rankings. Deleted hotels are omitted from
  hotel rankings but their events still contribute to overall totals.
- `zero_result_cities` counts explicit zero-result events plus searches with 1–3
  results (the definition of “few”), without counting paired empty-search events twice.
- Call analytics use `hotel_call_logs.called_at`, not the row creation timestamp.
  Counts are call attempts, with `verified`/`unreachable` based on each log's status.
  Caller rankings include all callers, preserving a null group for deleted users.
- Town progress is a current inventory snapshot, independent of `days`. Pending,
  called, and verified count each hotel's current call status; unreachable hotels
  remain in the completion denominator. Published means `hotels.status = verified`.
  Completion is currently call-verified hotels / all hotels in the town × 100.

## Recording events

The frontend posts the same named business events used by GA4 to
`/api/analytics/event` through its fire-and-forget analytics sender.
Server-side code can call `record_event(session, event_type, **fields)` inside its
existing transaction. The hotel report endpoint does this automatically and records
report ID and reported field without copying contact details into analytics.
Call analytics read the existing call logs directly; no duplicate call-event store is needed.

The router uses the application's existing SlowAPI limiter (currently in-memory,
per process). Trusted proxy configuration must supply the real client address;
this router does not trust arbitrary forwarded headers. SlowAPI integration reference:
https://slowapi.readthedocs.io/en/stable/

## Validation

Run `python -m pytest tests/test_analytics.py -q` from `backend`. Tests exercise API
validation, authorization, throttling, event storage, aggregates, empty periods,
budget/date boundaries, rankings, call history, and transactional report recording
against isolated SQLite with JSONB/date compatibility shims. They never access the
configured application database; apply and smoke-test the migration in PostgreSQL
before release.

## Admin analytics response additions

- Summary zero-result cities include `hotels_listed`: the current number of public
  (`verified` or `imported`) listings in that city, independent of the time window.
- Detailed most-viewed rows include `phone_reveals`.
- Detailed underserved cities include `hotels_listed` and `zero_results_count` so
  the UI can distinguish empty searches from searches returning a few hotels.
- Caller rows include `last_active`, the latest call timestamp in the period.
- Calls include `pipeline_counts` (`total`, `pending`, `called`, `verified`,
  `published`) from the current inventory. Total includes unreachable hotels;
  verified and published can overlap and are not summed for the denominator.
