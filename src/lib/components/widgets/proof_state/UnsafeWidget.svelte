<script lang="ts">
	import { proof_state_value } from '$lib/notebook/widgets/proof_state/state.svelte';
	import ProofStateWidget from './ProofStateWidget.svelte';
</script>

{#if proof_state_value.value && proof_state_value.value.chunks && proof_state_value.value.chunks[proof_state_value.value.position]}
	<ProofStateWidget {...proof_state_value.value} />
{/if}
