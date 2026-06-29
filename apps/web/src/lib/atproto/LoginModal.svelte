<script lang="ts" module>
	export const atProtoLoginModalState = $state({
		open: false,
		show: () => {
			atProtoLoginModalState.open = true;
		},
		hide: () => {
			atProtoLoginModalState.open = false;
		}
	});
</script>

<script lang="ts">
	import { AtprotoLoginModal } from '@foxui/social';
	import { login, signup } from '.';
	import { type ActorIdentifier } from '@atcute/lexicons';
</script>

<AtprotoLoginModal
	bind:open={atProtoLoginModalState.open}
	login={async (handle) => {
		await login(handle as ActorIdentifier);
		return true;
	}}
	signup={async () => {
		await signup();
		return true;
	}}
/>
