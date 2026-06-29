export function validateLink(
	link: string | undefined,
	tryAdding: boolean = true
): string | undefined {
	if (!link) return;
	try {
		new URL(link);

		return link;
	} catch (e) {
		if (!tryAdding) return;

		try {
			link = 'https://' + link;
			new URL(link);

			return link;
		} catch (e) {
			return;
		}
	}
}
