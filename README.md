# shivanisudhir.design

Portfolio site for **Shivani Sudhir** — product designer, Sydney.

## Stack

Plain HTML, CSS, and a single small JS file. No build step, no framework.
Hosted on GitHub Pages at [shivaanis.github.io/shivanisudhir.design](https://shivaanis.github.io/shivanisudhir.design/).

## Files

| File | Purpose |
| ---- | ------- |
| `index.html` | All content and structure. |
| `styles.css` | The full visual system. |
| `main.js`    | Cursor, reveals, parallax, magnetic links. |
| `CNAME`      | GitHub Pages custom-domain pointer. |
| `assets/icons/` | App icon for each Playpal Apps product. |
| `assets/work/`  | Case-study cover image for each product. |

## Local preview

Any static server. From this directory:

```sh
python3 -m http.server 8080
# → http://localhost:8080
```

## Deploy

Push to `main`. GitHub Pages serves the site automatically at
`https://shivaanis.github.io/shivanisudhir.design/`. Source is set
under repository *Settings → Pages* → branch `main` / root.
