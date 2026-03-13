<script lang="ts">
	import type { SettingsComponentProps } from '../../types';
	import { AtprotoHandlePopup } from '@foxui/social';

	let { item = $bindable() }: SettingsComponentProps = $props();

	function addFriend(actor: { did: string; handle: string }) {
		if (!item.cardData.friends) item.cardData.friends = [];
		if (item.cardData.friends.includes(actor.did)) return;
		item.cardData.friends = [...item.cardData.friends, actor.did];
	}
</script>

<AtprotoHandlePopup onselected={addFriend} />
