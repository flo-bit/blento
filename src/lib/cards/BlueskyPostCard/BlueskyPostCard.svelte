<script lang="ts">
	import { getAdditionalUserData } from '$lib/helper';
	import { BlueskyPost } from '@foxui/social';

	const feed = getAdditionalUserData().recentPosts?.feed;

	$inspect(feed);
</script>

<div class="flex max-h-full overflow-y-scroll p-4">
	{#if feed?.[0].post}
		<BlueskyPost showLogo showBookmark={false} feedViewPost={feed?.[0].post}></BlueskyPost>
	{:else}
		Your latest bluesky post will appear here.
	{/if}
</div>
