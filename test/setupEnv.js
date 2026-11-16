// Runs before each test file loads any module (jest.config.js, setupFiles).
// modules/addressIp.js throws without EXPO_PUBLIC_API_URL (plan 019, audit
// 2.9). A non-routable URL: no test reaches a real API, and the fetch mock of
// test/setup.js answers every call.
process.env.EXPO_PUBLIC_API_URL = 'https://api.invalid';
