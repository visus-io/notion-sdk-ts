---
title: Agents, Sessions, and Skills
description: Chat with Custom Agents and Notion AI, stream replies, manage agents, and sync Agent Skills.
sidebar:
  order: 9
---

The Notion Agent APIs let you chat with agents and manage them. The SDK has three APIs for them:

- `notion.sessions` sends messages, streams replies, and reads the event history of a chat.
- `notion.agents` finds, reads, and changes agents.
- `notion.skills` downloads and uploads Agent Skills.

## Table of Contents

- [Tokens and Access](#tokens-and-access)
- [Start a Session and Wait for the Reply](#start-a-session-and-wait-for-the-reply)
- [Stream a Reply](#stream-a-reply)
- [Answer Required Actions](#answer-required-actions)
- [Query Sessions and Cancel a Turn](#query-sessions-and-cancel-a-turn)
- [Manage Agents](#manage-agents)
- [Agent Skills](#agent-skills)
- [Limits](#limits)

---

## Tokens and Access

Two types of token can use the Agent APIs:

- A **personal access token** acts as you. It uses your access to Custom Agents. It can also use
  the personal agent (Notion AI). The agent ID of the personal agent is `notion_ai`. The SDK
  exports this value as `NOTION_AI_AGENT_ID`.
- A **connection token** can use only the agents that a person shared with its connection. It
  gets a `404 object_not_found` error for `notion_ai`.

A connection needs these capabilities:

| Operation                                   | Capability                                 |
| ------------------------------------------- | ------------------------------------------ |
| Read agents, and start or read sessions     | View sessions and interact with agents     |
| Update an agent, or change its status       | Edit selected agents                       |
| Delete an agent, or change its credit limit | Not possible. Use a personal access token. |

A connection token can read only the sessions that its connection created.

---

## Start a Session and Wait for the Reply

The agent works asynchronously. A new session starts as `queued`. Call `sessions.poll()` to wait
until the status is not `queued` or `in_progress`. Then read the `agent.message` events.

```typescript
import { Notion } from '@visus-io/notion-sdk-ts';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });

// Start a session. Send `agent_id` and `message`.
const started = await notion.sessions.send({
  agent_id: 'notion_ai',
  message: "Summarize this week's work.",
});

// Wait for the turn to end. The default timeout is 5 minutes.
const session = await notion.sessions.poll(started.id, { timeoutMs: 120_000 });

if (session.status === 'completed') {
  const events = await notion.sessions.events.query(session.id, {
    filter: { property: 'type', event_type: { equals: 'agent.message' } },
  });

  for (const event of events.results) {
    if (event.type === 'agent.message') {
      for (const item of event.content) {
        if (item.type === 'text') {
          console.log(item.text);
        }
      }
    }
  }
}

// Continue the same session. Send `session_id` instead of `agent_id`.
await notion.sessions.send({ session_id: session.id, message: 'Now list the open tasks.' });
```

The SDK does not retry `sessions.send()` after a `500`, `502`, `503`, or `504` response. Such a
response does not mean that Notion rejected the message, and a retry can send it twice. Retrieve
the session before you send again. The SDK still retries a `429` and a `529`, because Notion did
not process the request.

`sessions.poll()` also returns when the status is `requires_action`. Check
`session.requiresAction()` before you read the reply. See
[Answer Required Actions](#answer-required-actions).

### Session Statuses

| Status            | Meaning                                                 |
| ----------------- | ------------------------------------------------------- |
| `queued`          | The agent did not start the turn yet.                   |
| `in_progress`     | The agent works on the turn.                            |
| `requires_action` | The agent waits for you to approve or reject an action. |
| `completed`       | The turn is over.                                       |
| `failed`          | The turn failed. Read `session.error`.                  |
| `canceled`        | Someone canceled the turn.                              |
| `terminated`      | Notion stopped the turn.                                |

Each status describes the current turn. `completed`, `failed`, `canceled`, and `terminated` end
the turn, and `session.isTurnOver()` returns `true` for them. The session stays open. To
continue, send a message with `session_id`. Notion does not document whether a `failed`,
`canceled`, or `terminated` session accepts a new message. If it does not, the send throws
`NotionAPIError`.

Notion can add new statuses. The SDK accepts any status string, so a new status does not fail
the parse. A status that the SDK does not know is not running, does not require action, and
does not end the turn. `sessions.poll()` returns as soon as it sees one.

### Event Types

`sessions.events.query()` returns these event types. The default order is `sequence` ascending.

| Type                | Fields                                                          |
| ------------------- | --------------------------------------------------------------- |
| `user.message`      | `content` (text and file items), `created_by`, `metadata`       |
| `agent.message`     | `content` (text and file items), `created_by`, `metadata.model` |
| `agent.thinking`    | `content` (text items)                                          |
| `agent.tool_use`    | `tool_name`                                                     |
| `agent.tool_result` | `tool_use_id`, `tool_name`, `is_error`                          |
| `session.status`    | `status`, `required_actions`, `error`                           |

Notion can add new event types. The SDK parses an event type that it does not know with the
shared fields only. It sets `type` to `'unknown'` and puts the value from Notion in
`unknown_type`.

---

## Stream a Reply

Call `sessions.stream()` to get the reply as it arrives. It takes the same options as
`sessions.send()`. It returns an async generator of envelopes. Switch on the `type` of each
envelope.

```typescript
for await (const envelope of notion.sessions.stream({
  agent_id: 'notion_ai',
  message: "Summarize this week's work.",
})) {
  switch (envelope.type) {
    case 'session.snapshot':
      console.log('Session', envelope.session.id);
      break;
    case 'event.provisional':
      // A temporary event. A later envelope replaces it. Do not store it.
      break;
    case 'event.committed':
      if (envelope.event.type === 'agent.message') {
        console.log(envelope.event.content);
      }
      break;
    case 'stream.end':
      console.log('Turn ended with status', envelope.status);
      break;
    case 'stream.error':
      console.error(envelope.error.message, 'retryable:', envelope.error.retryable);
      break;
  }
}
```

| Envelope            | Payload                 | Meaning                                                    |
| ------------------- | ----------------------- | ---------------------------------------------------------- |
| `session.snapshot`  | `session`               | The state of the session when the stream starts.           |
| `event.provisional` | `event`                 | A temporary event. Do not store it.                        |
| `event.committed`   | `event`                 | A durable event. It has the same shape as a queried event. |
| `stream.timeout`    | `session_id`, `message` | The stream ended early. The turn continues.                |
| `stream.end`        | `session_id`, `status`  | The turn is over.                                          |
| `stream.error`      | `session_id`, `error`   | The turn failed.                                           |

The generator ends after `stream.end` or `stream.error`. A `stream.error` envelope does not
throw. Read `error.retryable` to decide what to do.

### Automatic Resume

Notion can end a stream early with a `stream.timeout` envelope while the turn continues. By
default, the SDK reconnects. It sends `session_id` and `continue_from` with the ID of the last
`event.committed` event. The stream then continues after that event. The SDK does not yield the
`stream.timeout` envelope when it resumes. It also resumes after a dropped connection. A stream
that ends with no `stream.end`, `stream.error`, or `stream.timeout` envelope counts as a dropped
connection. The SDK discards a frame that the connection cuts before its end. These also count
as a dropped connection:

- A network error, a request timeout, or a retryable `5xx` error on a reconnect. The SDK waits
  at least the `Retry-After` delay of the error. A `429` error is thrown, because the client
  already applied `retryOnRateLimit` and `maxRetries`.
- No data for `idleTimeoutMs` (default: 5 minutes). This detects a connection that dropped
  with no signal. Set `0` to wait with no limit.

After a `stream.timeout` envelope, the SDK reconnects at once. After a dropped connection, it
waits first: 1 second, then 2 seconds, then 4 seconds, to a maximum of 60 seconds. The
`maxResumes` option limits the reconnects in a row with no new committed event. Each new
committed event resets this count and the wait.

A success response that is not `text/event-stream` throws `NotionValidationError`. The SDK
does not resume after it, because a reconnect gets the same response.

The SDK cannot resume before the first committed event arrives. In that case it yields the
`stream.timeout` envelope, or throws the `NotionNetworkError`, and stops. Then call
`sessions.poll()`, or stream again later.

```typescript
const controller = new AbortController();

const stream = notion.sessions.stream(
  { session_id: 'session-id', message: 'Continue.' },
  {
    signal: controller.signal, // Stop the stream at any time.
    maxResumes: 3, // The default is 5.
    idleTimeoutMs: 120_000, // The default is 300_000 (5 minutes).
    autoResume: true, // Set `false` to get each `stream.timeout` envelope.
  },
);
```

To replay a turn yourself, send `session_id` and `continue_from`. Use the `id` of an
`event.committed` event. Do not use a provisional event ID or a `sequence` number. Only
`sessions.stream()` accepts `continue_from`.

```typescript
for await (const envelope of notion.sessions.stream({
  session_id: 'session-id',
  continue_from: 'last-committed-event-id',
})) {
  // ...
}
```

The request timeout (`timeoutMs`) applies until the response headers arrive. It does not apply
to the stream body.

---

## Answer Required Actions

An agent can ask for approval before it does an action. The session status is then
`requires_action`. Send `session_id` and `actions` to answer.

```typescript
const session = await notion.sessions.poll('session-id');

if (session.requiresAction()) {
  await notion.sessions.send({
    session_id: session.id,
    actions: session.requiredActions.map((action) => ({
      action_id: action.action_id,
      option_id: 'approve', // or 'reject'
    })),
  });
}
```

---

## Query Sessions and Cancel a Turn

```typescript
// Find the running sessions of one agent.
const sessions = await notion.sessions.query({
  filter: {
    and: [
      { property: 'agent_id', string: { equals: 'agent-id' } },
      { property: 'status', status: { in: ['queued', 'in_progress'] } },
    ],
  },
  sorts: [{ property: 'created_at', direction: 'descending' }],
});

// Cancel the current turn.
await notion.sessions.cancel(sessions.results[0].id);

// Cancel one turn exactly. Use the ID of an event of that turn.
await notion.sessions.cancel(sessions.results[0].id, { event_id: 'event-id' });
```

Without `event_id`, Notion cancels the turn that runs when the request arrives. The SDK does
not retry a `5xx` response other than `529` in that case, because a retry can cancel a later
turn. Pass `event_id` when you know the turn. The SDK then retries as usual.

A page of results can be empty while `has_more` is `true`. Notion removes the sessions that the
token cannot read. Continue to the next page in that case. The [pagination](/guides/pagination/)
helpers do this for you.

---

## Manage Agents

```typescript
import { agentBatchResultSchema } from '@visus-io/notion-sdk-ts';

// Find agents.
const agents = await notion.agents.query({
  query: 'triage',
  filter: { property: 'status', status: { in: ['active'] } },
});

// Read one agent with its inline instructions.
const agent = await notion.agents.retrieve('agent-id', { verbose: true });
console.log(agent.name, agent.status, agent.instructions);

// Change the name, the model, or the status. Notion applies all fields, or none of them.
await notion.agents.update('agent-id', { status: 'disabled' });
await notion.agents.update('notion_ai', { model: { mode: 'auto' } });

// Read the credits used and the runs completed. Omit the window to use the billing period.
const insights = await notion.agents.insights('agent-id', {
  start_time: new Date('2026-11-01'),
  end_time: new Date('2026-11-15'),
});

// These two need a personal access token.
await notion.agents.updateCreditLimit('agent-id', 500); // `null` clears the limit.
await notion.agents.delete('agent-id'); // A soft delete.

// Apply up to 100 operations asynchronously. The batch is not atomic.
const task = await notion.agents.batch([
  { action: 'update_status', agent_id: 'agent-1', fields: { status: 'disabled' } },
  { action: 'update_credit_limit', agent_id: 'agent-2', fields: { credit_limit: 200 } },
  { action: 'delete', agent_id: 'agent-3' },
]);
const done = await notion.asyncTasks.poll(task.id);

if (done.isSucceeded()) {
  const result = agentBatchResultSchema.parse(done.result);
  for (const entry of result.results) {
    // Match each result to its operation by `index`.
    console.log(entry.index, entry.action, entry.outcome);
  }
}
```

The personal agent has no status, credit limit, or delete operation. The SDK throws a
`NotionValidationError` for `agents.delete('notion_ai')` and
`agents.updateCreditLimit('notion_ai', ...)` before it sends the request.

---

## Agent Skills

A skill is a page in a Skills database. The page content is the `SKILL.md` file. The **Files**
property of the page holds the supporting files. A plugin groups the skills that share a tag. An
untagged skill is a plugin of its own. A token needs the **Read content** capability.

The SDK returns download links. It does not build or extract archives. Each archive is a gzipped
tar file. Use a library such as `tar` to extract it.

### Sync Plugins

`version_id` changes only when the content changes. Store it, and download a plugin only when
its `version_id` changes.

```typescript
import { paginate } from '@visus-io/notion-sdk-ts';

const stored = new Map<string, string>(); // plugin ID -> version_id from the last sync

const plugins = await paginate((cursor) => notion.skills.listPlugins({ start_cursor: cursor }));

for (const plugin of plugins) {
  if (stored.get(plugin.id) === plugin.version_id) {
    continue;
  }

  const download = await notion.skills.retrievePlugin(plugin.id);
  const archive = await fetch(download.url); // The signed URL expires. Download it now.
  // Extract the archive. It has `plugin.json` and a `skills/` folder.
  stored.set(plugin.id, download.version_id);
}

// Remove a local plugin only after a complete listing.
const current = new Set(plugins.map((plugin) => plugin.id));
for (const id of stored.keys()) {
  if (!current.has(id)) {
    stored.delete(id);
  }
}
```

Call `notion.skills.retrieve(skillId)` to download one skill. Its archive has one directory with
`SKILL.md` and the supporting files.

### Upload a Skill

Create the page in a Skills database first. Then upload a gzipped tar archive of the skill
directory. The archive must have a `SKILL.md` file with `name` and `description` frontmatter.
The maximum size is 20 MiB.

```typescript
import { readFile } from 'node:fs/promises';

const archive = await readFile('my-skill.tar.gz');
const result = await notion.skills.upload('skill-page-id', archive);

console.log(result.version_id);
```

The upload replaces the page title, **Description**, content, and **Files**. The SDK does not
retry an upload after a `504` response, because the upload can still succeed. Retrieve the skill
and compare its `version_id` before you retry.

---

## Limits

The SDK checks these limits before it sends a request. It throws a `NotionValidationError` when
a value exceeds a limit.

| Value                                     | Limit                               |
| ----------------------------------------- | ----------------------------------- |
| `message`, `prompt_context`               | 10,000 characters                   |
| `metadata`                                | 20 keys, 2,000 characters per value |
| `attachments`                             | 100 items                           |
| `actions`, batch `operations`             | 1 to 100 items                      |
| `query` text of an agent or session query | 2,000 characters                    |
| `sorts`                                   | 1 or 2 items                        |
| `page_size`                               | An integer from 1 to 100            |
| `credit_limit`                            | A non-negative integer, or `null`   |

---

## Related Pages

- **[Models](/guides/models/)**: the `Agent` and `Session` models.
- **[Error Handling](/guides/error-handling/)**: how to handle API and network errors.
- **[Request Size Limits](/guides/request-size-limits/)**: all client-side limits.
- **[Notion Agent APIs](https://developers.notion.com/guides/notion-agent-apis/overview)**: the
  official reference.
