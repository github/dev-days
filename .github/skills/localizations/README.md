# Localizations

## What this skill is for

Localize a project's root README and Markdown documentation into the target locales supported by the skill's locale rules. The skill preserves Markdown structure, code, and links, reviews translations for quality, and uses recorded source baselines to update changed content without unnecessarily retranslating unchanged sections.

See [SKILL.md](SKILL.md) for the full workflow and prerequisites.

## Install with GitHub Copilot CLI

With GitHub Copilot CLI installed, run these commands in your terminal:

```sh
copilot plugin marketplace add justinyoo/skills
copilot plugin install localizations@justinyoo-skills
```

If you already registered the marketplace, skip the first command. If you installed the complete collection, this skill is already included.

For other agents, installation methods, and local checkouts, see the [Skills installation guide](../../docs/skills-installation-guide.md).

## Usage

In a GitHub Copilot CLI session, try:

```text
/localizations Localize this project's README.md and docs directory into all supported locales.
```
