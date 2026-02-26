# Shared Workspace — eRegistrations Agent Hub

This directory is the shared workspace between the 3 specialized agents.

## Structure

```
shared/
├── profiles/              # Agent profiles
│   ├── test-agent.md      # Test Agent (Verifier)
│   ├── manual-agent.md    # Manual Agent (Extractor)
│   └── config-agent.md    # Config Agent (Configurator)
├── requests/              # Inter-agent requests: [from]→[to]_NNN.md
│   └── archive/           # Completed requests
├── responses/             # Responses: [from]-[to]_NNN.md
│   └── archive/           # Consumed responses
├── knowledge/             # Symlinks to active country's knowledge
│   ├── CHANGELOG.md       → countries/cuba/knowledge/CHANGELOG.md
│   └── SERVICES-MAP.md    → countries/cuba/knowledge/SERVICES-MAP.md
└── COMMUNICATION-PROTOCOL.md  # Request/response format
```

## Country-Specific Data

Country knowledge, missions, tests, and skills live in `countries/<country>/`:

```
countries/
├── cuba/
│   ├── knowledge/         # SERVICES-MAP, CHANGELOG, field keys, guides
│   ├── missions/          # MISSIONS.md (M-001..M-005)
│   ├── testing/           # PRDs, specs, page objects
│   ├── skills/            # fix-determinant-effects
│   ├── analysis/          # Architecture docs, templates, bug reports
│   └── sitreps/           # Situation reports
└── jamaica/
    ├── knowledge/         # SERVICES-MAP, CHANGELOG
    ├── missions/          # MISSIONS.md (M-J001..)
    ├── testing/           # PRDs, specs, page objects
    └── skills/
```

## How it works

1. At the start of each session, each agent reads:
   - Its own profile in `profiles/`
   - The other agents' profiles
   - The active country's CHANGELOG for recent changes
   - `requests/` for pending requests (ignore `archive/`)

2. To request something from another agent:
   - Create a file in `requests/[from]→[to]_NNN.md`
   - Include the country name when relevant
   - The target agent checks `requests/` and responds in `responses/`
   - When completed, both files are moved to `archive/`

3. The Config Agent logs ALL changes in `countries/<country>/knowledge/CHANGELOG.md`
