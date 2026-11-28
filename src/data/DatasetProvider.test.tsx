import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DatasetProvider, useDataset } from './DatasetProvider';

function Probe() {
  return <span>{useDataset().status}</span>;
}

describe('DatasetProvider', () => {
  it('exposes the loading status before the load settles', () => {
    const html = renderToString(
      <DatasetProvider>
        <Probe />
      </DatasetProvider>,
    );
    expect(html).toContain('loading');
  });
});
