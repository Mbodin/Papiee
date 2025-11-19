<script lang="ts">
	import nearley from 'nearley';
	import '$lib/cnl/tactics';
	import { onMount } from 'svelte';

	import { parse } from '$lib/cnl/textual';
	import { parsechunks } from '$lib/notebook/nodes/proof/chunk';
	import { EditorState } from 'prosemirror-state';
	const { Grammar, Parser } = nearley;

	onMount(() => {
		let document = `           reflexivity.`.trim();

		const node = parse(document);
		const state = new EditorState();
		state.doc = node;
		console.log('='.repeat(20));
		const result = parsechunks(node, ['reasoning']);
		console.log(result.state);
		result.chunks.forEach((v) => console.log(v));
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
