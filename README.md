# WCO Data Model front-page concept — v2.1

A dependency-free HTML/CSS/JavaScript front-page prototype for a possible modernization of the WCO Data Model application.

## Run locally

The page fetches `content.json`, so serve the directory over HTTP rather than opening the HTML directly:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/`.

## v2.1 visual refinements

- The procedural world/planet is slightly more asymmetric: the left side sits lower rather than describing a mathematically perfect horizon.
- The world begins lower in the opening viewport, rises immediately with scroll, reaches its previous settled position by the `Invisible when it works. Essential when systems meet.` chapter, and then stops moving vertically.
- The Executive section's dark/light curved transitions now use a soft ~25 px atmospheric blur instead of a crisp cut edge.
- Signal routes now travel across the planet's visible surface rather than being projected tightly to its rim.
- Signal palette retains blue/gold and adds restrained light green and muted red.

## Content

All editorial copy, release information, application destinations and the YouTube video ID live in `content.json`. The HTML is therefore largely structural and could later consume API/database-backed localized content without redesigning the page.

## Video behavior

The YouTube iframe is only instantiated when needed. On the first qualifying visit it may autoplay muted once the video is essentially fully visible. A `localStorage` flag prevents future automatic playback while preserving manual playback.

## Dependencies

None. Vanilla HTML, CSS and JavaScript only.
