# Draw One

Digital Eastern oracle interface.

Draw One is a single-page prototype for a ritual-style oracle reading experience: choose a symbolic guide, write your question, draw one.

Created by [Crystal Chang](https://www.linkedin.com/in/crystal-c-2b028410/) and Kim during ikigai vibe hack 1.0.

This project won first place at a hackathon demo day selected from 32 finalist teams, with 150 original applicants. The prize was USD $10,000 in OpenAI API credits.

Public demo: [https://crystal32378.github.io/draw-one/](https://crystal32378.github.io/draw-one/)

Open `index.html` in a browser to run it locally. No backend is required for the current public demo.

## What It Does

Draw One turns an oracle-style ritual into a lightweight web interaction:

1. Choose a symbolic guide.
2. Enter a personal question.
3. Draw one answer.
4. Receive a short interpretive response through a ritual-inspired interface.

The project explores how AI-native tools can feel less like command boxes and more like cultural, emotional, and symbolic experiences.

## What This Showcases

Draw One is a Codex-built cultural interface prototype, not an AI fortune-telling authority. It showcases:

- AI-assisted product prototyping by non-engineer founders.
- Translation of a culturally specific ritual into a browser-based interaction.
- Lightweight UX for reflection, uncertainty, and decision support.
- The difference between prototype validation and production-grade content provenance.
- Multi-model agent collaboration across implementation, governance, and audit.

## Built with Codex

OpenAI Codex helped turn the founder's product direction into a working browser prototype and supported information governance work around source type, license status, review status, quarantine rules, and production gates.

The current public demo is static HTML, CSS, and vanilla JavaScript. It does not require runtime OpenAI API calls.

## Cultural-Context Review and Audit

ZCode, using Z.ai GLM-5.2 in this workflow, supported cultural-context review and scientific audit. It challenged assumptions, checked whether workflow limits were real system constraints, and helped separate useful governance from unnecessary architecture.

Chinese-language model review is useful for cultural context, including 籤詩 form, deity lineages, temple lineages, numbering systems, and variant text issues. But fluency is not provenance. Every oracle entry still needs source, license status, review status, and human or domain-expert review before entering a verified pool.

## Data Provenance Note

During Phase 2 cleanup, an agentic review found that some expanded oracle content was not verified source material. Some entries were GPT-generated or GPT-aggregated filler and were mixed into working data.

That incident is documented here:

- [`docs/data-provenance-incident.md`](docs/data-provenance-incident.md)

The latest implementation direction is documented here:

- [`docs/superpowers/specs/2026-07-04-oracle-registry-design.md`](docs/superpowers/specs/2026-07-04-oracle-registry-design.md)
- [`docs/superpowers/plans/2026-07-05-oracle-registry-implementation.md`](docs/superpowers/plans/2026-07-05-oracle-registry-implementation.md)

The current policy is simple: generated or uncertain material must remain quarantined or explicitly marked as pending. Only entries with approved source review and acceptable license status may enter a future verified production oracle pool.

## Showcase Draft

See [`docs/openai-showcase-submission.md`](docs/openai-showcase-submission.md) for a draft OpenAI Showcase submission narrative and checklist.

## Demo Day

See [`docs/demo-day-pitch.md`](docs/demo-day-pitch.md) for the original pitch line and context.

## Public Writeups

See [`docs/linkedin-copy.md`](docs/linkedin-copy.md) for the LinkedIn project copy and featured post text.

## Archive

See [`archive/original-react-mvp.jsx`](archive/original-react-mvp.jsx) for the original React MVP draft from the GPT / Canvas development process.

## Why It Matters

Most AI tools ask users to prompt, configure, and optimize. Draw One takes a different direction: it uses ritual, choice, ambiguity, and atmosphere to make AI interaction feel more human.

The prototype is small, but the design question is larger:

> What happens when an AI interface behaves less like a productivity tool and more like a symbolic companion?

## Project Status

This repository contains the archived React MVP, the current static browser prototype, public-facing documentation, provenance cleanup notes, and oracle registry planning artifacts.

Draw One is still a prototype. The product direction has been validated at demo level; the production content system is still under review.

No production registry implementation has been merged yet.

## Running Locally

No backend is required.

```bash
open index.html
```
