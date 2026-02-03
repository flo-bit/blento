# Selfhosting with cloudflare workers

I currently advise everyone to _not_ selfhost, as long as this project is still in the beginning stages with lots of changes every day, isntead I'd suggest setting up a custom domain (see [here](./CustomDomain.md)) and only later once this project is more stable to selfhost, thanks to the magic of atproto, you'll just have to change where your domain points to and setup the selfhosted version and your content will magically transfer over.

If you do still want to give selfhosting a try now, some features/cards may break on your selfhosted version, in that case sync with the upstream repo.

1. fork this repo
2. create a cloudflare worker application and connect it to your fork
3. change the vars in `wrangler.jsonc` (including https:// in the PUBLIC_DOMAIN var!)

```json
	"vars": {
		"PUBLIC_HANDLE": "your-bluesky-handle",
		"PUBLIC_IS_SELFHOSTED": "true",
		"PUBLIC_DOMAIN": "https://your-cloudflare-worker-or-custom-domain.com"
	}
```

4. remove the kv_namespaces from the `wrangler.jsonc`

```json
"kv_namespaces": [
	{
		"binding": "USER_DATA_CACHE",
		"id": "d6ff203259de48538d332b0a5df258a7",
		"remote": true
	}
]
```

5. optionally to improve performance: create your own kv store by running `npx wrangler kv namespace create USER_DATA_CACHE` and when asked add it to the `wrangler.jsonc`

DONE :) your blento should be live after a minute or two at `your-cloudflare-worker-or-custom-domain.com` and you can edit it by signing in with your bluesky account at `your-cloudflare-worker-or-custom-domain.com/edit`

6. some cards need their own additional env keys, if you have these cards in your profile, create your keys and add them to your cloudflare worker

- github profile: GITHUB_TOKEN (token with public_repo access)
- map: no token needed (uses OpenFreeMap)
