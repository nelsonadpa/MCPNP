#!/usr/bin/env node
/**
 * build-chat-data.js
 * Scans shared/requests/ + shared/responses/ (including archive/) and generates
 * chat-data.js with var CHAT_DATA = [...] for the dashboard Chat tab.
 *
 * Usage: node build-chat-data.js
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const DIRS = [
  'shared/requests',
  'shared/requests/archive',
  'shared/responses',
  'shared/responses/archive',
];
const OUT = path.join(__dirname, 'chat-data.js');

// Agent name/color/letter map
const AGENTS = {
  test:         { name: 'Test Agent',     letter: 'T', color: '#22d3ee' },
  manual:       { name: 'Manual Agent',   letter: 'M', color: '#a78bfa' },
  config:       { name: 'Config Agent',   letter: 'C', color: '#fb923c' },
  observer:     { name: 'Observer Agent',  letter: 'G', color: '#10b981' },
  orchestrator: { name: 'Orchestrator',   letter: 'O', color: '#f472b6' },
  coordinator:  { name: 'Orchestrator',   letter: 'O', color: '#f472b6' },
};

function resolveAgent(raw) {
  const key = raw.toLowerCase().replace(/[^a-z]/g, '');
  for (const [k, v] of Object.entries(AGENTS)) {
    if (key.includes(k)) return v;
  }
  return { name: raw, letter: raw[0]?.toUpperCase() || '?', color: '#94a3b8' };
}

function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fname = path.basename(filePath, '.md');

  // Determine type from directory
  const isRequest = filePath.includes('/requests');

  // Parse from/to from filename patterns:
  //   requests:  from→to_NNN  or  from->to_NNN
  //   responses: from-to_NNN
  let from = '', to = '';
  const reqMatch = fname.match(/^(.+?)[→\->]+(.+?)_(\d+)$/);
  const respMatch = fname.match(/^(.+?)-(.+?)_(\d+)$/);
  if (reqMatch) {
    from = reqMatch[1]; to = reqMatch[2];
  } else if (respMatch) {
    from = respMatch[1]; to = respMatch[2];
  }

  // Parse metadata from markdown content
  let date = '', time = '', subject = '', body = '', items = [];

  for (const line of lines) {
    // Date
    const dateMatch = line.match(/\*\*Date\*\*:?\s*(.+)/i) || line.match(/\*\*DATE\*\*:?\s*(.+)/i);
    if (dateMatch && !date) {
      const d = dateMatch[1].trim();
      // Extract date portion
      const dmatch = d.match(/(\d{4}-\d{2}-\d{2})/);
      if (dmatch) date = dmatch[1];
      // Extract time if present
      const tmatch = d.match(/(\d{1,2}:\d{2})/);
      if (tmatch) time = tmatch[1];
    }

    // Subject from first # heading (not ##)
    const h1Match = line.match(/^#\s+(?:Request:|Response:)?\s*(.+)/);
    if (h1Match && !subject) {
      subject = h1Match[1].trim();
    }

    // From/To from content if not parsed from filename
    const fromMatch = line.match(/\*\*From\*\*:?\s*(.+)/i);
    if (fromMatch && !from) from = fromMatch[1].trim().replace(/\*\*/g, '');
    const toMatch = line.match(/\*\*To\*\*:?\s*(.+)/i);
    if (toMatch && !to) to = toMatch[1].trim().replace(/\*\*/g, '');
  }

  // Extract body: first substantial paragraph after metadata
  let inMeta = true;
  let bodyLines = [];
  for (const line of lines) {
    if (line.startsWith('---')) { inMeta = false; continue; }
    if (inMeta) continue;

    if (line.startsWith('## ') && bodyLines.length === 0) continue;
    if (line.startsWith('## ') && bodyLines.length > 0) break;

    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      items.push(trimmed.replace(/^[-*]\s+/, '').replace(/\*\*/g, ''));
    } else if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('|') && !trimmed.startsWith('```')) {
      bodyLines.push(trimmed);
    }

    if (bodyLines.length >= 3 && items.length >= 2) break;
  }

  body = bodyLines.slice(0, 3).join(' ').replace(/\*\*/g, '');
  if (body.length > 300) body = body.substring(0, 297) + '...';
  items = items.slice(0, 6);

  // Resolve agent info
  const fromAgent = resolveAgent(from);
  const toAgent = resolveAgent(to);

  if (!date) date = '2026-02-21'; // fallback
  if (!time) time = isRequest ? '10:00' : '10:30';

  return {
    from: fromAgent.name,
    fromLetter: fromAgent.letter,
    fromColor: fromAgent.color,
    to: toAgent.name,
    date,
    time,
    subject: subject || fname,
    body: body || '(see attached file)',
    items: items.length > 0 ? items : undefined,
    file: path.basename(filePath),
    type: isRequest ? 'request' : 'response',
  };
}

// Collect all .md files
const messages = [];
for (const dir of DIRS) {
  const fullDir = path.join(BASE, dir);
  if (!fs.existsSync(fullDir)) continue;
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    try {
      const msg = parseFile(path.join(fullDir, file));
      if (msg.from && msg.to) messages.push(msg);
    } catch (e) {
      console.error(`Skipping ${file}: ${e.message}`);
    }
  }
}

// Sort by date + time
messages.sort((a, b) => {
  const da = a.date + ' ' + a.time;
  const db = b.date + ' ' + b.time;
  return da.localeCompare(db);
});

// Write output
const output = `/* Auto-generated by build-chat-data.js — ${new Date().toISOString().split('T')[0]} */\nvar CHAT_DATA = ${JSON.stringify(messages, null, 2)};\n`;
fs.writeFileSync(OUT, output, 'utf-8');
console.log(`Generated ${OUT} with ${messages.length} messages`);
