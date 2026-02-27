<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import Notebook from '$lib/components/Notebook.svelte';
	import type { NotebookState } from '$lib/notebook/structure';
	import { PROOF_NODE } from '$lib/notebook/nodes/proof/structure';
	import { ROCQ_NODE } from '$lib/notebook/nodes/rocq/structure';
	import { QUESTION_NODE } from '$lib/notebook/nodes/question/structure';
	import { onMount } from 'svelte';

	let node = QUESTION_NODE.initial();

	onMount(() => {
		let text = "Soient $(u_{n}) \\in \\mathbb{R}^{\\mathbb{N}}$ et $q \\in \\mathbb{R}$.\n" ;
		text += "Supposons que $\\forall n \\in \\mathbb{N}, u_{n+1} = q \\times u_{n}$.\n" ;
		text += "On procède par récurrence.\n" ;
		text += "\t$On a q^{0} \\times u_{0} = 1 \\times u_{0} = u_{0}$.\n"
		text += "\tOn suppose par récurrence $\\exists n_{0} \\in \\mathbb{N}$, $u_{n_{0}} = q^{n_{0}} \\times u_{0}$.\n" ;
		text += "\tMontrons que $u_{n_{0} +1} = q^{n_{0} +1} \\times u_{0}$. "
		text += "On a $u_{n_{0} +1} = q \\times u_{n_{0}} = q\\times \\left( q^{n_{0}} \\times u_{0}\\right) = q^{n_{0} +1} \\times u_{0}$.\n" ;
		text += "Par récurrence on a bien $\\forall n\\in \\mathbb{N}, u_{n} =q^{n} \\times u_{0}$.";
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
