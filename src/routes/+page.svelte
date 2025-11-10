<script lang="ts">
	import nearley from 'nearley';
	import '$lib/cnl/tactics';
	import { onMount } from 'svelte';

	import { createTacticFromTextual } from '$lib/cnl/cnl_tactic';
	import { parse } from '$lib/cnl/textual';
	import { command_parsechunk } from '$lib/notebook/widgets/proof/chunk';
	import { EditorState } from 'prosemirror-state';
	const { Grammar, Parser } = nearley;

	// onMount(() => {
	// 	createTacticFromTextual(undefined, '{|Case disjunction.|>+case_disjunction}', () => '');
	// 	createTacticFromTextual(undefined, '{case_disjunction||<-}', () => '');
	// 	createTacticFromTextual(undefined, '{case_disjunction|End|<-}', () => '');
	// 	createTacticFromTextual(undefined, '{case_disjunction|Case |a|.|#}', () => '');
	// 	createTacticFromTextual(undefined, '{|Test|}', () => '');
	// 	let document = `Case disjunction. Test Test`;

	// 	const node = parse(document);
	// 	const state = new EditorState();
	// 	state.doc = node;
	// 	command_parsechunk(state, (o) => {
	// 		console.log(o.doc);
	// 	});
	// });
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
