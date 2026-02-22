import type { EventData } from '$lib/cards/social/EventCard';

/**
 * Escape text for iCal fields (RFC 5545 Section 3.3.11).
 * Backslashes, semicolons, commas, and newlines must be escaped.
 */
function escapeText(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n');
}

/**
 * Fold long lines per RFC 5545 (max 75 octets per line).
 * Continuation lines start with a single space.
 */
function foldLine(line: string): string {
	const maxLen = 75;
	if (line.length <= maxLen) return line;

	const parts: string[] = [];
	parts.push(line.slice(0, maxLen));
	let i = maxLen;
	while (i < line.length) {
		parts.push(' ' + line.slice(i, i + maxLen - 1));
		i += maxLen - 1;
	}
	return parts.join('\r\n');
}

/**
 * Convert an ISO 8601 date string to iCal DATETIME format (UTC).
 * e.g. "2026-02-22T15:00:00Z" -> "20260222T150000Z"
 */
function toICalDate(isoString: string): string {
	const d = new Date(isoString);
	const pad = (n: number) => n.toString().padStart(2, '0');
	return (
		d.getUTCFullYear().toString() +
		pad(d.getUTCMonth() + 1) +
		pad(d.getUTCDate()) +
		'T' +
		pad(d.getUTCHours()) +
		pad(d.getUTCMinutes()) +
		pad(d.getUTCSeconds()) +
		'Z'
	);
}

/**
 * Extract a location string from event locations array.
 */
function getLocationString(locations: EventData['locations']): string | undefined {
	if (!locations || locations.length === 0) return undefined;

	const loc = locations.find((v) => v.$type === 'community.lexicon.location.address');
	if (!loc) return undefined;

	const flat = loc as Record<string, unknown>;
	const nested = loc.address;

	const street = (flat.street as string) || undefined;
	const locality = (flat.locality as string) || nested?.locality;
	const region = (flat.region as string) || nested?.region;

	const parts = [street, locality, region].filter(Boolean);
	return parts.length > 0 ? parts.join(', ') : undefined;
}

function getModeLabel(mode: string): string {
	if (mode.includes('virtual')) return 'Virtual';
	if (mode.includes('hybrid')) return 'Hybrid';
	if (mode.includes('inperson')) return 'In-Person';
	return 'Event';
}

export interface ICalAttendee {
	name: string;
	status: 'going' | 'interested';
	url?: string;
}

export interface ICalEvent {
	eventData: EventData;
	uid: string;
	url?: string;
	organizer?: string;
	imageUrl?: string;
	attendees?: ICalAttendee[];
}

/**
 * Generate a single VEVENT block.
 */
function generateVEvent(event: ICalEvent): string | null {
	const { eventData, uid, url, organizer, imageUrl } = event;

	// Skip events with invalid or missing start dates
	const startTime = new Date(eventData.startsAt);
	if (isNaN(startTime.getTime())) return null;

	const lines: string[] = [];

	lines.push('BEGIN:VEVENT');
	lines.push(`UID:${escapeText(uid)}`);
	lines.push(`DTSTART:${toICalDate(eventData.startsAt)}`);

	if (eventData.endsAt) {
		lines.push(`DTEND:${toICalDate(eventData.endsAt)}`);
	} else {
		// Default to 1 hour duration when no end time is specified
		const defaultEnd = new Date(startTime.getTime() + 60 * 60 * 1000);
		lines.push(`DTEND:${toICalDate(defaultEnd.toISOString())}`);
	}

	lines.push(`SUMMARY:${escapeText(eventData.name)}`);

	// Description: text + links
	const descParts: string[] = [];
	if (eventData.description) {
		descParts.push(eventData.description);
	}
	if (eventData.uris && eventData.uris.length > 0) {
		descParts.push('');
		descParts.push('Links:');
		for (const link of eventData.uris) {
			descParts.push(link.name ? `${link.name}: ${link.uri}` : link.uri);
		}
	}
	if (url) {
		descParts.push('');
		descParts.push(`Event page: ${url}`);
	}
	if (descParts.length > 0) {
		lines.push(`DESCRIPTION:${escapeText(descParts.join('\n'))}`);
	}

	const location = getLocationString(eventData.locations);
	if (location) {
		lines.push(`LOCATION:${escapeText(location)}`);
	}

	if (url) {
		lines.push(`URL:${url}`);
	}

	// Categories from event mode
	if (eventData.mode) {
		lines.push(`CATEGORIES:${escapeText(getModeLabel(eventData.mode))}`);
	}

	// Organizer
	if (organizer) {
		lines.push(
			`ORGANIZER;CN=${escapeText(organizer)}:https://bsky.app/profile/${encodeURIComponent(organizer)}`
		);
	}

	// Attendees
	if (event.attendees) {
		for (const attendee of event.attendees) {
			const partstat = attendee.status === 'going' ? 'ACCEPTED' : 'TENTATIVE';
			lines.push(
				`ATTENDEE;CN=${escapeText(attendee.name)};PARTSTAT=${partstat}:${attendee.url || `https://bsky.app/profile/${encodeURIComponent(attendee.name)}`}`
			);
		}
	}

	// Image (supported by Apple Calendar, Google Calendar)
	if (imageUrl) {
		lines.push(`IMAGE;VALUE=URI;DISPLAY=BADGE:${imageUrl}`);
	}

	lines.push(`DTSTAMP:${toICalDate(new Date().toISOString())}`);

	// Reminder 15 minutes before
	lines.push('BEGIN:VALARM');
	lines.push('TRIGGER:-PT15M');
	lines.push('ACTION:DISPLAY');
	lines.push(`DESCRIPTION:${escapeText(eventData.name)}`);
	lines.push('END:VALARM');

	lines.push('END:VEVENT');

	return lines.map(foldLine).join('\r\n');
}

/**
 * Generate a complete iCal feed from multiple events.
 */
export function generateICalFeed(events: ICalEvent[], calendarName: string): string {
	const lines: string[] = [];

	lines.push('BEGIN:VCALENDAR');
	lines.push('VERSION:2.0');
	lines.push('PRODID:-//Blento//Events//EN');
	lines.push(`X-WR-CALNAME:${escapeText(calendarName)}`);
	lines.push('CALSCALE:GREGORIAN');
	lines.push('METHOD:PUBLISH');

	const vevents = events.map(generateVEvent).filter((v): v is string => v !== null);

	const result =
		lines.map(foldLine).join('\r\n') + '\r\n' + vevents.join('\r\n') + '\r\nEND:VCALENDAR\r\n';
	return result;
}

/**
 * Generate iCal content for a single event (for client-side download).
 */
export function generateICalEvent(eventData: EventData, atUri: string, eventUrl?: string): string {
	return generateICalFeed([{ eventData, uid: atUri, url: eventUrl }], eventData.name);
}
