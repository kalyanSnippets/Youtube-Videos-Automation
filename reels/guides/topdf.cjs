const { chromium } = require('playwright');
(async () => { const br = await chromium.launch(); const pg = await br.newPage();
 for (const n of process.argv.slice(2)) { await pg.goto('file://' + __dirname + '/' + n + '.html'); await pg.waitForTimeout(500);
  await pg.pdf({ path: __dirname + '/' + n + '_setup_guide.pdf', format: 'A4', printBackground: true }); console.log(n); }
 await br.close(); })();
