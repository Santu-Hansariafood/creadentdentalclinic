# Debug Session: prod-reload-loop
- **Status**: [OPEN]
- **Issue**: Production build appears to reload or restart repeatedly after deployment.
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-prod-reload-loop.ndjson

## Reproduction Steps
1. Open the deployed production site.
2. Observe whether the page refreshes repeatedly, remounts repeatedly, or re-fetches the latest bundle in a loop.
3. Capture the browser console behavior during the loop.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | Service worker update flow is forcing repeated reload/update cycles in production | High | Low | Pending |
| B | A runtime initialization path in the app entry is remounting the app repeatedly after PWA registration events | High | Low | Pending |
| C | A deploy is serving mixed old/new hashed assets, causing the client to re-bootstrap repeatedly | Medium | Medium | Pending |
| D | A route/navigation side effect is redirecting in a loop and looks like repeated app restarts | Medium | Low | Pending |
| E | A React/runtime duplication problem is still present in the production bundle and causes repeated recovery attempts | Medium | Medium | Pending |

## Log Evidence
- Instrumentation added in `frontend/src/main.jsx` for app startup and service worker callbacks.
- Instrumentation added in `frontend/src/api/axios.js` for 401-driven login redirects.
- Awaiting reproduction logs from deployed production build.

## Verification Conclusion
- Pending
