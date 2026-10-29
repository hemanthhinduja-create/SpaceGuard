# SpaceGuard — demo and judge checks

## 3–4 Minute Demo

1. Start on Home: “SpaceGuard helps students understand satellite missions through a focused mission-control interface.”
2. Type **Aditya-L1**, then select its suggestion.
3. Point out the selected mission at the top, its facts, and the related active demo missions. Explain that the relationships are curated.
4. Click **TO TELEMETRY**. The first simulated sample is requested from the server immediately, then every two seconds.
5. Point out seven changing metrics, the connection indicator, timestamp, and signal trend.
6. Show Mission Health. Open its explanation and describe the equally weighted rule-based calculation.
7. Pause, resume, then expand Simulation controls and click **Simulate interruption**. Show the preserved readings and use **Try Again**.
8. Toggle the theme: Moon becomes Sun in light mode. Refresh to retain the theme and mission URL. You stay signed in (session cookie).
9. Return Home and search **xyz-nonexistent-satellite**. Show the empty state and Clear search.

## Local Browser Checks

These are checks to perform, not claims that all have already passed. The generation environment blocked browser access to the app through its browser URL policy.

| Check                    | Action                                                                        | Expected result                                                                        |
| ------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Mobile                   | In DevTools, test 375, 390, 768, 1024, and desktop widths on every route      | No page-level horizontal scrolling, overlap, or clipped controls                       |
| Long text                | Paste 400 `x` characters and submit                                           | Text stays within the layout; clear no-results state                                   |
| Empty form               | Clear search, then click Search or press Enter                                | Inline validation; input receives focus                                                |
| Keyboard                 | Type `solar`, use arrows, then Enter; try Escape and Tab                      | Active result visible, correct mission opens, focus remains usable                     |
| All search fields        | Search `Aditya`, `volatile`, `ISRO`, and `Lunar`                              | Name, mission, agency, and category matches                                            |
| Result limit             | Search `NASA`, then Show all matches                                          | Five initial suggestions; full results shown on request                                |
| Category                 | Choose Earth Observation, then search `NASA`                                  | Both criteria apply; Reset removes both                                                |
| Refresh                  | Select Aditya-L1, open telemetry, toggle theme, refresh                       | Same URL mission and theme; still signed in; telemetry resumes from the server's last reading                                      |
| URL precedence           | After saving Aditya-L1, enter `/mission/hubble` and refresh                   | Hubble appears and becomes the saved selection                                         |
| Invalid route            | Open `/mission/not-a-satellite`, `/telemetry/not-a-satellite`, and `/missing` | Clear not-found state and working Home link                                            |
| Double click             | Rapidly click a suggestion, Search, or Try Again                              | One selection operation; no duplicate records or competing requests                    |
| Loading                  | Observe telemetry startup; throttle a fresh catalogue request in DevTools     | Skeleton/loading state; no infinite loading                                            |
| Pause                    | Pause the stream and wait several seconds                                     | Values, timestamp, chart, and health stop updating                                     |
| Recovery                 | Simulate interruption, then Try Again                                         | Visible explanation, preserved reading, then changing values                           |
| Offline after load       | Use DevTools Offline after the app is loaded                                  | Notice appears; loaded data and local simulation continue                              |
| Failed JSON, saved cache | Block the JSON asset request, reload the app while HTML/JS remain available   | Saved catalogue notice and retry action                                                |
| Failed JSON, no cache    | Remove only `spaceguard:catalogue`, block JSON, reload                        | Visible mission-data error; unblocking and Try Again recovers                          |
| Corrupt storage          | Set `spaceguard:theme` and `spaceguard:selected` to malformed JSON, reload    | Safe defaults and no crash                                                             |
| Focus/contrast           | Tab through controls in both themes; try 200% browser zoom                    | Visible focus, readable content, reachable controls                                    |
| Console                  | Inspect the browser console during normal flows                               | No runtime errors; intentionally blocked network requests may be logged by the browser |

To block only mission data, find the `satellites…json` request in DevTools Network. Keep HTML and JavaScript requests available. A fully cold offline load cannot be supported without an app-shell cache, which is intentionally outside this project’s scope.

## Backend / Database Checks (to perform — NOT yet verified)

Run `npm run seed` and `npm run dev:all` first. Mark each row only after you have done it.

| Check | Action | Expected result | Done |
| --- | --- | --- | --- |
| API health | Open `http://localhost:4000/api/health` | `{"status":"ok","database":"connected"}` | [ ] |
| Seed | `npm run seed` twice | Second run: 0 inserted, 32 total; relations resolve | [ ] |
| Catalogue | Home page loads 32 missions; DB down → error panel + Try Again | Matches | [ ] |
| Register / login | Create an account, sign out, sign in; wrong password | Generic "Incorrect email or password." | [ ] |
| Session restore | Sign in, refresh any page | Still signed in; DevTools → Application: no token/password in localStorage; cookie is HttpOnly | [ ] |
| Protected data | Signed out, open `/api/satellites/aditya-l1/telemetry` | `401` JSON error | [ ] |
| Telemetry | Open a telemetry page, pause, resume, Simulate interruption, Try Again | Values update every 2 s; held values flagged when interrupted | [ ] |
| Persistence | In MongoDB, inspect `telemetries` | About one new document per satellite per 10 s | [ ] |
| Backend down | Stop the API while on the dashboard | Last values held, error alert; Try Again recovers after restart | [ ] |

## Verification Evidence

Recorded during the MongoDB/Express integration (sandbox without npm registry or MongoDB access):

- Frontend + shared-logic tests (`node --test tests/*.test.js`): **26 passed, 0 failed** — includes the original logic tests, the rewritten service tests, API-client tests and architecture guards (no Firebase references, no credentials in localStorage).
- Backend `validators.test.js`: **7 passed, 0 failed**. All backend files pass `node --check`; every relative import resolves.
- **Not run in that environment:** `npm install`, `npm run build`, `api.nodb.test.js`, `api.integration.test.js`, the seed script against a real MongoDB, and any browser check. Run `npm run check` on your machine and record the result here.
- The browser checks in the first table above also remain unverified.

## Before Submission

Run `npm run check`, complete the backend and local browser checks, record your team’s actual changes in the README or your submission notes, and rehearse once with the exact laptop/browser used for judging.
