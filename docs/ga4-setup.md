# GA4 minimum measurement — 2026-10-22

Measurement ID: G-ZE6KQJMWLZ
Stream ID: 16179105678
Site: https://kurashinotsumugi.com
Base commit: 30d50102949ef8e9dc26553fbfe13b4f40dc5467

## Changes
- Add assets/analytics.js in the head of 22 current site HTML pages.
- Load GA4 only on kurashinotsumugi.com and www.kurashinotsumugi.com. Preview hosts and localhost do not send GA4 traffic.
- Use one config command for normal page views; retain enhanced measurement except automatic form interactions (turned off in GA4 by the owner).
- Send generate_lead only after the contact endpoint returns HTTP success and JSON ok:true. Send a fixed form_id, never contact field values.
- Ignore repeated submits while submitting or showing success. A new enquiry is allowed after reset.
- Record phone_click separately; this indicates a tel link click, not a connected call.
- Preserve existing content, style, Clarity and OpenAI pixel code.
- Legacy filenames containing spaces and setup documentation are outside the current site-page coverage.

## Validation
Run: node tests/analytics.test.cjs
Tests use mocks and send no real enquiries.
Covered: production hostname gate, duplicate initialization, telephone click separation, no telephone value in event payload, success, validation failure, network failure, HTTP failure, application rejection, duplicate submit, reset, unavailable analytics and analytics exceptions.
HTML comparison confirms that only the loader is added; visible text and CSS are unchanged.

## Release and receipt verification still required
- This branch is a proposed change; no production deployment is asserted.
- After approval, merge and verify the deployed HTML and assets.
- Run Google's installation test, then inspect Realtime/DebugView.
- Verify one page_view per page load, phone_click on a telephone link, and one generate_lead on an authorized successful enquiry test.
- Mark generate_lead as a key event in GA4. Do not treat phone_click as an actual enquiry or call.
- Consent/visitor-blocking behavior can prevent measurements; event counts are not guaranteed to equal every backend enquiry.
- No Google Ads import, Search Console link, scheduled export or ChatGPT data connection has been configured by this change.
- GA4 reporting access still requires a separate connection or export; the measurement ID alone does not grant access.

References:
https://developers.google.com/analytics/devguides/collection/ga4/events
https://developers.google.com/analytics/devguides/collection/ga4/reference/events
