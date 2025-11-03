<script lang="ts">
	import RichEditInput from '$lib/components/RichEditInput.svelte';
	import type { ProofCell } from '$lib/notebook/widgets/proof/raw/Cell.svelte';

	let { pcell = $bindable() }: { pcell: ProofCell | undefined } = $props();

	$effect(() => {
		if (!pcell) return;

		const current_position = pcell.position.value;

		pcell.position = {
			get value() {
				return composite_input ? composite_input.getPosition() : -1;
			},
			set value(v) {
				composite_input?.setPosition(v);
				focused = v !== -1;
			}
		};
		pcell.length = {
			get value() {
				return composite_input ? composite_input.getLength() : -1;
			}
		};

		if (current_position !== -1) pcell.position.value = current_position;
	});

	let focused = $state(false);
</script>

{#if pcell}
	<div
		class="flex w-fit flex-col rounded-sm border-2 border-dashed border-black"
		role="cell"
		tabindex={pcell.parent.index}
	>
		<RichEditInput bind:value={pcell.value} />
	</div>
{/if}
