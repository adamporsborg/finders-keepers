# /start — Launch the Finders Keepers dashboard

```bash
python3 -m http.server 4178 --directory ~/finders-keepers
```

Then tell the user: open `http://localhost:4178` in their browser.

If port 4178 is already in use:
```bash
lsof -ti:4178 | xargs kill -9 2>/dev/null
python3 -m http.server 4178 --directory ~/finders-keepers
```

After confirming the server is running, ask: "What are you selling, and where?"
Then run `/hunt` with their answer.
