# rui

To install dependencies:

```bash
bun install
```

To run:

1. Edit `server.ts` to fit your environment.
> If you aren't using SSL/TLS, remove these lines from `server.ts`:
```
 tls: {
    cert: Bun.file(TLS_CERT), // path to tls cert
    key: Bun.file(TLS_KEY) // path to tls key
	},
 ```
2. `bun run index.ts` or `./startserver`
> `startserver` script requires `nohup` in PATH.
