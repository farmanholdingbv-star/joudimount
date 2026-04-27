# Transaction Tracker Flutter App

Flutter client for the Transaction Tracker monorepo.

**Package name:** `judi_mount` (see `pubspec.yaml`).

## What this app includes

- Login with JWT-backed API session (token in `SharedPreferences`)
- Transactions list and details
- Create/edit transaction form (multipart uploads where supported)
- Transaction stage controls and visibility aligned with backend rules
- Document attachments viewing (grouped by category)
- Staff/employees screen (manager: CRUD; others: per API rules)
- Arabic/English localization support

## API configuration

The app supports `API_BASE` override:

```bash
flutter run --dart-define=API_BASE=http://<your-lan-ip>:4000
```

Default behavior:

- Desktop/web: tries `http://localhost:4000` then LAN fallback
- Android: tries LAN, then `http://10.0.2.2:4000`, then localhost

## Run

```bash
flutter pub get
flutter run
```

## Notes

- Ensure the API server is running (`npm run dev:api` at repo root)
- Use a reachable host/IP when testing on physical devices
