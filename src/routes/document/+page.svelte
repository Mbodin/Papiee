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
		let markdown = "On pose $A_n = n × (2n + 1) × (7n + 1)$.\n" ;
		markdown += "Montrer que pour tout $n$, $A_n$ est divisible par $3$." ;
		node.children.markdown_header.value = markdown ;

		let rocq = "Definition A_ (n : nat) := n \\times (2 \\times n + 1) \\times (7 \\times n + 1).\n" ;
		rocq += "Lemma A_6 : \\forall n \\in \\mathbb{N}, \\exists a \\in \\mathbb{N}, A_ n = 3 \\times a.\n" ;
		rocq += "Proof.\n"
		node.children.rocq_header.value = rocq ;

		let proof = "Montrons que $\\forall n \\in \\mathbb{N}, \\exists k \\in \\mathbb{N}, A_ n = 3 \\times k$.\n" ;
		proof += "Soit $n \\in \\mathbb{N}$.\n" ;
		proof += "On distingue les cas suivants.\n" ;
		proof += "\t- Si $n \\bmod 3 = 0$. Il existe alors $k \\in \\mathbb{N}$ tel que $n = 3 \\times k$. Alors $A_ n = 3 \\times (k \\times (2 \\times n + 1) \\times (7 \\times n + 1))$.\n" ;
		proof += "\t- Si $n \\bmod 3 = 1$. Il existe alors $k \\in \\mathbb{N}$ tel que $n = 3 \\times k + 1$. Alors $2 \\times n + 1 = 3 \\times (2 \\times k + 1)$. Alors $A_ n = 3 \\times (n \\times (2 \\times k + 1) \\times (7 \\times n + 1)).$\n" ;
		proof += "\t- Si $n \\bmod 3 = 2$. Il existe alors $k \\in \\mathbb{N}$ tel que $n = 3 \\times k + 2$. Alors $7 \\times n + 1 = 3 \\times (7 \\times k + 5)$. Alors $A_ n = 3 \\times (n \\times (2 \\times n + 1) \\times (7 \\times k + 5)).$\n" ;
		proof += "Ce qu'il fallait démontrer.\n" ;
		node.children.cnl_proof.value = proof ;
	});

	let notebook_state: NotebookState = $state({
		children: [node],
		title: "Exemple d'analyse de cas"
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
