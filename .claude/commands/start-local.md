Start the Luau documentation site locally with LLM content generation.

## What to do

Run the following steps **sequentially**. Stop and report if any step fails.

### 1. Prerequisites check

Verify that `node` (v22+) is available on PATH:

```bash
node --version
```

### 2. Install dependencies

Install the site dependencies if not already present:

```bash
ls node_modules/.bin/astro 2>/dev/null || npm install
```

Install the LLM action dependencies if not already present:

```bash
ls .github/actions/generate-llm-content/node_modules/.bin/tsx 2>/dev/null || (cd .github/actions/generate-llm-content && npm install)
```

### 3. Generate LLM content

Run the generator to produce `llms.txt`, `llms-full.txt`, and `llm/**/*.md` into `public/`:

```bash
cd .github/actions/generate-llm-content && npm run start:local
```

Confirm the output exists:

```bash
ls public/llms.txt public/llms-full.txt
find public/llm -name '*.md' | wc -l
```

### 4. Start the dev server

Start the Astro dev server:

```bash
npm run dev
```

This serves the site at `http://localhost:4321`. The LLM files are available at:

- http://localhost:4321/llms.txt
- http://localhost:4321/llms-full.txt
- http://localhost:4321/llm/types/basic-types.md

### 5. Report

Print a summary:
- Number of LLM docs generated
- Dev server URL
- Confirm `llms.txt` is accessible via the dev server
