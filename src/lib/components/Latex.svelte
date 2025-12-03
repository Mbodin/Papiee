<script lang="ts">
	import 'mathlive';
	import type { MathfieldElement, MathfieldElementAttributes } from 'mathlive';
	import { on } from 'svelte/events';

	type Props = { value: string } & Partial<MathfieldElementAttributes>;

	let { value, ...rest }: Props = $props();

	const init = (node: MathfieldElement) => {
		$effect(() => {
			if (value) node.value = value;
		});
		$effect(() => {
			return on(node, 'input', () => {
				value = node.value;
			});
		});
	};
</script>

<math-field read-only style="display:inline-block" use:init {...rest}></math-field>

<style>
	math-field:focus-within {
		outline: none;
		background: rgba(200, 200, 255, 0.2);
	}

	math-field::part(container) {
		padding: 0px !important;
		--_contains-highlight-background-color: unset;
	}

	math-field::part(container) {
		padding: 0px !important;
	}

	math-field::part(content) {
		padding: 0px !important;
	}

	math-field::part(virtual-keyboard-toggle) {
		display: none;
	}
	math-field::part(menu-toggle) {
		display: none;
	}
</style>
