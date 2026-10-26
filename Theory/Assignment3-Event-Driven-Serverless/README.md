# Assignment 3: Event-Driven Serverless (Topic 9)

**Lectures:** Unit 5, **L55-57 "Building Serverless Backend Systems with AWS Lambda"** (Lambda
trigger types, the SMS SQS topology, idempotent consumers, anti-patterns) and **L59 "Assignment III:
Presentation Architecture and Evidence"**, plus the Assignment 3 brief: a 5-7 minute talk on one
topic, with diagrams, real use cases, 2-4 Q&A and annotated references. Topic No. 9
is *Event-Driven Serverless: trigger sources, SQS/EventBridge, integration patterns*. Student:
Suryansh Mishra (590012069), `smirk-dev`.

```
Assignment3-Event-Driven-Serverless/
├── Event-Driven Serverless.pptx   # 12 slides, speaker notes on every slide
├── Event-Driven Serverless.pdf    # PDF export of the same deck
├── Presenter Notes.md             # the speaker notes as one document
└── slides/slide-01..12.png        # each slide rendered at 1600x900, used for the layout check
```

Submitted copies are on the Desktop as `suryansh_mishra_590012069_assignment3.pptx`, `.pdf` and `.md`.

## Slides

| # | Slide | What it shows |
|---|---|---|
| 1 | Event-Driven Serverless | title, and the three-box idea: something happens, a queue or bus holds it, a function runs |
| 2 | One slow service should not stall the rest | before/after diagram: a request chain vs a queue in front of two functions (the L55 results-day case) |
| 3 | Three ways an event reaches a function | synchronous, asynchronous and poll-based triggers, and who retries in each |
| 4 | SQS: a buffer in front of the function | flowchart of batch polling, visibility timeout, retry and dead-letter queue, with the four settings that matter |
| 5 | EventBridge: route by what the event says | sources, bus, rules and targets, plus a real event pattern (grade F to a mentor queue) |
| 6 | SQS, SNS or EventBridge? | comparison table: delivery, consumers, filtering, ordering, replay, use |
| 7 | Four integration patterns | fan-out, queue-based load leveling, content-based routing, choreography vs orchestration, each with a small diagram |
| 8 | At-least-once delivery means duplicates | idempotency flowchart (eventId check, retries, DLQ, redrive), the conditional write, and the recursive S3 loop |
| 9 | Where this shows up in real systems | the AWS thumbnail tutorial, LEGO.com on EventBridge, the L55 results-day pipeline |
| 10 | What it costs, and when not to use it | tracing and consistency costs; four cases where a sync API or a server fits better |
| 11 | Questions and answers | four questions with short answers |
| 12 | References, and what each one adds | eight sources, each with a one-line note on its depth or what it added |

The node colours stay the same on every diagram: white for producers, ochre for queues and buses,
rust for functions, green for rules and targets, grey for stores, red for failures. Headings are
Cambria and body text Calibri, both of which ship with Office, so the deck looks the same on the
lab machines.

## Presenting

Open the `.pptx` in PowerPoint and use Presenter View; the notes pane holds what to say for each
slide. The notes come to 1,009 words, about 7 minutes at 145 words a minute. If time is short,
slide 6 (the table) and slide 11 (the Q&A) can be covered in a sentence each.

## Checks run

- **File check.** The `.pptx` was opened by PowerPoint 16 through COM, saved as PDF and exported
  slide by slide to PNG with no repair prompt. An OOXML schema and relationship check of the file
  reported `All validations PASSED!`.
- **Every slide looked at.** All 12 PNGs in `slides/` were viewed. The first render had real
  problems, which were fixed and re-rendered:
  - slide 7: the fan-out, routing and orchestration diagrams sat on top of their description
    text. Descriptions were moved under the card titles and the diagrams below them.
  - slide 4: the "batch of 10" label was cut off by the Lambda box. Moved above the arrow.
  - slide 8: the retry arrow ended in mid-air. It now runs back to "Message arrives".
  - slides 2, 3 and 5: large empty areas at the bottom of the cards. Cards shortened, and a
    one-line takeaway added on slides 2 and 3.
  - the title slide's queue box was almost invisible on the dark background. It now uses a solid fill.
- **Notes in both places.** A python-pptx read of the deck found 12 slides and 12 non-empty notes,
  and the first line of every note appears in `Presenter Notes.md`. The PDF has 12 pages.
- **Length.** The first draft of the notes was 1,899 words, about 13 minutes. It was cut twice, to
  1,009 words.
- **Desktop copies.** `cmp` shows the three Desktop files are byte-identical to the files in this folder.
- **Facts.** The numbers on the slides come from the AWS documentation listed on slide 12: batch
  size 10, 14-day retention, visibility timeout of at least 6x the function timeout, two async
  retries, and EventBridge's 24-hour / 185-attempt retry default. The LEGO example is from Brisals
  and Hedger (2024). No traffic figures or costs are invented.
