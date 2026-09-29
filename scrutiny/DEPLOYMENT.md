# Deploying GST Intelligence

Three ways to run it, from simplest to most production-like. All serve the same app. The server adds:
- the AI proxy (`/__ai/*`)
- the report library (`/__reports/*`, `/reports/`)
- the stores behind the **Upload data** page and the shared case record: returns (`/__data/*`), registers
  (`/__registers/*`), reply documents (`/__docs/*`), the case log (`/__cases/*`) and governance (`/__governance`)

| Option | Command | URL | Use for |
|---|---|---|---|
| Development | `npm run dev` | http://localhost:5180 | working on the app, live reload |
| Node server | `npm run build && npm start` | http://127.0.0.1:8080 | a single office machine or VM |
| Docker | `docker compose up -d --build` | http://localhost:8080 | servers, repeatable installs |

There is no automatic deployment. Merging to `main` on GitHub changes nothing that is running. A machine runs the new
version only after someone updates it (section 4).

---

## 1. Prerequisites

- **Input files in `data/`**, built into the app at build time:
  - the taxpayer workbooks
  - `GST_Scrutiny_Rule_Matrix.xlsx`
  - the registers in `data/registers/`
- Node.js 20+ for options 1 and 2; Docker Engine / Docker Desktop for option 3.
- For PDF export: Edge or Chrome on the machine (option 2), Chromium is included in the Docker image (option 3).
- Optional AI key in `.env.local`:
  ```
  AI_API_KEY=your-key-here
  ```

**Decide which data the installation should carry.** Besides the real taxpayer workbooks, `data/` in the repository
holds synthetic data, all with `ZZ` PANs:
- the **synthetic ward SYN-PUNE-01**: 46 workbooks with `[SYN]` names
- four `[TEST]` workbooks
- the ward's made-up registers in `data/registers/`

That suits a demonstration. For an installation officers rely on:
1. Before the first build, remove the `*_SYN *.xlsx` and `*_TEST *.xlsx` workbooks and the `data/registers/` folder.
2. Load the real registers through **Upload data** afterwards.

Never present synthetic figures as departmental results.

## 2. Node server (no Docker)

```bash
npm ci
npm run build          # public/data.json + dist/
npm start              # reads .env.local, listens on 127.0.0.1:8080
```

Environment variables (set in the shell or `.env.local`):

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8080` | Listening port |
| `HOST` | `127.0.0.1` | Interface. Use `0.0.0.0` to accept connections from other machines |
| `AI_API_KEY` | none | Key for AI briefings. Without it the app runs deterministic-only |
| `BASIC_AUTH_USER`, `BASIC_AUTH_PASS` | none | When both are set, every request needs this username/password |
| `GST_ALLOW_REMOTE` | off | `1` lets other machines upload files, record case events, use AI and save reports. Only with basic auth or network controls |
| `DATA_DIR` | `./data` | Returns workbooks (uploads included) |
| `REGISTER_DIR` | `./data/registers` | The five registers, with `superseded/` and `originals/` |
| `STORE_DIR` | `./store` | Case log (`events.jsonl`) and reply documents (`docs/`) |
| `CHROME_PATH` | auto | Path to Chrome/Edge/Chromium for PDFs if not found automatically |
| `CHROME_NO_SANDBOX` | off | `1` inside containers |

The user running the server needs write access to `data/`, `store/` and `public/reports/`.

Serving other users on the network:

```bash
HOST=0.0.0.0 GST_ALLOW_REMOTE=1 BASIC_AUTH_USER=scrutiny BASIC_AUTH_PASS='choose-a-strong-one' npm start
```

Keep it running after logout with a service manager (Windows: NSSM or Task Scheduler at startup; Linux: systemd):

```ini
# /etc/systemd/system/gst-intelligence.service
[Unit]
Description=GST Intelligence
After=network.target

[Service]
WorkingDirectory=/opt/gst-intelligence
ExecStart=/usr/bin/node server.mjs
EnvironmentFile=/opt/gst-intelligence/.env.local
Environment=HOST=127.0.0.1 PORT=8080
Restart=on-failure
User=gst

[Install]
WantedBy=multi-user.target
```

## 3. Docker

```bash
docker compose up -d --build        # build and start
docker compose logs -f              # startup lines show whether the AI key and basic auth are on
docker compose down                 # stop (the volumes below are kept)
```

Three named volumes hold everything that changes at runtime:

| Volume | Mounted at | Holds |
|---|---|---|
| `workbooks` | `/app/data` | Returns workbooks and the registers (`registers/`), including everything uploaded on *Upload data* |
| `cases` | `/app/store` | The case log `events.jsonl` (append-only, hash-chained) and reply documents `docs/` |
| `reports` | `/app/public/reports` | Saved HTML/PDF scrutiny reports |

- `public/data.json` is rebuilt from the `workbooks` volume at every start.
- **A volume is filled from the image only when it is first created.** After that, workbooks or registers added to
  `data/` in the repository do not reach a running installation by rebuilding. Load them through *Upload data*
  (section 4).
- `.env.local` is passed at runtime via `env_file`; it is excluded from the image by `.dockerignore`.
- By default the port is published on `127.0.0.1` only. To expose it on the LAN, change the port line in
  `docker-compose.yml` to `"8080:8080"` and set credentials first, e.g. in a `.env` file next to the compose file:
  ```
  BASIC_AUTH_USER=scrutiny
  BASIC_AUTH_PASS=choose-a-strong-one
  ```

## 4. Updating an existing installation

Back up first (section 6), then:

```bash
git checkout main
git pull
docker compose up -d --build        # Docker
# or, without Docker: npm ci && npm run build, then restart npm start / the service
```

- **Code and screens** update with the rebuild.
- **Your data stays as it is**: uploaded workbooks, registers, the case log and saved reports are in the volumes (or
  in `data/`, `store/` and `public/reports/` without Docker).
- **New input files that came with the update** do not appear on a Docker installation that already has a
  `workbooks` volume. Upload them on **Upload data**: returns in step 1, registers in step 2, reply letters in step
  3. For example, to add the synthetic ward to an older installation:
  - the workbooks in `test-data/ward/`
  - the registers in `test-data/ward/registers/`
  - the letters in `test-data/ward/replies/`

  Re-creating the volume (`docker compose down -v`) also loads them, but **it deletes every upload, the case log
  and the saved reports**. Do not use it on an installation in use.
- Check afterwards: *Upload data* shows the expected taxpayer and register counts, and *Governance* reports the case
  log chain as intact.

## 5. Behind a reverse proxy (HTTPS)

Terminate TLS in your proxy and forward to the app. Example for nginx:

```nginx
server {
  listen 443 ssl;
  server_name gst-intelligence.example.internal;
  ssl_certificate     /etc/ssl/certs/gst.crt;
  ssl_certificate_key /etc/ssl/private/gst.key;
  client_max_body_size 45m;                 # returns uploads are up to 40 MB each; report saves carry the full HTML
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_read_timeout 300s;                # AI briefings take ~30 s; a large upload rebuilds data.json
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

Run the app with `GST_ALLOW_REMOTE=1` behind a proxy (requests arrive from the proxy, not 127.0.0.1) and keep
basic auth on, or use the proxy's own SSO.

## 6. Backups

| What | Why it matters | Docker backup |
|---|---|---|
| Case log and reply documents | Every officer action. Append-only: never edit `events.jsonl` by hand; an edited line breaks the hash chain and *Governance* reports it | `docker run --rm -v gstv4_cases:/s -v "$PWD":/b alpine tar czf /b/cases-backup.tgz -C /s .` |
| Workbooks and registers | Uploaded inputs, with superseded versions and original register files | `docker run --rm -v gstv4_workbooks:/d -v "$PWD":/b alpine tar czf /b/workbooks-backup.tgz -C /d .` |
| Saved reports | The report library | `docker run --rm -v gstv4_reports:/r -v "$PWD":/b alpine tar czf /b/reports-backup.tgz -C /r .` |

The `gstv4_` prefix is the compose project name (the folder name); `docker volume ls` shows the exact names. Without
Docker, back up `data/`, `store/` and `public/reports/`.

## 7. Security checklist

- [ ] Access restricted: basic auth, SSO at the proxy, or VPN / internal network only. The in-app sign-in page is
      a client-side gate and is not sufficient on its own for a shared deployment.
- [ ] HTTPS in front of the app for anything beyond one machine.
- [ ] `AI_API_KEY` stored only in `.env.local` / a secret store; rotate it if it was ever shared in chat or email.
- [ ] AI mode approved for live cases; *Mask identities* left on.
- [ ] `data/`, `store/` and the `reports` volume treated as confidential: restricted file permissions and backups.
      They hold taxpayer returns, officer actions and taxpayers' letters.
- [ ] Synthetic data removed if the installation is not a demonstration (section 1).
- [ ] The case record is shared on the server. Scoring settings, AI settings and cached AI briefings still live in
      each officer's browser storage; clearing site data removes them.

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| `dist/ not found` on `npm start` | Run `npm run build` first |
| AI light shows **off** | Check `AI_API_KEY` in `.env.local` / container env, then restart. `GET /__ai/status` should return `"envKey": true` |
| "… allowed from this computer only" on upload, AI or report save | Set `GST_ALLOW_REMOTE=1` (behind Docker/proxy) together with basic auth |
| Upload says the file is analysed "in this browser only" | The server could not save it (static hosting, or remote saving off). Fix the above and upload again |
| A register upload is rejected | The page lists every problem row. Fix them in the file and upload the whole file again; nothing was saved |
| New workbooks or registers from an update are missing | The Docker volume already existed: upload them on *Upload data* (section 4) |
| Reports save as HTML but no PDF | Set `CHROME_PATH` to Edge/Chrome/Chromium; in containers set `CHROME_NO_SANDBOX=1` |
| *Governance* says the case log chain is broken | `events.jsonl` was edited, reordered or truncated. Restore it from backup |
| `413` when uploading through a proxy | Raise `client_max_body_size` (section 5) |
| Port 5180/8080 busy | Change `PORT` (server) or `server.port` in `vite.config.js` (dev) |
