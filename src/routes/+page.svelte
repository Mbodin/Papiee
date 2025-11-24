<script lang="ts">
	import { fromTextualToTree } from '$lib/cnl/tree';
	import { onMount } from 'svelte';

	onMount(() => {
		let document = `ligne1\n\tligne2\n\tligne3\n\t\tligne4\n\tligne5\nligne6`;
		console.log(JSON.stringify(fromTextualToTree(document), undefined, 1));
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
