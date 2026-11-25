import { describe, expect, it } from 'vitest';
import App from './App';

describe('scaffold', () => {
  it('exports the App component', () => {
    expect(typeof App).toBe('function');
  });
});
