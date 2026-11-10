# NoteAI website

A single-page marketing site for NoteAI: practical AI, taught simply.

Plain HTML, CSS and JavaScript with no build step and no dependencies.

- `index.html` — content and structure
- `styles.css` — design, 3D transforms, animations, responsive layout
- `main.js` — 3D hero scene (canvas), scroll-driven card stack, tilt cards, counters, typewriter, menu

## Run it

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

It can be hosted as-is on GitHub Pages, Netlify or Vercel.

## Editing content

All copy lives in `index.html`. The numbers in the "proof" section are set with
`data-count` attributes; update them (and the "as of" date) when the figures change.
