# Transaction Tracker Flutter App

Flutter client for the Transaction Tracker monorepo.

## What this app includes

- Login with JWT-backed API session
- Transactions list and details
- Create/edit transaction form
- Transaction stage visibility behavior aligned with backend rules
- Document attachments viewing
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
