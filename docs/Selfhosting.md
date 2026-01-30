# Selfhosting with cloudflare workers

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
- map: PUBLIC_MAPBOX_TOKEN
