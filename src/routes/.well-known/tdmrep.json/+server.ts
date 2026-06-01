import { json } from '@sveltejs/kit';

/**
 * TDM Reservation Protocol (W3C Community Group).
 * `tdm-reservation: 1` reserves all rights — i.e. we opt out of text & data
 * mining (including AI training) for the whole site. This is the legally-framed
 * counterpart to robots.txt and the Content-Usage header.
 * https://www.w3.org/community/reports/tdmrep/CG-FINAL-tdmrep-20240202/
 */
export function GET() {
	return json([{ location: '/', 'tdm-reservation': 1 }], {
		headers: { 'cache-control': 'public, max-age=86400' }
	});
}
