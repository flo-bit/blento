import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WebsiteData } from '../types';

const { putRecord, deleteRecord } = vi.hoisted(() => ({
	putRecord: vi.fn().mockResolvedValue({}),
	deleteRecord: vi.fn().mockResolvedValue(true)
}));

vi.mock('$lib/atproto', () => ({ putRecord, deleteRecord }));
vi.mock('../cards', () => ({ CardDefinitionsByType: {} }));
vi.mock('$env/dynamic/public', () => ({ env: { PUBLIC_ENABLE_NODE_MIGRATION: 'false' } }));

import { savePage } from './save';

function page(page: string): WebsiteData {
	return {
		page,
		did: 'did:plc:example',
		handle: 'example.test',
		cards: [],
		sections: [],
		publication: { name: 'Example', description: 'Bio', preferences: { accentColor: 'red' } },
		profile: { did: 'did:plc:example', handle: 'example.test' } as WebsiteData['profile'],
		additionalData: {},
		updatedAt: 0
	};
}

beforeEach(() => {
	putRecord.mockClear();
	deleteRecord.mockClear();
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}));
});

describe('savePage metadata', () => {
	it('writes the home page to app.blento.page even if metadata has not changed', async () => {
		const data = page('blento.self');
		await savePage(data, [], [], JSON.stringify(data.publication));

		expect(putRecord).toHaveBeenCalledWith({
			collection: 'app.blento.page',
			rkey: 'blento.self',
			record: expect.objectContaining({ name: 'Example', url: 'https://blento.app/example.test' })
		});
		expect(putRecord).not.toHaveBeenCalledWith(
			expect.objectContaining({ collection: 'site.standard.publication' })
		);
	});

	it('deletes only the legacy blento.self publication record after writing the home page', async () => {
		const data = page('blento.self');
		await savePage(data, [], [], JSON.stringify(data.publication));

		expect(deleteRecord).toHaveBeenCalledTimes(1);
		expect(deleteRecord).toHaveBeenCalledWith({
			collection: 'site.standard.publication',
			rkey: 'blento.self'
		});
		expect(putRecord.mock.invocationCallOrder[0]).toBeLessThan(
			deleteRecord.mock.invocationCallOrder[0]
		);
	});

	it('keeps the legacy record if writing the home page fails', async () => {
		putRecord.mockRejectedValueOnce(new Error('PDS down'));
		const data = page('blento.self');
		await expect(savePage(data, [], [], JSON.stringify(data.publication))).rejects.toThrow();
		expect(deleteRecord).not.toHaveBeenCalled();
	});

	it('does not touch site.standard.publication when saving a sub-page', async () => {
		const data = page('blento.about');
		await savePage(data, [], [], '');
		expect(deleteRecord).not.toHaveBeenCalled();
	});

	it('writes changed sub-page metadata to app.blento.page', async () => {
		const data = page('blento.about');
		await savePage(data, [], [], '');
		expect(putRecord).toHaveBeenCalledWith(
			expect.objectContaining({ collection: 'app.blento.page', rkey: 'blento.about' })
		);
	});
});
