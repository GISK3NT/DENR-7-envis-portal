# Deployment notes

The portal is a Next.js 15 application with a server-side SQLite database. It
needs a Node.js host with a persistent disk; static hosts (GitHub Pages, plain
shared hosting) cannot run the request workflow, the staff console or email.

The repository already contains everything the site serves:

| Path | Contents |
| --- | --- |
| `public/previews/*.geojson` | generalized map previews (no source shapefiles) |
| `public/previews/thumbs/*.webp` | catalog card thumbnails |
| `public/previews/lcm-display/*.geojson` | land-cover change display layers |
| `data/datasets.json`, `data/taxonomy.json` | catalog metadata |

Source shapefiles are never committed and never served.

## Requirements

- Node.js 24 (`engines.node` is pinned; `node:sqlite` is used directly)
- One persistent volume for the database, request attachments and the reply
  outbox. Everything else can be rebuilt from the repository.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `ENVIS_STORAGE_ROOT` | yes on ephemeral hosts | Mount point of the volume, e.g. `/data` |
| `ENVIS_DB` | optional | Defaults to `$ENVIS_STORAGE_ROOT/data/envis.sqlite` |
| `ENVIS_HTTPS` | yes when served over HTTPS | `1` marks the session cookie `Secure` |
| `ENVIS_MAIL_PROVIDER` | yes | `gmail`, `yahoo`, `outlook`, `proton` or `smtp` |
| `ENVIS_SMTP_USER` / `ENVIS_SMTP_PASS` | yes | Sending mailbox and app password |
| `ENVIS_MAIL_FROM` | recommended | `ENVIS DENR Region VII <mailbox@example.org>` |
| `ENVIS_MAIL_REPLY_TO` | optional | Reply-to address |
| `ENVIS_GEOHAZARD_DIR` | optional | Folder holding the publishable MGB geohazard JPEGs |

Set `ENVIS_ADMIN_*` only for the one-off seed step; the password is not stored
in the repository.

## Railway

1. Create a project from the GitHub repository (`master` branch).
2. Add a volume and mount it at `/data`.
3. Add the environment variables above, with `ENVIS_STORAGE_ROOT=/data` and
   `ENVIS_HTTPS=1`.
4. Deploy. `railway.json` sets the start command, health check and restart
   policy; the build is the standard `npm install && npm run build`.
5. Create the first staff account once the deploy is live:

   ```bash
   railway run npm run seed -- --generate
   ```

   Store the printed password in a password manager. Rotate it later with
   `railway run npm run seed -- --update --generate`.

Attachments are written to `$ENVIS_STORAGE_ROOT/data/request-attachments` and
queued replies to `$ENVIS_STORAGE_ROOT/private_data/outbox`, so both survive a
redeploy. Back up the volume (at least `data/envis.sqlite` plus its `-wal` and
`-shm` files).

## Geohazard maps

`/geohazards-maps` reads the MGB JPEGs at runtime. The images are not part of the
repository; copy them to the server (or a volume) and point
`ENVIS_GEOHAZARD_DIR` at the folder that contains the per-province sub-folders.
Without that folder the page shows an empty list; the rest of the portal is
unaffected.

## Rebuilding the previews

`npm run catalog` needs the source shapefiles, so it only runs on a workstation
that holds them. The generated previews are generalized, coordinate-rounded
derivatives; the authoritative data is released only through the request
workflow.

Preview size can be reduced further with the helper scripts:

```bash
node scripts/slim-previews.mjs      # dedupe vertices, re-export at 3/2 decimals
node scripts/slim-thumbs.mjs        # simplify card thumbnails
node scripts/build-thumb-webp.mjs   # rasterise thumbnails to WebP
```
