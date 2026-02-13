<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import Notebook from '$lib/components/Notebook.svelte';
	import type { NotebookState } from '$lib/notebook/structure';
	import { PROOF_NODE } from '$lib/notebook/nodes/proof/structure';
	import { ROCQ_NODE } from '$lib/notebook/nodes/rocq/structure';
	import { QUESTION_NODE } from '$lib/notebook/nodes/question/structure';
	import { onMount } from 'svelte';

	const text = `Soit $(u_{n}) \\in \\mathbb{R}^{\\mathbb{N}}$, $q \\in \\mathbb{R}$.
Supposons que : $\\forall n \\in \\mathbb{N}, u_{n+1} = q \\times u_{n}$
On procède par récurrence.
\t$q^{0} \\times u_{0} = 1 \\times u_{0} =u_{0}$
\tOn suppose par récurrence : $\\exists n_{0} \\in \\mathbb{N}$, $u_{n_{0}} = q^{n_{0}} \\times u_{0}$.\n\tMontrons que $u_{n_{0} +1} = q^{n_{0} +1} \\times u_{0}$. On a que : $u_{n_{0} +1} = q \\times u_{n_{0}} = q\\times \\left( q^{n_{0}} \\times u_{0}\\right) = q^{n_{0} +1} \\times u_{0}$. Par récurrence on a bien que $\\forall n\\in \\mathbb{N}, u_{n} =q^{n} \\times u_{0}$. `;

	let node = QUESTION_NODE.initial();

	onMount(() => {
		node.children.cnl_proof.value = text;
	});

	let notebook_state: NotebookState = $state({
		children: [node],
		title: ''
	});

	let teacher_viewing = $state(true);
</script>

<div class="mx-auto h-fit w-9/12">
	<Notebook bind:notebook_state mode={teacher_viewing ? 'teacher' : 'student'} />
	<button
		class="btn preset-filled-primary-600-400"
		onclick={() => (teacher_viewing = !teacher_viewing)}>{m.switch_mode()}</button
	>
</div>
