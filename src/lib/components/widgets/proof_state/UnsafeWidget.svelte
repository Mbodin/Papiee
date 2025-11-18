<script lang="ts">
	import { proof_state_value } from '$lib/notebook/widgets/proof_state/state.svelte';
	import ProofStateWidget from './ProofStateWidget.svelte';
</script>

{#if proof_state_value.value}
	<ProofStateWidget {...proof_state_value.value} />
{/if}
