import type { Did, Handle } from '@atcute/lexicons';
import { createContext } from 'svelte';

export const [getDidContext, setDidContext] = createContext<Did>();
export const [getHandleContext, setHandleContext] = createContext<Handle>();
export const [getIsMobile, setIsMobile] = createContext<() => boolean>();
export const [getIsRealMobile, setIsRealMobile] = createContext<() => boolean>();
export const [getCanEdit, setCanEdit] = createContext<() => boolean>();
export const [getAdditionalUserData, setAdditionalUserData] =
	createContext<Record<string, unknown>>();
/** Resolved `node.source` data keyed by node id (== card id). Runtime-only. See `@blento/sources`. */
export const [getLoadedData, setLoadedData] =
	createContext<Record<string, { data: unknown; nextCursor?: string } | null>>();
export const [getIsCoarse, setIsCoarse] = createContext<() => boolean>();
export const [getSelectedCardId, setSelectedCardId] = createContext<() => string | null>();
export const [getSelectCard, setSelectCard] = createContext<(id: string | null) => void>();
export const [getToggleCardSettings, setToggleCardSettings] = createContext<(id: string) => void>();
export const [getOpenSectionSettings, setOpenSectionSettings] =
	createContext<(id: string) => void>();
