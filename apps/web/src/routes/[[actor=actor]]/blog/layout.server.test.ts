import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getRecord, getActor } = vi.hoisted(() => ({
	getRecord: vi.fn(),
	getActor: vi.fn()
}));

vi.mock('$lib/atproto/methods.js', () => ({ getRecord }));
vi.mock('$lib/helpers/actor.js', () => ({ getActor }));

import { load } from './+layout.server';

const did = 'did:plc:example';
// Only these event fields are consumed by the layout loader.
const event = {
	params: { actor: 'example.test' },
	platform: undefined,
	request: new Request('https://blento.app/example.test/blog')
} as unknown as Parameters<typeof load>[0];

beforeEach(() => {
	getRecord.mockReset();
	getActor.mockReset().mockResolvedValue(did);
});

describe('blog theme', () => {
	it('prefers the migrated home page without reading the legacy record', async () => {
		getRecord.mockResolvedValueOnce({
			value: { preferences: { accentColor: 'red', baseColor: 'gray' } }
		});

		expect(await load(event)).toEqual({ accentColor: 'red', baseColor: 'gray' });
		expect(getRecord).toHaveBeenCalledExactlyOnceWith({
			did,
			collection: 'app.blento.page',
			rkey: 'blento.self'
		});
	});

	it('uses the legacy theme when the migrated home page is missing', async () => {
		getRecord.mockRejectedValueOnce(new Error('Record not found')).mockResolvedValueOnce({
			value: { preferences: { accentColor: 'blue', baseColor: 'slate' } }
		});

		expect(await load(event)).toEqual({ accentColor: 'blue', baseColor: 'slate' });
		expect(getRecord).toHaveBeenNthCalledWith(2, {
			did,
			collection: 'site.standard.publication',
			rkey: 'blento.self'
		});
	});

	it('returns default colors when neither record is available', async () => {
		getRecord.mockRejectedValue(new Error('Record not found'));

		expect(await load(event)).toEqual({ accentColor: undefined, baseColor: undefined });
		expect(getRecord).toHaveBeenCalledTimes(2);
	});

	it('does not fetch records when there is no actor', async () => {
		getActor.mockResolvedValueOnce(undefined);

		expect(await load(event)).toEqual({ accentColor: undefined, baseColor: undefined });
		expect(getRecord).not.toHaveBeenCalled();
	});
});
