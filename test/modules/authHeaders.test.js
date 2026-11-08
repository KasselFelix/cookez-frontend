import { authHeaders, jsonAuthHeaders } from '../../modules/authHeaders';

describe('authHeaders (plan 016, PR 3)', () => {
  it('puts the token in a Bearer Authorization header', () => {
    expect(authHeaders('abc')).toEqual({ Authorization: 'Bearer abc' });
  });

  it('adds no Content-Type, so a multipart upload keeps its boundary', () => {
    expect(authHeaders('abc')).not.toHaveProperty('Content-Type');
  });

  it('sends no header without a token, never "Bearer undefined"', () => {
    expect(authHeaders(undefined)).toEqual({});
    expect(authHeaders(null)).toEqual({});
    expect(authHeaders('')).toEqual({});
  });
});

describe('jsonAuthHeaders', () => {
  it('adds the JSON Content-Type to the Authorization header', () => {
    expect(jsonAuthHeaders('abc')).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' });
  });

  it('keeps the JSON Content-Type for a guest call', () => {
    expect(jsonAuthHeaders(null)).toEqual({ 'Content-Type': 'application/json' });
  });
});
