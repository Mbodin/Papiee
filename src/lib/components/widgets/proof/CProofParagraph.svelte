<script lang="ts">
	import { slide } from 'svelte/transition';
	import CProofParagraph from './CProofParagraph.svelte';
	import type { ProofParagraph } from '$lib/notebook/widgets/proof/raw/Paragraph.svelte';
	import CProofCell from './CProofCell.svelte';

	let { pparagraph = $bindable() }: { pparagraph: ProofParagraph | undefined } = $props();

	let children = $derived(pparagraph?._paragraph_children() || []);

	let has_children = $derived(children.length > 0);
	// Do not edit to replace my-1 and my-2 by flex-gap, it breaks the transition:slide animation !
</script>

{#if pparagraph}
	{#if has_children}
		<div class="relative">
			<button
				class="absolute right-10 rounded-md hover:bg-gray-200"
				onclick={() => (pparagraph.collasped = !pparagraph.collasped)}
			>
				<div class="flex h-10 w-10 flex-col items-center justify-center">
					{#if pparagraph.collasped}
						<svg viewBox="0 0 16 16" class="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg"
							><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
								id="SVGRepo_tracerCarrier"
								stroke-linecap="round"
								stroke-linejoin="round"
							></g><g id="SVGRepo_iconCarrier">
								<path d="M0 10L8 2L16 10V12H0V10Z" fill="#000000"></path>
							</g></svg
						>
					{:else}
						<svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg"
							><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
								id="SVGRepo_tracerCarrier"
								stroke-linecap="round"
								stroke-linejoin="round"
							></g><g id="SVGRepo_iconCarrier">
								<path
									fill-rule="evenodd"
									clip-rule="evenodd"
									d="M7.00003 8.5C6.59557 8.5 6.23093 8.74364 6.07615 9.11732C5.92137 9.49099 6.00692 9.92111 6.29292 10.2071L11.2929 15.2071C11.6834 15.5976 12.3166 15.5976 12.7071 15.2071L17.7071 10.2071C17.9931 9.92111 18.0787 9.49099 17.9239 9.11732C17.7691 8.74364 17.4045 8.5 17 8.5H7.00003Z"
									fill="#000000"
								></path>
							</g></svg
						>
					{/if}
				</div>
			</button>
		</div>
	{/if}
	<div class="my-1 flex flex-row flex-wrap gap-1">
		{#each pparagraph.value as _, i}
			<CProofCell bind:pcell={pparagraph.value[i]} />
		{/each}
	</div>
	{#if !pparagraph.collasped}
		<div transition:slide={has_children ? { duration: 400 } : undefined}>
			<div class="my-2 ml-5">
				{#if has_children}
					<div class="flex flex-col flex-nowrap border-l-2 border-black pl-3">
						{#each children as pp}
							<CProofParagraph bind:pparagraph={pparagraph.parent.parent.value[pp.parent.index]} />
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
{/if}
