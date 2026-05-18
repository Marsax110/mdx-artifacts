# Releasing

This project currently uses manual npm publishing.

CI and release checks are quality gates. They do not publish the package and they do not configure an npm token.

## Release Model

- Publish from a clean local checkout.
- Keep `mdx-artifacts` as a single npm package.
- Use CI, `release:check`, `pack:smoke`, and `npm pack --dry-run` as pre-publish gates.
- Run `npm publish` manually only after the package contents and version are confirmed.

## Before Publishing

1. Confirm the worktree is clean.

```bash
git status --short
```

2. Confirm the version in `package.json` is the version intended for npm.

```bash
node -p "require('./package.json').version"
```

3. Confirm CI has passed for the commit being published.

If CI is not available yet, run the local gates below and treat the publish as local-manual.

4. Run the default validation baseline.

```bash
pnpm check
```

5. Run the lightweight release gate.

```bash
pnpm release:check
```

6. Run the package smoke test.

```bash
pnpm pack:smoke
```

7. Run the final npm pack dry run.

```bash
npm pack --dry-run --cache /private/tmp/mdx-artifacts-npm-cache
```

8. Inspect the dry-run output.

Confirm the tarball includes expected files such as:

- `dist/lib`
- `agents/AGENTS.snippet.md`
- `artifact-docs/examples/*.mdx`
- `docs/*.md`
- `README.md`
- `README.zh-CN.md`
- `LICENSE`

Confirm the tarball does not include:

- `src/`
- `docs/local/`
- `.storybook/`
- Storybook stories
- sourcemaps
- `node_modules/`
- generated `dist/artifacts`
- `.state.json`
- `.local.*`
- `.log`
- `.tgz`

## Publishing

1. Confirm npm authentication.

```bash
npm whoami
```

2. Publish the package.

```bash
npm publish
```

Do not publish if any pre-publish gate failed or if the dry-run tarball contains unexpected files.

## After Publishing

1. Confirm npm shows the expected version.

```bash
npm view mdx-artifacts version
```

2. Smoke test the published package from a temporary project.

```bash
mkdir -p /private/tmp/mdx-artifacts-published-smoke
cd /private/tmp/mdx-artifacts-published-smoke
npm init -y
npm install --save-dev mdx-artifacts
npx mdx-artifacts init --yes
npx mdx-artifacts validate artifact-docs/examples/hello.mdx
npx mdx-artifacts build artifact-docs/examples/hello.mdx
```

3. If the post-publish smoke test fails, do not overwrite the published version.

Publish a follow-up patch version with a fix instead.

## Not Automated Yet

These steps are intentionally not automated yet:

- npm token setup
- GitHub release creation
- changelog generation
- version bump automation
- tag-based publishing

Add those only when manual publishing becomes a real bottleneck.
