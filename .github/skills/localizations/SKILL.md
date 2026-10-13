---
name: localizations
description: A skill that localizes contents into given locales.
---

# Localize contents into given locales

A skill that localizes contents into given locales.

## How it works

The skill takes input content and a list of target locales. It then translates the content into each specified locale, providing localized versions for each.

### Content structure

```text
.
├── README.md
├── docs/
│   ├── *.md
│   └── <any/path>/
│       └── *.md
└── localizations/
    └── <locale>/
        ├── .localization-state.json
        ├── README.md
        └── docs/
            ├── *.md
            └── <any/path>/
                └── *.md
```

### Input contents

Here are the list of contents for localization:

- `README.md`: The main documentation file for the project.
- All markdown files in the `docs` directory **and its subdirectories** (`docs/**/*.md`): The main content files for the project documentation.

Both `README.md` and the `docs` tree are in scope. The **`docs`** directory is the default location for content files, but `README.md` at the project root is always included as well.

Files already under `localizations/` are **outputs**, not inputs—never treat them as source content to be localized again.

### Target locales

Target locales are defined in the `rules` directory as markdown files in this skill (`rules/ko-kr.md`, for example). **To determine which locales to process, list the files in `rules/`: each `<locale>.md` file corresponds to exactly one supported target locale.** Each locale has its own set of rules and guidelines for translation, ensuring that the localized content is appropriate for the target audience.

Locale identifiers use lowercase with a hyphen (for example, `ko-kr`). This is the canonical casing for both the rules filename and the output directory in this skill; keep them consistent.

### Output contents

All the localized contents are stored in the `localizations` directory, with each locale having its own subdirectory. For example, the localized content for Korean would be stored in `localizations/ko-kr/`.

It's assumed that the **`localizations`** directory is the default location for all the localized content files.

Keep per-file source baselines in `localizations/<locale>/.localization-state.json` using the format below. This is workflow metadata, not source content to translate.

## Localization process

There are three cases for localization. Compare the **source tree** against the existing `localizations/<locale>/` tree, using each file's recorded source baseline to detect changes:

- **Original exists, no localized version for the locale:** Create a new localized document.
- **Both original and localized versions exist:** Follow the source-baseline procedure below, then update only the affected sections. Do not re-translate unchanged sections unnecessarily.
- **Localized version exists, but the original has been deleted:** Confirm that the source was deleted, not merely inaccessible or absent from a partial checkout. Delete the corresponding orphaned localized document and then remove its baseline entry; prune only now-empty locale subdirectories. If the mapping is uncertain or the localized file differs from its recorded fingerprint, ask before deleting it.

The process runs in two passes. First, the content is analyzed to identify key phrases and context. Then the `translator` agent performs the initial localization, followed by a review-and-refinement pass by the `evaluator` agent to ensure quality and consistency.

> The `translator` and `evaluator` "agents" are **roles/personas**, not external tools. If no dedicated sub-agents are available, perform them as sequential personas: first adopt the translator role to produce the draft, then adopt the evaluator role to critique and refine that draft against the locale rules. Repeat the refinement loop until the evaluator's criteria pass.

### Source baselines and incremental updates

Maintain a separate entry for each source file in each locale's `.localization-state.json`. Keys are paths relative to the source project root, preserving the source layout. The following illustrates the format; replace fingerprint placeholders with actual values:

```json
{
  "version": 1,
  "files": {
    "README.md": {
      "source_commit": null,
      "source_sha256": "<SHA-256 of normalized source text>",
      "localized_sha256": "<SHA-256 of normalized localized text>"
    }
  }
}
```

Fingerprints are lowercase SHA-256 hex digests of UTF-8 text with CRLF and CR line endings normalized to LF. Do not otherwise trim or normalize the text. Use available local hashing tools; no external service is needed.

`source_commit` is either a full Git commit ID containing the exact source text translated at that path, or JSON `null`. It is not the translation's commit or a timestamp. Use `null` for uncommitted source content, untracked files, or non-Git projects when no matching committed source has been established. A fingerprint identifies content but does not provide a retrievable source snapshot.

1. Read the locale's state file and current localized document. A missing file or entry means the baseline is unknown. Malformed metadata or an unsupported version must be reported and resolved with the user, not silently overwritten. Preserve unrelated entries.
2. Capture the current source text and its fingerprint before translating. If the project has Git history and Git is available, resolve the current `HEAD` to a full commit ID and compare the source at that commit with the captured text using the same normalization. Keep that commit as the candidate next baseline only if they match; otherwise use `null`, including for projects without a first commit. Do not update the state file yet. Use repository-relative source paths when running Git commands from the repository root.
3. Compare the current localized fingerprint with `localized_sha256`. If it differs, the output has changed since the last completed localization; use the full reconciliation path below rather than overwriting edits based only on a source diff. If both the source and localized fingerprints match their recorded values, no content update is needed.
4. When the source changed, the localized fingerprint still matches, the recorded `source_commit` is non-null, and the current source is tracked in Git, retrieve the old source using `git --no-pager show "<source_commit>:<source-path>"`. Confirm that its normalized fingerprint matches the recorded `source_sha256` before using it as a baseline. Compare this old source with the captured current source, including committed, staged, and unstaged changes. `git --no-pager diff <source_commit> -- <source-path>` compares the recorded commit with the working tree. A bare `git diff`, `git log`, or the localized file's last commit does not establish this baseline.
5. If the baseline is missing, `null`, inconsistent, or unavailable in local history, or the current file is untracked, disclose that an incremental source diff is unavailable. Reconcile the existing translation against the **entire current source**, preserving accurate sections and valid human edits rather than blindly retranslating. Ask about conflicting edits or ambiguous intent. Do not assume the translation is current or invent a source revision; no commit, fetch, or history rewrite is required.
6. After the localized document passes evaluation, confirm that the source still matches the captured fingerprint and the output has not changed since review. If either changed, reconcile and evaluate the affected content again before recording completion. Save the reviewed output first, then update only that file's state entry with its captured source fingerprint, matching commit or `null`, and saved localized fingerprint. Never advance a baseline for a failed, partial, or paused localization. Report save failures; if state cannot be saved, disclose that the baseline was not updated.

Apply this procedure independently to every file and locale. An existing translation without metadata gains a baseline only after full reconciliation and evaluation, not merely by assigning the current `HEAD`. Do not stage, commit, or publish the localized documents or metadata unless requested.

### Markdown and formatting preservation

Regardless of locale, the following must be preserved exactly and **not** translated:

- YAML frontmatter **keys** (translate values only where appropriate, e.g. a `title`).
- Fenced and inline code, including variable, function, and command names and string literals. Only explanatory human-language comments may be translated; preserve machine-significant comments and directives.
- URLs and external link targets.
- HTML tags, Markdown structure, tables, and admonition markers.

Translate human-language prose, including comments inside code blocks where they are explanatory (per the locale rules). Keep heading order and document structure stable.

**Heading anchors follow the localized text.** When a heading is translated, its auto-generated anchor/slug changes with it—this is expected. The requirement is that **same-document anchor links keep resolving**: whenever you translate a heading, update every in-page link that targets it (`](#...)`) to the localized heading's new slug. Do not leave a link pointing at the original English slug once the heading is translated, and do not preserve an English anchor that no longer matches its heading. Anchors that point into **non-localized** files (or external URLs) keep their original target.

**Image and asset paths point to the original assets unless a localized asset exists.** Because localized files live under `localizations/<locale>/`, rewrite each source-relative asset path from the localized document's actual directory. For example, `images/x.png` in the root `README.md` becomes `../../images/x.png` in `localizations/ko-kr/README.md`; the same link in `docs/guide.md` becomes `../../../docs/images/x.png` in `localizations/ko-kr/docs/guide.md`. Only point at a localized asset when a corresponding translated image actually exists under the locale tree. Either way, the link must resolve to a real file.

### Translator agent

Use the `translator` agent to perform the localization. It should follow the rules and guidelines defined for each target locale document in the `rules` directory.

### Evaluator agent

Use the `evaluator` agent to assess the quality of the localized content. The evaluator checks for accuracy, cultural relevance, and overall quality, following the rules and guidelines defined for the target locale in the `rules` directory.

The evaluator scores the localized document against the locale's **Evaluator Scoring Rubric** (defined in the locale's `rules/<locale>.md`). The rubric uses two tiers: **Tier A** hard-fail criteria that must score 5, and **Tier B** graded criteria (1–5) that must score 4 or 5. A document passes only when **every applicable Tier A criterion scores 5 and every applicable Tier B criterion scores ≥ 4**. If anything falls short, return the document to the translator with specific notes and re-run the translate → evaluate loop until it passes, escalating to a human after the rubric's iteration cap.

## DOs and DON'Ts

- **Do** perform localization only for the target locales defined in the `rules` directory (one `<locale>.md` per supported locale). Do not localize into unsupported locales.
- **Do** preserve Markdown structure, code, external link/URL targets, and frontmatter keys exactly (see *Markdown and formatting preservation*).
- **Do** let heading anchors follow the localized heading text, and update same-document anchor links to match the new slugs so they keep resolving (see *Markdown and formatting preservation*).
- **Do** point image and asset paths at the original assets (rewriting the relative path as needed so it resolves from `localizations/<locale>/`), unless a corresponding localized asset exists (see *Markdown and formatting preservation*).
- **Do** mirror the source directory layout under `localizations/<locale>/`.
- **Don't** treat files under `localizations/` as source input.
- **Don't** reorder or restructure content; keep headings and their order stable.
- **Don't** translate code, commands, identifiers, or string literals; translate explanatory prose and non-machine-significant code comments only.
