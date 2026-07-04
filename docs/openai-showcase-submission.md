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

This is a better story than claiming the app is a complete AI product. It is honest, specific, and stronger.

## Suggested Form Answers

### What type of project are you submitting?

Creative experiment / Web app / Game-like ritual interface

### Did you use Codex to build this?

Yes

### Did you use another coding agent to build this?

Yes

### What is the tech stack used in the project?

Static HTML, CSS, vanilla JavaScript, archived React MVP, GitHub, Vercel hosting

### List use cases showcased in your project

Decision support, reflection, wellness, cultural ritual, founder prototyping

### Which capability are you showcasing?

AI-assisted product prototyping with Codex: translating a culturally specific ritual concept into a working browser-based interaction, then iterating on UX, copy, interface structure, and deployment.

### Which OpenAI models and APIs are you using in your project?

OpenAI Codex was used as the primary coding agent to build and iterate the prototype. The current public demo is a lightweight static browser experience and does not require runtime OpenAI API calls.

### Are you using other models or APIs in your project?

ZCode and other AI assistants were used for review, critique, and cleanup, including a data provenance audit. No external runtime APIs are required for the current static demo.

### Please describe the building process

I started with a cultural product idea: a digital version of a Taiwanese ritual for people facing uncertainty. Codex helped turn the concept into a working browser prototype. I used coding agents as a non-engineer founder/PM: giving direction, reviewing UI, testing flows, and refining the experience. Later, ZCode helped identify a data provenance issue in the oracle corpus, leading to a cleanup and stricter source-review policy.

### Public GitHub repository

https://github.com/Crystal32378/draw-one

### Hosted URL

TODO: Add the final public Vercel URL before submission.

### Setup steps

Open the hosted URL in a browser and start a draw. To run locally, clone the repository and open `index.html` directly in a browser. No backend or API key is required for the current public demo.

### Project title

Draw One

### Project tagline

A digital ritual that helps people pause, reflect, and return to their own judgment.

### Project description

Draw One is a browser-based ritual interface inspired by Taiwanese fortune-drawing culture. Users choose a symbolic guide, write a question, and draw one response through a quiet, atmospheric interface.

The project is not designed to predict the future or replace human judgment. It is a reflective decision-support prototype: a small pause before action, built around ritual, ambiguity, and emotional clarity.

Draw One was created by non-technical professionals during an AI hackathon and built with the help of OpenAI Codex. The project also includes a public data provenance incident note, documenting how the prototype-stage oracle corpus was reviewed, quarantined, and placed under stricter source controls before future production use.

### Author name

Crystal Chang / Draw One - FaithTech Team

### Cover image

TODO: Add a public cover image URL.

Recommended cover: a clean screenshot of the app homepage or result view. Avoid using third-party temple photos, deity images, or copyrighted visual material.

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

### Final Step Before Submission

Before submitting to the Showcase Gallery:

- Confirm the hosted URL points to the current public demo.
- Add a clean public cover image.
- Review README and incident docs for consistency.
- Avoid implying OpenAI endorsement or partnership.
- Keep the submission truthful about runtime API usage.

## Positioning Guardrails

Use:

- Cultural interface prototype
- Reflective decision-support ritual
- Built with Codex
- Agentic audit and provenance cleanup
- Prototype, not production content archive

Avoid:

- AI fortune telling
- Predictive decision engine
- Religious authority claims
- OpenAI-endorsed product
- Claims that runtime OpenAI API calls are required when they are not
