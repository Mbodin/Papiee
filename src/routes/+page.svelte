<script lang="ts">
	import { predict } from '$lib/cnl/prediction';
	import { fromTextualToTree } from '$lib/cnl/tree';
	import { onMount } from 'svelte';

	import '$lib/cnl/tactics';

	onMount(() => {
		console.log(predict('', ['START']));
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
