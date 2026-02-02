<script lang="ts" module>
	import { Dialog, type WithoutChild } from 'bits-ui';
	import { cn } from '@foxui/core';

	export type ModalProps = Dialog.RootProps & {
		interactOutsideBehavior?: 'close' | 'ignore';
		closeButton?: boolean;
		contentProps?: WithoutChild<Dialog.ContentProps>;

		class?: string;

		onOpenAutoFocus?: (event: Event) => void;
	};
</script>

<script lang="ts">
	let {
		open = $bindable(false),
		children,
		contentProps,
		interactOutsideBehavior = 'close',
		closeButton = true,
		class: className,
		onOpenAutoFocus,
		...restProps
	}: ModalProps = $props();
</script>

<Dialog.Root bind:open {...restProps}>
	<Dialog.Portal>
		<Dialog.Overlay
			class="motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-base-200/10 dark:bg-base-900/10 fixed inset-0 z-50 backdrop-blur-sm"
		/>
		<Dialog.Content
			{onOpenAutoFocus}
			{interactOutsideBehavior}
			{...contentProps}
			class={cn(
				'motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-1/2 data-[state=open]:slide-in-from-bottom-1/2',
				'fixed top-[50%] left-[50%] z-50 grid w-[calc(100%-1rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] shadow-lg',
				'border-base-200 bg-base-100 dark:border-base-700 dark:bg-base-800 gap-4 rounded-2xl border p-6 backdrop-blur-xl',
				className
			)}
		>
			{@render children?.()}

			{#if closeButton}
				<Dialog.Close
					class="text-base-900 dark:text-base-500 hover:text-base-800 dark:hover:text-base-200 hover:bg-base-200 dark:hover:bg-base-800 focus:outline-base-900 dark:focus:outline-base-50 focus:bg-base-200 dark:focus:bg-base-800 focus:text-base-800 dark:focus:text-base-200 absolute top-2 right-2 cursor-pointer rounded-xl p-1 transition-colors focus:outline-2 focus:outline-offset-2"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="size-4"
					>
						<path
							fill-rule="evenodd"
							d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
							clip-rule="evenodd"
						/>
					</svg>

					<span class="sr-only">Close</span>
				</Dialog.Close>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
