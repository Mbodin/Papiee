<script lang="ts">
	import nearley from 'nearley';
	import '$lib/cnl/tactics';
	import { onMount } from 'svelte';

	import { createTacticFromTextual } from '$lib/cnl/cnl_tactic';
	import { parse_cnl_chained } from '$lib/cnl/parser';
	const { Grammar, Parser } = nearley;

	onMount(() => {
		const T1 = createTacticFromTextual<{ comment: string }>(
			undefined,
			'{a b c|t1|--}',
			({ value }) => `(*${value.comment}.*)`
		);

		const T2 = createTacticFromTextual<{ comment: string }>(
			undefined,
			'{|t2|+a+b}',
			({ value }) => `(*${value.comment}.*)`
		);

		const T3 = createTacticFromTextual<{ comment: string }>(
			undefined,
			'{a b|t3|+c}',
			({ value }) => `(*${value.comment}.*)`
		);

		console.log(parse_cnl_chained('t2t3t1', []));
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
