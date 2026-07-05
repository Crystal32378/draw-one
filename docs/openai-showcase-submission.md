# OpenAI Showcase Submission Draft

This document frames Draw One for a possible OpenAI Showcase Gallery submission.

The recommended positioning is not "fortune telling." The recommended positioning is:

> A Codex-built cultural interface prototype for reflection and decision-making under uncertainty.

## Submission Strategy

Draw One should be submitted as a creative experiment / web app / game-like ritual interface.

The strongest story is:

1. Non-engineer founders used Codex to turn a cultural product idea into a working browser prototype.
2. The prototype validated the emotional ritual experience at hackathon/demo level.
3. Agentic cleanup later exposed a content provenance issue before production.
4. The team responded by separating prototype content from production-ready verified content.
5. The next implementation direction is an oracle registry and audit gate, not an AI fortune-telling authority.

This is a better story than claiming the app is a complete AI product. It is honest, specific, and stronger.

## Suggested Form Answers

### What type of project are you submitting?

Creative experiment / Web app / Game-like ritual interface

### Did you use Codex to build this?

Yes.

### Did you use another coding agent to build this?

Yes. ZCode, using Z.ai GLM-5.2 in this workflow, supported cultural-context review, assumption checking, and data provenance audit planning.

### What is the tech stack used in the project?

Static HTML, CSS, vanilla JavaScript, archived React MVP, GitHub, and GitHub Pages.

### List use cases showcased in your project

Decision support, reflection, wellness-adjacent ritual design, cultural interface prototyping, founder-led product prototyping, information governance.

### Which capability are you showcasing?

AI-assisted product prototyping with Codex: translating a culturally specific ritual concept into a working browser-based interaction, then iterating on UX, copy, interface structure, documentation, and governance.

### Which OpenAI models and APIs are you using in your project?

OpenAI Codex was used as the primary coding and documentation agent to build and iterate the prototype and organize project governance. The current public demo is a lightweight static browser experience and does not require runtime OpenAI API calls.

### Are you using other models or APIs in your project?

Yes. ZCode / Z.ai GLM-5.2 was used as a review and audit collaborator, especially for cultural-context review, Chinese-language source-sensitivity review, and checking whether inherited workflow assumptions were real system constraints.

No external runtime APIs are required for the current static demo.

### Please describe the building process

I started with a cultural product idea: a digital version of a Taiwanese ritual for people facing uncertainty. Codex helped turn the concept into a working browser prototype. I used coding agents as a non-engineer founder/PM: giving direction, reviewing UI, testing flows, refining the experience, and organizing documentation.

Later, ZCode helped identify a data provenance issue in the oracle corpus. That led to cleanup, quarantine rules, a provenance incident report, and a stricter future registry/audit direction. The project became both a prototype and a case study in how AI agents can support trust, source governance, and cultural-context review.

### Public GitHub repository

https://github.com/Crystal32378/draw-one

### Hosted URL

https://crystal32378.github.io/draw-one/

### Setup steps

Open the hosted URL in a browser and start a draw. To run locally, clone the repository and open `index.html` directly in a browser. No backend or API key is required for the current public demo.

### Project title

Draw One

### Project tagline

A digital ritual that helps people pause, reflect, and return to their own judgment.

### Project description

Draw One is a browser-based ritual interface inspired by Taiwanese fortune-drawing culture. Users choose a symbolic guide, write a question, and draw one response through a quiet, atmospheric interface.

The project is not designed to predict the future or replace human judgment. It is a reflective decision-support prototype: a small pause before action, built around ritual, ambiguity, and emotional clarity.

Draw One was created by non-technical professionals during an AI hackathon and built with the help of OpenAI Codex. The project also includes public documentation about a prototype-stage data provenance incident, explaining how generated or uncertain oracle material was quarantined and how future production content will require source, license, review status, and human/domain review.

## Multi-Model Collaboration

Draw One became a useful case study in multi-model agent collaboration.

Codex supported implementation and information governance. It helped translate the founder's product direction into a working browser prototype, and helped organize documentation around source type, license status, review status, quarantine rules, and production gates.

ZCode / Z.ai GLM-5.2 supported cultural-context review and scientific audit. It challenged assumptions, checked whether workflow limits were real system constraints, and helped separate useful governance from unnecessary architecture.

The practical lesson:

> Information governance decides what may enter the system. Audit checks whether the system is being built on true assumptions.

## Cultural Review Guardrail

Draw One handles Chinese-language oracle poetry, temple culture, and folk ritual. Chinese-language model review can be useful for recognizing 籤詩 form, deity lineages, temple lineages, numbering systems, auspiciousness language, transcription issues, variant texts, and mixed-source problems.

But cultural fluency is not source credibility. The model most fluent in a register can also generate the most plausible hallucinations in that register. In Draw One, cultural-context review is an auxiliary lens only, never a source authority.

The data standard does not bend: every oracle entry still needs source, license status, review status, and human/domain review before it can enter a verified pool.

## Author Name

Crystal Chang / Draw One - FaithTech Team

## Cover Image

TODO: Add a public cover image URL.

Recommended cover: a clean screenshot of the app homepage or result view. Avoid third-party temple photos, deity images, or copyrighted visual material unless rights are clear.

## Build Notes

### Initial Product Prompt

Build a lightweight digital oracle interface inspired by Taiwanese ritual behavior. The user should choose a symbolic guide, write a question, and draw one response. The tone should feel reflective, calm, and culturally grounded, not like a generic chatbot.

### Iterations

- Built the first working browser prototype with Codex.
- Refined the interface around a simple ritual flow: choose, ask, draw.
- Adjusted copy to frame the experience as reflection rather than prediction.
- Added a recent readings area for lightweight session memory.
- Archived the earlier React MVP and kept the current public demo simple.
- Reviewed expanded oracle data and documented the provenance incident.
- Preserved oracle registry / draw-pool planning for later implementation.

### Final Step Before Submission

Before submitting to the Showcase Gallery:

- Confirm the hosted URL points to the current public demo.
- Add a clean public cover image.
- Review README and provenance docs for consistency.
- Avoid implying OpenAI endorsement or partnership.
- Keep the submission truthful about runtime API usage.
- Be explicit that the project is a prototype, not a verified oracle archive or fortune-telling authority.

## Positioning Guardrails

Use:

- Cultural interface prototype
- Reflective decision-support ritual
- Built with Codex
- Multi-model agent collaboration
- Agentic audit and provenance cleanup
- Prototype, not production content archive

Avoid:

- AI fortune telling
- Predictive decision engine
- Religious authority claims
- OpenAI-endorsed product
- Claims that runtime OpenAI API calls are required when they are not
- Claims that the oracle dataset is production-verified today
