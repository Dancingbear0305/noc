# Repository rules

- Never commit or publish sensitive information, including real CCU counts, monitoring observations, incidents, internal URLs, credentials, or private infrastructure/product mappings.
- Only public synthetic examples belong in source, tests and documentation. The user additionally authorized minimal public RSS news metadata (title, source URL, timestamp, provenance) in generated build assets; never include article bodies or private data. Private data must remain outside this checkout and be imported locally by the user.
- Do not read private imported data into logs, test fixtures, screenshots, build artifacts or GitHub Actions. Do not add analytics or automatic uploads.
- localStorage is not a secret vault. Never store passwords or tokens. Review staged files before any commit or publication. .gitignore is not a security boundary.
