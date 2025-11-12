<script lang="ts">
	import { rocq } from '$lib/notebook/widgets/rocq/language-coq';
	import type { RocqWidgetValue } from '$lib/notebook/widgets/rocq/structure';
	import type { WidgetProps } from '$lib/notebook/widgets/types';
	import CodeMirror from 'svelte-codemirror-editor';

	let { value, onNodeValueUpdate, setAnchorNode }: WidgetProps<RocqWidgetValue> = $props();
</script>

<CodeMirror
	lang={rocq()}
	bind:value={
		() => value.value, (new_value) => onNodeValueUpdate(value, { ...value, value: new_value })
	}
/>
