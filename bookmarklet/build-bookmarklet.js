#!/usr/bin/env node
/**
 * build-bookmarklet.js
 * Strategy: bookmarklet loads er-filler.js via a tiny local HTTP server
 * OR from a data: URL. Also generates a seed script for presets.
 *
 * v3.0: Also reads Part B role presets from presets/ directory
 *
 * Usage: node build-bookmarklet.js
 */
const fs   = require('fs');
const path = require('path');

const ROOT           = path.resolve(__dirname, '..');
const PRESETS_DIR    = path.join(ROOT, 'er-presets');
const ROLE_PRESETS_DIR = path.join(__dirname, 'presets');
const SRC_FILE       = path.join(__dirname, 'er-filler.js');

// 1. Read source
let src = fs.readFileSync(SRC_FILE, 'utf8');

// 2. Collect all Part A presets from er-presets/
const presets = {};
if (fs.existsSync(PRESETS_DIR)) {
  const entries = fs.readdirSync(PRESETS_DIR);
  for (const entry of entries) {
    const entryPath = path.join(PRESETS_DIR, entry);
    const stat = fs.statSync(entryPath);
    if (stat.isDirectory()) {
      const serviceId = entry;
      presets[serviceId] = {};
      const files = fs.readdirSync(entryPath).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const scenario = path.basename(file, '.json');
        try {
          presets[serviceId][scenario] = JSON.parse(fs.readFileSync(path.join(entryPath, file), 'utf8'));
        } catch (e) {
          console.warn(`  Warning: Could not parse ${entry}/${file}: ${e.message}`);
        }
      }
    } else if (entry.endsWith('.json') && entry !== 'index.json') {
      try {
        const data = JSON.parse(fs.readFileSync(entryPath, 'utf8'));
        if (data._meta?.serviceId) {
          const sid = data._meta.serviceId;
          const sc = data._meta.scenario || 'demo';
          if (!presets[sid]) presets[sid] = {};
          presets[sid][sc] = data;
        }
      } catch (e) {
        console.warn(`  Warning: Could not parse ${entry}: ${e.message}`);
      }
    }
  }
}

const presetCount = Object.values(presets).reduce((sum, svc) => sum + Object.keys(svc).length, 0);
const serviceCount = Object.keys(presets).length;

// 3. Collect Part B role presets from presets/
// Structure: EMBEDDED_ROLE_PRESETS = { serviceId: { roleName: preset, ... }, ... }
const rolePresets = {};
let rolePresetCount = 0;

if (fs.existsSync(ROLE_PRESETS_DIR)) {
  const entries = fs.readdirSync(ROLE_PRESETS_DIR).filter(f => f.endsWith('.json'));
  for (const entry of entries) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(ROLE_PRESETS_DIR, entry), 'utf8'));

      // Format 1: Consolidated role preset file (has "roles" key with multiple roles)
      if (data.roles && data.serviceId) {
        const sid = data.serviceId;
        if (!rolePresets[sid]) rolePresets[sid] = {};
        for (const [roleName, preset] of Object.entries(data.roles)) {
          rolePresets[sid][roleName] = preset;
          rolePresetCount++;
        }
        continue;
      }

      // Format 2: Individual role preset with _meta.roleId or _meta.role
      const meta = data._meta;
      if (!meta?.serviceId) continue;
      const sid = meta.serviceId;

      if (meta.roleId || meta.role) {
        // It's a role preset — store in rolePresets keyed by roleName
        const roleName = meta.roleName || meta.role || meta.serviceName;
        if (!roleName) continue;
        if (!rolePresets[sid]) rolePresets[sid] = {};
        rolePresets[sid][roleName] = data;
        rolePresetCount++;
      } else if (meta.serviceName && meta.serviceName.includes(' - ')) {
        // Infer role name from serviceName pattern: "SEZ - Documents review"
        // The part after the dash is the role name
        const parts = meta.serviceName.split(' - ');
        if (parts.length >= 2) {
          const roleName = parts.slice(1).join(' - ').trim();
          if (!rolePresets[sid]) rolePresets[sid] = {};
          rolePresets[sid][roleName] = data;
          rolePresetCount++;
        }
      }
    } catch (e) {
      console.warn(`  Warning: Could not parse presets/${entry}: ${e.message}`);
    }
  }
}

const roleServiceCount = Object.keys(rolePresets).length;

// 4. For the built file (served version), embed both preset types
let srcWithPresets = src;
if (presetCount > 0) {
  srcWithPresets = srcWithPresets.replace(
    "const EMBEDDED_PRESETS = '__EMBEDDED_PRESETS__';",
    `const EMBEDDED_PRESETS = ${JSON.stringify(presets)};`
  );
  console.log(`  ${presetCount} Part A preset(s) for ${serviceCount} service(s)`);
} else {
  console.log('  No Part A presets found in er-presets/');
}

if (rolePresetCount > 0) {
  srcWithPresets = srcWithPresets.replace(
    "const EMBEDDED_ROLE_PRESETS = '__EMBEDDED_ROLE_PRESETS__';",
    `const EMBEDDED_ROLE_PRESETS = ${JSON.stringify(rolePresets)};`
  );
  console.log(`  ${rolePresetCount} Part B role preset(s) for ${roleServiceCount} service(s)`);
} else {
  console.log('  No Part B role presets found in presets/');
}

// For the inline bookmarklet, never embed presets (too large) — presets come from seed

// 5. Write the full JS file with presets (for served version)
fs.writeFileSync(path.join(__dirname, 'er-filler.built.js'), srcWithPresets);

// 6. Generate a seed-presets.js that can be pasted in console to seed localStorage
const seedScript = `(function(){
  var STORAGE_KEY='er_presets';
  var ROLE_STORAGE_KEY='er_role_presets';
  var presets=${JSON.stringify(presets)};
  var rolePresets=${JSON.stringify(rolePresets)};
  var current=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
  var seeded=0;
  Object.keys(presets).forEach(function(sid){
    Object.keys(presets[sid]).forEach(function(sc){
      if(!current[sid])current[sid]={};
      current[sid][sc]=presets[sid][sc];
      seeded++;
    });
  });
  localStorage.setItem(STORAGE_KEY,JSON.stringify(current));
  var currentRoles=JSON.parse(localStorage.getItem(ROLE_STORAGE_KEY)||'{}');
  var roleSeeded=0;
  Object.keys(rolePresets).forEach(function(sid){
    Object.keys(rolePresets[sid]).forEach(function(rn){
      if(!currentRoles[sid])currentRoles[sid]={};
      currentRoles[sid][rn]=rolePresets[sid][rn];
      roleSeeded++;
    });
  });
  localStorage.setItem(ROLE_STORAGE_KEY,JSON.stringify(currentRoles));
  console.log('eR Filler: seeded '+seeded+' preset(s) + '+roleSeeded+' role preset(s)');
  alert('Presets loaded: '+seeded+' preset(s) + '+roleSeeded+' role preset(s). Click the bookmarklet now.');
})();`;
fs.writeFileSync(path.join(__dirname, 'seed-presets.js'), seedScript);

// 7. Generate install.html with TWO bookmarklets:
//    - One: the filler (loads er-filler.built.js from same origin via a script tag trick)
//    - Two: the seed script (one-time, loads presets into localStorage)

// The filler bookmarklet — loads the full JS by injecting a <script> tag
// This approach: encode the FULL source as a data URI bookmarklet
// But first check size — if too big, use the fetch approach instead

// For the inline bookmarklet, use the source WITHOUT presets (smaller)
const fullBookmarklet = 'javascript:' + encodeURIComponent('(function(){' + src.replace(/\n/g, '\n') + '})()');
const useLoader = fullBookmarklet.length > 100000; // if > 100KB, use loader approach

let fillerBookmarklet;
if (useLoader) {
  // Too big for inline — use a loader that fetches from a local server
  fillerBookmarklet = "javascript:(function(){var s=document.createElement('script');s.src='https://agent-hub-delta-opal.vercel.app/er-filler.built.js';document.head.appendChild(s);})()";
  console.log('  Source too large for inline bookmarklet, using loader approach');
  console.log('  Bookmarklet will load from https://agent-hub-delta-opal.vercel.app/er-filler.built.js');
} else {
  fillerBookmarklet = fullBookmarklet;
}

const seedBookmarklet = 'javascript:' + encodeURIComponent(seedScript);

// 8. Write bookmarklet URLs
fs.writeFileSync(path.join(__dirname, 'er-filler.bookmarklet.txt'), fillerBookmarklet);
fs.writeFileSync(path.join(__dirname, 'seed-presets.bookmarklet.txt'), seedBookmarklet);

// 9. Generate install.html
const totalPresets = presetCount + rolePresetCount;
const totalServices = new Set([...Object.keys(presets), ...Object.keys(rolePresets)]).size;

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>eR Form Filler - Install</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,system-ui,'Segoe UI',sans-serif;background:#f7fafc;color:#1a202c;margin:0}
  .c{max-width:640px;margin:40px auto;padding:0 20px}
  h1{font-size:28px;font-weight:800;color:#1a365d;margin-bottom:6px}
  .sub{color:#718096;margin-bottom:30px;font-size:14px}
  .stats{display:flex;gap:16px;margin-bottom:24px}
  .stat{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;flex:1;text-align:center}
  .stat-n{font-size:24px;font-weight:800;color:#2b6cb0}
  .stat-l{font-size:11px;color:#718096;margin-top:2px}
  .step{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:14px}
  .sn{display:inline-flex;width:28px;height:28px;background:#2b6cb0;color:#fff;border-radius:50%;align-items:center;justify-content:center;font-weight:700;font-size:13px;margin-right:8px;vertical-align:middle}
  h2{display:inline;font-size:16px;font-weight:700;vertical-align:middle}
  p{color:#718096;font-size:14px;margin-top:10px;line-height:1.6}
  .bm{display:inline-block;margin-top:14px;background:linear-gradient(135deg,#1a365d,#2b6cb0);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(43,108,176,.4);cursor:grab;transition:transform .15s}
  .bm:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(43,108,176,.5)}
  .bm.seed{background:linear-gradient(135deg,#276749,#38a169)}
  .hint{display:inline-block;margin-left:12px;font-size:12px;color:#a0aec0;vertical-align:middle}
  code{background:#edf2f7;padding:2px 6px;border-radius:4px;font-size:13px}
  .presets-list{margin-top:12px}
  .pl-item{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-bottom:1px solid #edf2f7;font-size:13px}
  .pl-name{font-weight:600;color:#2d3748}
  .pl-sc{font-size:11px;color:#718096}
  .footer{text-align:center;padding:30px 0;font-size:12px;color:#a0aec0}
  .note{background:#fffaf0;border:1px solid #fbd38d;border-radius:8px;padding:10px 14px;font-size:12px;color:#744210;margin-top:10px}
</style></head><body>
<div class="c">
  <h1>eR Form Filler v3.0</h1>
  <p class="sub">Fill eRegistrations forms instantly with presets &mdash; now with Auto-Pilot for Part B roles</p>
  <div class="stats">
    <div class="stat"><div class="stat-n">${totalServices}</div><div class="stat-l">Services</div></div>
    <div class="stat"><div class="stat-n">${presetCount}</div><div class="stat-l">Part A Presets</div></div>
    <div class="stat"><div class="stat-n">${rolePresetCount}</div><div class="stat-l">Role Presets</div></div>
  </div>

  <div class="step">
    <span class="sn">1</span><h2>Install: Drag BOTH buttons to bookmarks bar</h2>
    <p>
      <a class="bm" href="${fillerBookmarklet}">eR Form Filler</a>
      <span class="hint">main tool</span>
    </p>
    ${totalPresets > 0 ? `<p>
      <a class="bm seed" href="${seedBookmarklet}">Seed Presets (${totalPresets})</a>
      <span class="hint">one-time: loads presets into browser</span>
    </p>` : ''}
  </div>

  <div class="step">
    <span class="sn">2</span><h2>First time: Seed your presets</h2>
    <p>Open <strong>any eRegistrations page</strong> and click <strong>"Seed Presets"</strong> once. This loads ${totalPresets} preset(s) into your browser's localStorage. You only need to do this once (or after updates).</p>
  </div>

  <div class="step">
    <span class="sn">3</span><h2>Use: Fill forms instantly</h2>
    <p><strong>Part A:</strong> Open a service form, click <strong>"eR Form Filler"</strong>, select scenario, click <strong>Fill Form</strong>.</p>
    <p><strong>Part B (Auto-Pilot):</strong> Open a Part B task, click <strong>"eR Form Filler"</strong>, then click <strong>"Auto-Pilot"</strong>. It detects the role, fills the preset, and highlights the action button.</p>
  </div>

  ${presetCount > 0 ? `<div class="step">
    <span class="sn">i</span><h2>Part A Presets</h2>
    <div class="presets-list">${Object.entries(presets).map(([sid, scs]) => {
      const name = Object.values(scs)[0]?._meta?.serviceName || sid.slice(0,30)+'...';
      return `<div class="pl-item"><span class="pl-name">${name}</span><span class="pl-sc">${Object.keys(scs).join(', ')}</span></div>`;
    }).join('')}</div>
  </div>` : ''}

  ${rolePresetCount > 0 ? `<div class="step">
    <span class="sn">i</span><h2>Part B Role Presets</h2>
    <div class="presets-list">${Object.entries(rolePresets).map(([sid, roles]) => {
      const roleNames = Object.keys(roles);
      const firstMeta = Object.values(roles)[0]?._meta;
      const svcName = firstMeta?.serviceName || sid.slice(0,30)+'...';
      return `<div class="pl-item"><span class="pl-name">${svcName}</span><span class="pl-sc">${roleNames.length} roles: ${roleNames.slice(0,4).join(', ')}${roleNames.length > 4 ? '...' : ''}</span></div>`;
    }).join('')}</div>
  </div>` : ''}

  <div class="footer">eR Form Filler v3.0 - Built ${new Date().toISOString().slice(0,10)}</div>
</div></body></html>`;

fs.writeFileSync(path.join(__dirname, 'install.html'), html);

// 10. If loader approach, generate serve.js
if (useLoader) {
  const serveScript = `#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 7788;
const file = path.join(__dirname, 'er-filler.built.js');
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/javascript');
  res.end(fs.readFileSync(file, 'utf8'));
}).listen(PORT, () => console.log('eR Filler server on http://localhost:' + PORT));
`;
  fs.writeFileSync(path.join(__dirname, 'serve.js'), serveScript);
}

console.log('\n  Build complete:');
console.log(`   er-filler.built.js          (${(srcWithPresets.length/1024).toFixed(1)} KB)`);
console.log(`   er-filler.bookmarklet.txt   (${(fillerBookmarklet.length/1024).toFixed(1)} KB) ${useLoader ? '[LOADER]' : '[INLINE]'}`);
if (totalPresets > 0) {
  console.log(`   seed-presets.bookmarklet.txt (${(seedBookmarklet.length/1024).toFixed(1)} KB)`);
  console.log(`   seed-presets.js`);
}
console.log(`   install.html`);
console.log(`\n-> Open install.html and drag both buttons to your bookmarks bar`);
