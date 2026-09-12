# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Google Analytics 4

Analytics runs only in production builds with a real `REACT_APP_GA_MEASUREMENT_ID`.
Leave the value empty in `.env` for development. Set it before `npm run build`,
or pass `--build-arg REACT_APP_GA_MEASUREMENT_ID=G-...` to Docker. Both Cloud Build
configs accept `_GA_MEASUREMENT_ID` (empty by default). Rebuild to apply changes.

The router sends page views on pathname changes; GA4 manages sessions automatically.
In the GA4 web stream's Enhanced Measurement settings, disable page views based on
browser history changes to avoid duplicating the router's page views:
https://developers.google.com/analytics/devguides/collection/ga4/views

Business events use the named-event API to preserve custom parameters:
https://github.com/codler/react-ga4#reactgaeventname-params

- `hotel_search`: successful initial search and every submitted search, with city,
  numeric budget bounds (omitted when unrestricted), and results count.
- `zero_results`: successful searches returning an empty array, never failed requests.
- `hotel_view`: once the hotel details load.
- `whatsapp_click`: WhatsApp links in cards and hotel details.
- `phone_revealed`: existing phone links in cards and hotel details. Phone numbers
  are already visible; this event records clicks, not a separate reveal UI.

Register custom dimensions/metrics in GA4 for the business parameters you want to
report on. Verify page views and business events in Realtime after deploying with
a real measurement ID. No separate `session_start` event is sent by the app.

## Backend business events

Searches, zero results, loaded hotel details, WhatsApp clicks, and phone clicks send
both the existing GA4 event and a fire-and-forget POST to `/api/analytics/event`.
The sender uses `REACT_APP_API_URL`, falling back to the app's existing
`REACT_APP_BACKEND_URL`. Supply an origin without `/api`; Docker accepts either
build argument. The existing Cloud Build backend URL works without another setting.
Rebuild after changing environment variables.

Backend events run independently of the GA4 measurement ID, including development
when an API URL is configured. A tab session ID is stored under `hs_session` in
sessionStorage. Empty city selections and unrestricted budget bounds are omitted;
zero-valued budgets and result counts are preserved. Fetch uses `keepalive` for
contact links that leave the page. Storage/network failures and HTTP errors are
silent, with no retries and no UI waiting on analytics.

Deploy the backend analytics migration/router before checking event persistence.
Report submissions are already recorded server-side and are not duplicated here.

## Admin analytics

`/admin/analytics` is available from the admin sidebar. Overview, Hotels, and Calls
share the 7/14/30/90-day selector (default 30). All three endpoints refetch on a
period change and every five minutes. Background failures retain existing data and
show a retry message; stale requests are cancelled when the period changes or the
page unmounts. Charts use Recharts, and sortable tables show 20 rows per page.

The page requires the analytics API's `hotels_listed`, most-viewed
`phone_reveals`, caller `last_active`, and `pipeline_counts` fields. These are
included in the companion backend changes. Inventory/pipeline figures are current
snapshots; activity metrics use the selected UTC period. Scrape links point to
`https://pipeline.habaristays.com/scrape?town=...`. Hotel rows open the existing
admin hotel editor in a new tab.
