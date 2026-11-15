/**
 * Server-sent events (SSE) parser.
 *
 * This parser follows the WHATWG event stream format. It handles `\n`, `\r\n`, and `\r` line
 * endings, multi-line `data` fields, comment lines, chunks that split a line, and one leading
 * byte order mark.
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

const LINE_END = /\r\n|\r|\n/;

/**
 * Split a buffer into complete lines. Return the lines, the text after the last line ending,
 * and whether the buffer ends with a `\r`. That `\r` can be the first half of a `\r\n` that
 * the next chunk completes.
 */
function takeLines(buffer: string): { lines: string[]; rest: string; endsWithCr: boolean } {
  const lines: string[] = [];
  let rest = buffer;
  let endsWithCr = false;

  for (let match = LINE_END.exec(rest); match; match = LINE_END.exec(rest)) {
    endsWithCr = match[0] === '\r' && match.index === rest.length - 1;
    lines.push(rest.slice(0, match.index));
    rest = rest.slice(match.index + match[0].length);
  }

  return { lines, rest, endsWithCr };
}

/**
 * Turn text chunks into lines. Yield the text after the last line ending when the input ends.
 */
async function* splitLines(chunks: AsyncIterable<string>): AsyncGenerator<string> {
  let buffer = '';
  // A chunk can end between `\r` and `\n`. Skip that `\n` at the start of the next chunk.
  let skipLeadingLf = false;
  // The event stream format allows one byte order mark at the start. Remove only that one.
  let isFirstText = true;

  for await (const chunk of chunks) {
    // An empty chunk (for example, a partial multi-byte character) must not reset
    // `skipLeadingLf`. The `\n` of a split `\r\n` can still arrive in a later chunk.
    if (chunk === '') {
      continue;
    }

    buffer += isFirstText && chunk.startsWith('\uFEFF') ? chunk.slice(1) : chunk;
    isFirstText = false;
    if (skipLeadingLf && buffer.startsWith('\n')) {
      buffer = buffer.slice(1);
    }

    const { lines, rest, endsWithCr } = takeLines(buffer);
    buffer = rest;
    skipLeadingLf = endsWithCr;
    yield* lines;
  }

  if (buffer !== '') {
    yield buffer;
  }
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
  let state = emptyState();

  for await (const line of splitLines(chunks)) {
    if (!applyLine(state, line)) {
      continue;
    }

    const frame = toFrame(state);
    state = emptyState(state.id);
    if (frame) {
      yield frame;
    }
  }

  const last = toFrame(state);
  if (last) {
    yield last;
  }
}
