const Q = new URLSearchParams(location.search);
const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all([500, 600, 700].map(w => document.fonts.load(`${w} 40px Newsreader`)));
const film = await import('./film.js');
const shot = Q.get('shot') || 'hook';
window.DUR = film.DURS[shot];
window.render = t => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; film.render(g, t, shot); };
window.READY = true;
