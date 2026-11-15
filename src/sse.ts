/**
 * Server-sent events (SSE) parser.
 *
 * This parser follows the WHATWG event stream format. It handles `\n`, `\r\n`, and `\r` line
 * endings, multi-line `data` fields, comment lines, and chunks that split a line.
 *
 * @see https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
 */

/**
 * One dispatched server-sent event.
 *
 * @category Client & Core
 */
export interface SseFrame {
  /** The `event` field. The default is `message`. */
  event: string;

  /** The joined `data` lines, separated by `\n`. */
  data: string;

  /** The last `id` field, if the stream sent one. */
  id?: string;
}

interface FrameState {
  event: string;
  dataLines: string[];
  hasData: boolean;
  id?: string;
}

function emptyState(id?: string): FrameState {
  return { event: '', dataLines: [], hasData: false, id };
}

/**
 * Apply one line to the frame state. Return `true` when the line ends the frame.
 */
function applyLine(state: FrameState, line: string): boolean {
  if (line === '') {
    return true;
  }

  if (line.startsWith(':')) {
    return false;
  }

  const colon = line.indexOf(':');
  const field = colon === -1 ? line : line.slice(0, colon);
  let value = colon === -1 ? '' : line.slice(colon + 1);
  if (value.startsWith(' ')) {
    value = value.slice(1);
  }

  if (field === 'data') {
    state.dataLines.push(value);
    state.hasData = true;
  } else if (field === 'event') {
    state.event = value;
  } else if (field === 'id' && !value.includes('\0')) {
    state.id = value;
  }

  return false;
}

function toFrame(state: FrameState): SseFrame | undefined {
  if (!state.hasData) {
    return undefined;
  }

  const frame: SseFrame = { event: state.event || 'message', data: state.dataLines.join('\n') };
  if (state.id !== undefined) {
    frame.id = state.id;
  }
  return frame;
}

/**
 * Parse a stream of text chunks into server-sent events.
 * A frame with no `data` field is not dispatched. A final frame without a trailing blank line
 * is dispatched when the input ends.
 *
 * @param chunks - Decoded text chunks, in order
 * @returns An async generator of frames
 *
 * @category Client & Core
 */
export async function* parseSseStream(chunks: AsyncIterable<string>): AsyncGenerator<SseFrame> {
  let buffer = '';
  let state = emptyState();
  // A chunk can end between `\r` and `\n`. Skip that `\n` at the start of the next chunk.
  let skipLeadingLf = false;

  for await (const chunk of chunks) {
    // An empty chunk (for example, a partial multi-byte character) must not reset
    // `skipLeadingLf`. The `\n` of a split `\r\n` can still arrive in a later chunk.
    if (chunk === '') {
      continue;
    }

    buffer += chunk;
    if (skipLeadingLf && buffer.startsWith('\n')) {
      buffer = buffer.slice(1);
    }
    skipLeadingLf = false;

    for (;;) {
      const match = /\r\n|\r|\n/.exec(buffer);
      if (!match) {
        break;
      }

      // A `\r` at the end of the buffer can be the first half of `\r\n`.
      if (match[0] === '\r' && match.index === buffer.length - 1) {
        skipLeadingLf = true;
      }

      const line = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);

      if (applyLine(state, line)) {
        const frame = toFrame(state);
        state = emptyState(state.id);
        if (frame) {
          yield frame;
        }
      }
    }
  }

  if (buffer !== '') {
    applyLine(state, buffer);
  }
  const last = toFrame(state);
  if (last) {
    yield last;
  }
}
