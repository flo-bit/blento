import { env } from '$env/dynamic/public';

/**
 * Controls whether the section management UI is exposed to users.
 * When false, users can only edit the default grid section — no adding,
 * reordering, or deleting sections (or hero/other section types).
 *
 * Set PUBLIC_SECTIONS_ENABLED=true in the environment to enable.
 */
export const SECTIONS_EDITING_ENABLED = env.PUBLIC_SECTIONS_ENABLED === 'true';
