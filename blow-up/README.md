# 💥 blow-up

A red button that says **BLOW UP**. Press it and it deletes its own file.

That's the whole app.

![one button](https://img.shields.io/badge/features-1-e1121b) ![deps](https://img.shields.io/badge/dependencies-0-333)

## The honest version

A web page cannot delete a file off your disk — the browser sandbox exists precisely
to stop that. So the button has two modes, and it picks the right one by itself:

| how you open it | what the button does |
| --- | --- |
| `node serve.js` → http://localhost:8080 | **Really deletes it.** `POST /__detonate` → `fs.unlink('index.html')`. Reload and you get a `410 Gone`. |
| double-click `index.html`, or GitHub Pages | Can't reach the disk, so it destroys *itself* instead — and remembers, so it stays a crater on reload. |

Either way you get the fuse, the bang, the shockwave, 260 pieces of debris, and a
smouldering hole where the page used to be.

## Run it

```sh
node serve.js          # armed — http://localhost:8080
PORT=3000 node serve.js
```

No install step, no `package.json`, no dependencies. Node's stdlib and one HTML file.

## Undo

`serve.js` copies `index.html` to `.backup/` when it starts, so:

```sh
node serve.js --resurrect     # put it back
git restore blow-up/index.html   # or just ask git
```

The sandboxed version has a **put it back** button on the gravestone (it clears the
one `localStorage` key it set).

## How it works

- `index.html` — the button, a canvas explosion (debris, embers, shockwave, drifting
  smoke), a WebAudio fuse and boom synthesized on the spot, and the gravestone.
  Zero images, zero libraries.
- `serve.js` — ~100 lines of `http` + `fs`. A boring static server with exactly one
  dangerous route on it.

The `fetch('__detonate')` fires *during* the 850 ms fuse, so by the time the flash
clears the page already knows whether it actually died — and tells you which.
