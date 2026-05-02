---
title: AI Model Ranking Framework
sidebar_position: 2
slug: ai-model-ranking-framework
---

# AI Model Ranking Framework

Digital Church ranks AI models by job fit, not by a single leaderboard position. [Artificial Analysis](https://artificialanalysis.ai/) is our reference source for external model signals, especially intelligence, agentic work, coding ability, factual reliability, speed, pricing, and openness.

The ranking should answer one question: which model gives the best result for the work we are actually assigning? A slower, more expensive frontier model can be the right choice for writing, strategic judgment, and complex agent work, while a cheaper or local model can be the right choice for drafts, routing, data cleanup, and low-risk support tasks.

## What Artificial Analysis gives us

Artificial Analysis provides independent model comparisons across language, image, video, speech, hardware, and API provider performance. For language models, use these signals first:

| Signal | Meaning | Direction |
| --- | --- | --- |
| Intelligence | Artificial Analysis Intelligence Index | Higher is better |
| Speed | Output tokens per second | Higher is better |
| Price | Dollars per 1 million tokens | Lower is better |
| Cost to run Intelligence Index | Practical benchmark workload cost | Lower is better |
| Openness | Availability and transparency of model weights, details, and access | Higher is more open |
| Provider performance | Speed and price differences for the same open model across hosts | Depends on use case |

Artificial Analysis should inform our ranking. It should not replace internal judgment.

## What the Intelligence Index measures

Artificial Analysis Intelligence Index v4.0.4 is a text-only, English-language benchmark suite. It uses 10 evaluations grouped into four equally weighted categories:

| Category | Weight | Evaluations | What it tells us |
| --- | ---: | --- | --- |
| Agents | 25% | GDPval-AA, 𝜏²-Bench Telecom | Whether a model can finish real work with tools, files, workflows, and simulated user interactions. |
| Coding | 25% | Terminal-Bench Hard, SciCode | Whether a model can solve terminal tasks and scientific coding problems. |
| General | 25% | AA-LCR, AA-Omniscience, IFBench | Whether a model can reason over long context, avoid hallucination, and follow precise instructions. |
| Scientific Reasoning | 25% | Humanity's Last Exam, GPQA Diamond, CritPt | Whether a model can handle hard academic and research-grade reasoning. |

This mix matters because Digital Church agents do mixed work. A knowledge agent needs factual reliability and instruction following. An engineering agent needs Terminal-Bench-style persistence, coding strength, and tool discipline. An operations agent needs agentic workflow ability, speed, and low operating cost.

## Internal scorecard

Use this 100-point scorecard when deciding the default model for a role or workflow:

| Criterion | Weight | How to judge it |
| --- | ---: | --- |
| Capability fit | 40 | Match Artificial Analysis benchmark strengths to the actual job: writing, coding, agent work, research, summarization, tool use, or creative direction. |
| Operating cost | 20 | Compare input/output price, expected token volume, retry rates, and whether the work is high enough value to justify a frontier model. |
| Speed and latency | 15 | Use output tokens per second, first-token latency when available, and real workflow wait time. |
| Reliability | 15 | Prefer models that follow instructions, avoid fabrication, recover from tool errors, and stay stable across repeated runs. |
| Control and availability | 10 | Consider openness, self-hosting, privacy, API reliability, context window, rate limits, and provider lock-in. |

Do not overfit the scorecard. It exists to make tradeoffs visible, not to pretend model choice is exact science.

## Role-based ranking rules

### Knowledge and writing work

Rank models by writing quality, factual reliability, instruction following, and long-context reasoning. Artificial Analysis signals to watch: Intelligence Index, AA-Omniscience, AA-LCR, IFBench, HLE, GPQA Diamond, cost per 1 million output tokens, and practical context window limits.

Default rule: use the best writing model available for publishable drafts, research synthesis, editorial review, and anything Mark will read as final work. Use cheaper or local models for outlines, extraction, cleanup, and disposable first passes.

### Engineering work

Rank models by coding task success, terminal persistence, debugging discipline, and ability to obey repo instructions. Artificial Analysis signals to watch: Terminal-Bench Hard, SciCode, GDPval-AA, IFBench, AA-LCR, speed, context limits, and tool-use behavior.

Default rule: use stronger models for architecture, bug diagnosis, test design, and risky code changes. Use cheaper models for mechanical edits only when tests can catch mistakes.

### Operations and agent orchestration

Rank models by real-work completion, tool discipline, latency, and cost per completed task. Artificial Analysis signals to watch: GDPval-AA, 𝜏²-Bench Telecom, IFBench, AA-Omniscience, speed, and cost to run benchmark workloads.

Default rule: choose the model that finishes cleanly with the fewest retries. A cheap model that needs repeated correction is usually more expensive than it looks.

### Local and open-weight models

Rank local models by adequate quality, privacy, uptime independence, and low marginal cost. Artificial Analysis signals to watch: open-weight status, Openness Index, Intelligence Index, speed, and provider performance if the model can be hosted by multiple providers.

Default rule: local models are support tools unless they pass the same internal acceptance bar as hosted models. Privacy and availability matter, but weak reasoning still needs human or stronger-model review.

## Ranking tiers

Use tiers instead of pretending tiny score differences are meaningful.

| Tier | Meaning | Typical use |
| --- | --- | --- |
| Primary | Best overall choice for high-value work. | Strategy, publishable writing, deep research, complex coding, agent orchestration. |
| Secondary | Close enough for lower-risk work, usually cheaper or faster. | Drafts, internal notes, routine coding assistance, summarization. |
| Specialist | Best for one job but not the default. | Code repair, long-context search, image reasoning, fast extraction, local privacy. |
| Local fallback | Good enough when privacy, cost, or offline access matters more than peak quality. | Data cleanup, first-pass drafts, checklists, internal transformations. |
| Retired | No longer worth assigning by default. | Keep only if a legacy workflow depends on it. |

## Monthly review process

Review model rankings monthly and whenever Artificial Analysis publishes a major new evaluation for a model we use.

1. Open Artificial Analysis and check the model's Intelligence Index, speed, price, openness, and relevant benchmark breakdowns.
2. Compare external results against our last internal experience with the model.
3. Run a small internal task set when changing a default model: one writing task, one instruction-following task, one tool-use task, and one domain-specific task for the role.
4. Assign the model to a tier for each department: Knowledge, Engineering, Creative, Marketing, and Operations.
5. Record the decision in the relevant memory or model-preferences document, including date, source, reason, and replacement model if one changed.

## When to override the ranking

Override the default model when the work has a specific constraint:

- Use the strongest model for work that affects customers, revenue, legal exposure, security, or Mark's final review.
- Use a faster model when latency blocks the workflow and quality risk is low.
- Use a cheaper model when the task is repetitive, verifiable, and easy to rerun.
- Use a local or open model when privacy, offline access, or vendor independence matters.
- Use a specialist model when the benchmark breakdown shows a clear advantage for the exact task.

## Common mistakes

Do not choose a model only because it tops the Intelligence Index. The index is strong, but it is text-only and English-only, and it does not directly measure every Digital Church workflow.

Do not choose a model only because it is cheap. If it needs more prompting, more retries, or more review, the real cost is higher.

Do not assume one provider's performance applies to every provider. Artificial Analysis shows that the same open model can have very different speed and price depending on where it runs.

Do not treat old internal preferences as permanent. Model rankings decay quickly.

## Decision template

Use this format when updating model preferences:

```md
## [YYYY-MM-DD] Model ranking update

- Role/workflow:
- Model evaluated:
- Previous tier:
- New tier:
- Artificial Analysis signals checked:
  - Intelligence Index:
  - Relevant benchmark breakdowns:
  - Speed:
  - Price:
  - Openness/provider notes:
- Internal task result:
- Decision:
- Review again by:
```

## Sources

- [Artificial Analysis](https://artificialanalysis.ai/)
- [Artificial Analysis Intelligence Benchmarking Methodology](https://artificialanalysis.ai/methodology/intelligence-benchmarking)
