<script lang="ts">
	import RichEditInput from '$lib/components/RichEditInput.svelte';
	import TestProseMirror from '$lib/components/RichEditInput.svelte';
	import type { RichInputPosition } from '$lib/RichEditInput';

	let position: RichInputPosition | undefined = $state();
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<TestProseMirror bind:position />

<button
	class="bg-blue-500"
	onclick={() => {
		position = undefined;
	}}>Test</button
>
