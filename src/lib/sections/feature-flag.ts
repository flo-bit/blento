import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

/**
 * DIDs that always have section-editing UI enabled, regardless of the
 * PUBLIC_SECTIONS_ENABLED env flag. Useful for dogfooding with specific users.
 */
const ALLOWED_DIDS: readonly string[] = [
    // flo-bit.dev
    'did:plc:257wekqxg4hyapkq6k47igmp'
];

/**
 * Controls whether the section management UI is exposed to a given user.
 * When false, users can only edit the default grid section — no adding,
 * reordering, or deleting sections (or hero/other section types).
 *
 * Enabled when PUBLIC_SECTIONS_ENABLED=true, in dev mode, or the given DID
 * is in ALLOWED_DIDS.
 */
export function isSectionsEditingEnabled(did?: string | null): boolean {
	if (env.PUBLIC_SECTIONS_ENABLED === 'true') return true;
	return !!did && ALLOWED_DIDS.includes(did);
}
