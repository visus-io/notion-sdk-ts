import { describe, expect, it } from 'vitest';
import { parseSseStream, type SseFrame } from './sse';

async function* chunksOf(...chunks: string[]): AsyncGenerator<string> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

async function collect(...chunks: string[]): Promise<SseFrame[]> {
  const frames: SseFrame[] = [];
  for await (const frame of parseSseStream(chunksOf(...chunks))) {
    frames.push(frame);
  }
  return frames;
}

describe('parseSseStream', () => {
  it('should parse one frame per blank-line-terminated block', async () => {
    const frames = await collect('data: {"a":1}\n\ndata: {"b":2}\n\n');

    expect(frames).toEqual([
      { event: 'message', data: '{"a":1}' },
      { event: 'message', data: '{"b":2}' },
    ]);
  });

  it('should join a frame that a chunk boundary splits', async () => {
    const frames = await collect('da', 'ta: {"a"', ':1}\n', '\n');

    expect(frames).toEqual([{ event: 'message', data: '{"a":1}' }]);
  });

  it('should accept CRLF and CR line endings, also when a chunk splits CRLF', async () => {
    const frames = await collect('data: one\r', '\n\r\ndata: two\r\rdata: three\n\n');

    expect(frames.map((frame) => frame.data)).toEqual(['one', 'two', 'three']);
  });

  it('should keep a split CRLF together across an empty chunk', async () => {
    const frames = await collect('data: a\r', '', '\ndata: b\n\n');

    expect(frames).toEqual([{ event: 'message', data: 'a\nb' }]);
  });

  it('should join multi-line data with a newline', async () => {
    const frames = await collect('data: line 1\ndata: line 2\n\n');

    expect(frames).toEqual([{ event: 'message', data: 'line 1\nline 2' }]);
  });

  it('should ignore comment lines and frames with no data', async () => {
    const frames = await collect(': keepalive\n\n', 'event: ping\n\n', 'data: x\n\n');

    expect(frames).toEqual([{ event: 'message', data: 'x' }]);
  });

  it('should keep the event and id fields, and carry the id to later frames', async () => {
    const frames = await collect('event: update\nid: 7\ndata: a\n\ndata: b\n\n');

    expect(frames).toEqual([
      { event: 'update', id: '7', data: 'a' },
      { event: 'message', id: '7', data: 'b' },
    ]);
  });

  it('should remove only one leading space from a value', async () => {
    const frames = await collect('data:no-space\n\ndata:  two-spaces\n\n');

    expect(frames.map((frame) => frame.data)).toEqual(['no-space', ' two-spaces']);
  });

  it('should dispatch a final frame without a trailing blank line', async () => {
    const frames = await collect('data: last');

    expect(frames).toEqual([{ event: 'message', data: 'last' }]);
  });

  it('should remove one leading byte order mark and keep a later one', async () => {
    const frames = await collect('', '\uFEFFdata: first\n\n', 'data: \uFEFFsecond\n\n');

    expect(frames.map((frame) => frame.data)).toEqual(['first', '\uFEFFsecond']);
  });

  it('should not treat a byte order mark after the first chunk as a marker', async () => {
    const frames = await collect('data: a\n\n', '\uFEFFdata: b\n\n');

    expect(frames).toEqual([{ event: 'message', data: 'a' }]);
  });

  it('should yield nothing for an empty stream', async () => {
    expect(await collect()).toEqual([]);
    expect(await collect('')).toEqual([]);
  });
});
