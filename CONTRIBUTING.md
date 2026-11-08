# Contributing

Thanks for helping to improve `n8n-nodes-bangladesh`. Bug reports, corrections to Bangla
spellings and new Bangladesh-specific helpers are all welcome.

## Setup

```bash
git clone https://github.com/saizul/n8n-nodes-bangladesh.git
cd n8n-nodes-bangladesh
npm install
```

Requires Node.js 22 or newer.

> `n8n-workflow` pulls in a native module (`isolated-vm`) that may fail to compile on very new
> Node.js versions. The package is only needed for types and a few runtime helpers here, so
> `npm install --ignore-scripts` works fine for development.

## Project layout

```
nodes/BangladeshUtils/
  BangladeshUtils.node.ts     node class (item loop, continueOnFail, paired items)
  BangladeshUtils.node.json   codex metadata
  bangladeshUtils.svg         icon
  execute.ts                  maps node parameters to library calls
  descriptions/               parameter definitions per resource
  lib/                        pure TypeScript logic, no runtime dependencies
test/                         vitest tests
```

Put all logic in `lib/`. Library modules must stay free of n8n imports and runtime
dependencies so they can be tested in isolation.

## Scripts

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `npm run build`     | Compile TypeScript and copy icons to `dist/` |
| `npm test`          | Run the vitest suite                         |
| `npm run lint`      | ESLint with `eslint-plugin-n8n-nodes-base`   |
| `npm run format`    | Format with Prettier                         |
| `npm run typecheck` | Type-check sources and tests                 |

## Testing the node in n8n

Build, then link the package into your n8n custom folder:

```bash
npm run build
mkdir -p ~/.n8n/custom && cd ~/.n8n/custom
npm init -y && npm link n8n-nodes-bangladesh   # after `npm link` inside this repo
```

Restart n8n and search for "Bangladesh Utils".

## Pull requests

1. Open an issue first for larger changes.
2. Add tests for every behaviour change. Bug fixes need a test that fails without the fix.
3. Run `npm run lint`, `npm test` and `npm run build` before pushing.
4. Add a line to `CHANGELOG.md` under "Unreleased".
5. Keep the scope small: one concern per pull request.

## Data corrections

Division and district names live in `nodes/BangladeshUtils/lib/address.ts`. If you change a
Bangla spelling please cite an official source (BBS, Local Government Division or the Bangla
Academy) in the pull request. The calendar rules are documented in `lib/date.ts`.
