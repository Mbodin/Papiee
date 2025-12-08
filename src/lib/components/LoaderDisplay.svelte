<script lang="ts" module>
	import { m } from '$lib/paraglide/messages';
	import { Progress, Slider } from '@skeletonlabs/skeleton-svelte';
	import { untrack } from 'svelte';
	export type Step = {
		key: string;
		points: number;
	};

	export type LoaderState = {
		step_i: number;
		point: number;
	};

	export function compareStepsState(a: LoaderState, b: LoaderState) {
		return b.step_i - a.step_i === 0 ? b.point - a.point : b.step_i - a.step_i;
	}
</script>

<script lang="ts">
	let {
		label,
		steps,
		state: loader_state = $bindable({ step_i: 0, point: 0 }),
		displayed_state: debounced_state = $bindable({ step_i: 0, point: 0 })
	}: {
		label?: string;
		steps: Step[];
		state?: LoaderState;
		displayed_state?: LoaderState;
	} = $props();

	let debounced_step = $derived(steps[debounced_state.step_i]);

	let debounced_value = $derived(
		Math.min(100 * Math.max(debounced_state.point / Math.min(debounced_step.points, 1)), 100)
	);
	let debounced_message = $derived((m as any)[debounced_step.key as any]);

	let debouncing_task: NodeJS.Timeout | undefined = undefined;

	$effect(() => {
		const { point, step_i } = loader_state;

		let intermediary_steps = steps
			.map((v, step_i) =>
				Array.from({ length: v.points + 1 }).map(
					(_v, point) => ({ point, step_i }) satisfies LoaderState
				)
			)
			.flat()
			.filter(
				(v) =>
					compareStepsState(
						untrack(() => debounced_state),
						v
					) > 0 && compareStepsState(loader_state, v) <= 0
			);

		if (debouncing_task) clearInterval(debouncing_task);
		debouncing_task = undefined;

		if (intermediary_steps.length === 0) {
			debounced_state = { point, step_i };
		}

		if (
			intermediary_steps.length === 1 &&
			compareStepsState(intermediary_steps[0], debounced_state) === 0
		)
			return;

		let i = 0;
		setInterval(() => {
			if (i >= intermediary_steps.length) {
				clearInterval(debouncing_task);
				return;
			}
			debounced_state = intermediary_steps[i++];
		}, 200);
	});
</script>

<div class="flex flex-col gap-10 p-2">
	<h1 class="h5">{label}</h1>

	<Progress value={debounced_value} class="items-start gap-4">
		<Progress.Label class="text-sm">
			<h2 class="flex flex-row gap-2 h6">
				{debounced_message()}
				<div class="flex flex-row">
					<div class="animate-[bounce_1s_infinite_250ms]">.</div>
					<div class="animate-[bounce_1s_infinite_500ms]">.</div>
					<div class="animate-[bounce_1s_infinite_750ms]">.</div>
				</div>
			</h2></Progress.Label
		>
		<Progress.Track>
			<Progress.Range />
		</Progress.Track>
	</Progress>
</div>
