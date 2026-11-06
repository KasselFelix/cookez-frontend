/* global jest, describe, it, expect, beforeEach, afterEach */
// Plan 015 (S5): a photo goes to POST /vision/analyze with the session token in
// the header; the answer codes become statuses the scan slice understands.
import { analyzePhoto, analyzePhotoWithRetry } from '../../modules/visionApi';

const respond = (status, body, headers = {}) =>
  Promise.resolve({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name) => headers[name] ?? null },
    json: () => Promise.resolve(body),
  });

const OK_BODY = {
  result: true,
  ingredients: [{ _id: 'a'.repeat(24), name: 'tomato', photoUrl: null, defaultUnit: 'g', confidence: 'high', confirm: false }],
  unmatched: ['yuzu kosho'],
};

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

describe('analyzePhoto', () => {
  it('posts the photo as multipart with the token in the header only', async () => {
    global.fetch.mockReturnValue(respond(200, OK_BODY));
    await analyzePhoto('file:///photo.jpg', 'session-token');
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/vision\/analyze$/);
    expect(url).not.toContain('session-token');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Authorization: 'Bearer session-token' });
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('returns the ingredients and the unmatched names', async () => {
    global.fetch.mockReturnValue(respond(200, OK_BODY));
    expect(await analyzePhoto('file:///p.jpg', 't')).toEqual({
      status: 'ok',
      ingredients: OK_BODY.ingredients,
      unmatched: ['yuzu kosho'],
    });
  });

  it.each([
    [401, { status: 'unauthorized' }],
    [429, { status: 'quota' }],
    [502, { status: 'error' }],
    [500, { status: 'error' }],
  ])('maps %i', async (code, expected) => {
    global.fetch.mockReturnValue(respond(code, { result: false, error: 'x' }));
    expect(await analyzePhoto('file:///p.jpg', 't')).toEqual(expected);
  });

  it('reads Retry-After of a 503', async () => {
    global.fetch.mockReturnValue(respond(503, { result: false }, { 'Retry-After': '4' }));
    expect(await analyzePhoto('file:///p.jpg', 't')).toEqual({ status: 'busy', retryAfter: 4 });
  });

  it('reports a request that never reached the server', async () => {
    global.fetch.mockReturnValue(Promise.reject(new TypeError('Network request failed')));
    expect(await analyzePhoto('file:///p.jpg', 't')).toEqual({ status: 'network' });
  });
});

describe('analyzePhotoWithRetry', () => {
  it('retries a busy answer once, after Retry-After', async () => {
    global.fetch
      .mockReturnValueOnce(respond(503, {}, { 'Retry-After': '3' }))
      .mockReturnValueOnce(respond(200, OK_BODY));
    const wait = jest.fn(() => Promise.resolve());
    const result = await analyzePhotoWithRetry('file:///p.jpg', 't', { wait });
    expect(wait).toHaveBeenCalledWith(3000);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.status).toBe('ok');
  });

  it('gives up after a second busy answer', async () => {
    global.fetch.mockReturnValue(respond(503, {}, { 'Retry-After': '120' }));
    const wait = jest.fn(() => Promise.resolve());
    expect(await analyzePhotoWithRetry('file:///p.jpg', 't', { wait })).toEqual({ status: 'error' });
    expect(wait).toHaveBeenCalledWith(30000);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries a network failure once, after a second', async () => {
    global.fetch
      .mockReturnValueOnce(Promise.reject(new TypeError('Network request failed')))
      .mockReturnValueOnce(respond(200, OK_BODY));
    const wait = jest.fn(() => Promise.resolve());
    expect((await analyzePhotoWithRetry('file:///p.jpg', 't', { wait })).status).toBe('ok');
    expect(wait).toHaveBeenCalledWith(1000);
  });

  it('turns two network failures into an error', async () => {
    global.fetch.mockReturnValue(Promise.reject(new TypeError('Network request failed')));
    const wait = jest.fn(() => Promise.resolve());
    expect(await analyzePhotoWithRetry('file:///p.jpg', 't', { wait })).toEqual({ status: 'error' });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('never retries a quota answer', async () => {
    global.fetch.mockReturnValue(respond(429, {}));
    const wait = jest.fn();
    expect(await analyzePhotoWithRetry('file:///p.jpg', 't', { wait })).toEqual({ status: 'quota' });
    expect(wait).not.toHaveBeenCalled();
  });
});
