Isometric office shots for Reel 16 v3 (Paperclip AI), made with Lemo-Opuscar's "Isometric People Scene" style
(https://github.com/lemomo-ai/lemo-opuscar). Copy `engine.js` and `kit.js` (MIT) from
`styles/isometric-picture-book/demo/` into this folder (set `W = 1080, H = 1920` in kit.js), add
`fonts/Newsreader.woff2`, place it at `films/paperclip` in the library and render each shot:
`node core/render/video.mjs films/paperclip --fps 30 --size 1080x1920 --q shot=<hook|team|org|tasks|starter> --out films/paperclip/out/<shot>.mp4`
