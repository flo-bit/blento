// Subset of the Roomy XRPC responses this readonly card renders.
// Source of truth: https://api.roomy.space/xrpc/space.roomy.room.getMessages
//                  https://api.roomy.space/xrpc/space.roomy.room.getMetadata

export interface RoomyReaction {
	emoji: string;
	dids: string[];
}

export interface RoomyMessage {
	id: string;
	content: string;
	authorDid: string;
	authorName: string;
	authorHandle: string;
	authorAvatar?: string;
	timestamp: string;
	reactions: RoomyReaction[];
}

export interface RoomyRoomData {
	roomId: string;
	spaceId?: string;
	name?: string;
	messages: RoomyMessage[];
}

// Loaded data is keyed by roomId.
export type RoomyLoadedData = Record<string, RoomyRoomData | undefined>;
