# Presenter Notes: Event-Driven Serverless

**Suryansh Mishra · SAP ID 590012069 · Backend Development (CSFS3008P) · Assignment III, Topic 9**

Twelve slides, about 7.0 minutes at a steady speaking pace of about 145 words a minute (1009 words), which leaves time for questions. The same notes are in the speaker-notes pane of the .pptx.

## Slide 1: Event-Driven Serverless

Good morning. My topic is number nine, event-driven serverless. The question is simple: when something happens, say a result is published or a file is uploaded, how does that reach the code that has to react, without one slow part dragging the rest down? I will cover trigger sources, SQS and EventBridge, the patterns built on them, and where this design stops making sense.

## Slide 2: One slow service should not stall the rest

This is the results-day scenario from our Lecture 55 notes. On the left, the API calls the email service and then writes an audit record while the student waits. If email slows down, the whole request slows down, and every retry adds load to a provider that is already struggling.

On the right, the API only stores a result.published event and replies. Email and audit read it at their own pace. Slow email now means late email, not a failed API.

## Slide 3: Three ways an event reaches a function

Lambda does not receive every trigger the same way, and the difference decides who retries.

Synchronous, like API Gateway: the caller waits and handles the error itself.

Asynchronous, like S3, SNS and EventBridge: Lambda queues the event, replies 202, and retries twice by default before using a failure destination or dead-letter queue.

Poll-based, like SQS and Kinesis: Lambda polls batches, and a failed batch is read again.

So the first design question is always who retries, and where failed events end up.

## Slide 4: SQS: a buffer in front of the function

SQS is the piece I would add first. Lambda polls it in batches of ten by default, and the queue keeps messages for up to fourteen days, so a broken consumer loses nothing.

A message handed to the function becomes invisible for the visibility timeout. On success it is deleted. On failure it reappears, and after the max receive count it moves to the dead-letter queue, where an alarm tells someone to look.

Three settings matter: a visibility timeout of at least six times the function timeout, which is AWS's own advice; partial batch responses, so one bad message does not retry the other nine; and maximum concurrency, so a burst does not flood the database.

## Slide 5: EventBridge: route by what the event says

EventBridge solves routing. Many sources publish to one bus, and the producer does not know who is listening.

Each rule has an event pattern, a JSON filter on the event's fields. The one on the right matches results with grade F and sends them to a mentor queue. A new consumer is a new rule, with no change to the producer.

It can also archive and replay events after a bug fix, and it retries a failed target for up to twenty-four hours, 185 attempts.

## Slide 6: SQS, SNS or EventBridge?

Which one to use? SQS is a queue you pull from, one consumer per message, so it is for buffering. SNS pushes every message to every subscriber, the simple way to fan out. EventBridge routes on any field and keeps an archive for replay.

In practice they are combined: EventBridge or SNS fans out, and each consumer gets its own SQS queue with its own buffer and dead-letter queue.

## Slide 7: Four integration patterns

Four patterns cover most of what I found in the AWS examples and the Enterprise Integration Patterns book.

Fan-out gives each consumer its own queue. Load leveling lets the queue absorb a burst while a capped number of functions drain it. Content-based routing lets the bus pick the destination.

The last is a real choice. In choreography each service reacts to the previous event and nobody owns the flow, so services stay independent but a stuck job is hard to find. In orchestration a Step Functions state machine runs the steps in order and handles failure, which suits payment, then stock, then shipping.

## Slide 8: At-least-once delivery means duplicates

This is the part that catches people out. Queues, async retries and EventBridge all deliver at least once, so the same event can arrive twice.

The function first checks the event ID. If it was already processed, skip it; otherwise do the work and record the ID. In DynamoDB that is one conditional write with attribute_not_exists, as in the L55 attendance example. If processing throws, the message is retried, then lands in the dead-letter queue, an alarm fires, and after the fix we redrive it.

The second trap: a function triggered by a bucket that writes back into the same bucket calls itself forever. Write somewhere else.

## Slide 9: Where this shows up in real systems

Three real examples. The thumbnail pipeline is an official AWS tutorial: an upload triggers a resize function that writes to a second bucket, avoiding that loop.

LEGO.com moved its shop from a monolith to Lambda functions talking through EventBridge; Sheen Brisals, who led that work, describes it in his book with Luke Hedger.

And our Lecture 55 project: the results-day burst waits in SQS, an idempotency table stops duplicate emails, and the WebSocket notifier stays a long-running service because it holds connections open.

## Slide 10: What it costs, and when not to use it

Events have a cost. Following one request across five functions needs a correlation ID in every event and tracing like X-Ray. The data is eventually consistent, so the interface should say processing. And the many small resources belong in SAM or CDK, not the console.

I would not use this when the user needs the answer immediately, when work runs past Lambda's fifteen-minute limit, when it holds connections or state, or when load is steady and high, where an always-on service can be cheaper.

## Slide 11: Questions and answers

Four questions to check the ideas. Why SQS between EventBridge and Lambda? Control: concurrency caps, batching, retention and our own dead-letter queue. A duplicate email is not an AWS bug; at-least-once is by design, and the conditional write fixes it. Step Functions wins when order and undo matter. And an S3 loop is stopped by writing elsewhere or filtering by prefix.

## Slide 12: References, and what each one adds

My references, and what each added. The AWS guides gave the exact numbers: the six-times rule, the two async retries and the EventBridge retry policy. Fowler's article was the most useful read, because it shows event-driven really means four different patterns. Hohpe and Woolf gave the names, Brisals and Hedger the LEGO story from the inside, Serverless Land working templates, and Lecture 55 our course baseline. Thank you, I am happy to take questions.

