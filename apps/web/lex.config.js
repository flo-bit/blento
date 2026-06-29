import { defineLexiconConfig } from '@atcute/lex-cli';

export default defineLexiconConfig({
	files: ['lexicons/custom/**/*.json', 'lexicons/pulled/**/*.json', 'lexicons/generated/**/*.json'],
	outdir: 'src/lexicon-types/',
	imports: ['@atcute/atproto'],
	pull: {
		outdir: 'lexicons/pulled/',
		sources: [
			{
				type: 'atproto',
				mode: 'nsids',
				nsids: [
					'app.blento.card',
					'app.blento.page',
					'app.blento.section',
					'app.bsky.actor.profile',
					'app.nearhorizon.actor.pronouns',
					'site.standard.publication'
				]
			}
		]
	}
});
