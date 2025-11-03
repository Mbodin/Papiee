import { filters, KeyBindDefinitionByLevel } from '$lib/keybind/keybind_definitions';
import type { ExpandType } from '../type';

export type TriggerFilter = boolean | 'ignore';

export interface KeyFilter {
	ctrl?: TriggerFilter;
	shift?: TriggerFilter;
	main_key: string;
}

export type KeybindLevel = 'cell';

export type KeyFiltersByLevel = {
	[key in KeybindLevel]: ExpandType<
		{
			cell: {
				start_input?: TriggerFilter;
				end_input?: TriggerFilter;
				first_cell_of_paragraph?: TriggerFilter;
				selected_completion?: TriggerFilter;
			};
		}[key] &
			KeyFilter
	>;
};

export type CellKeyFilter = KeyFiltersByLevel['cell'];

export type Keybind<level extends KeybindLevel> = { [x in string]: KeyFiltersByLevel[level][] };

export type CellKeyBind = Keybind<'cell'>;

export type Keys<U extends KeybindLevel> = Extract<
	keyof Omit<KeyFiltersByLevel[U], 'main_key'>,
	string
>;
export type Masks<U extends KeybindLevel> = `-${Keys<U>}` | `_${Keys<U>}` | `+${Keys<U>}`;
export function $keyfilter<U extends KeybindLevel>(
	main_key: string
): (...masks: Masks<U>[]) => KeyFiltersByLevel[U] {
	return (...masks) => {
		const filter: KeyFiltersByLevel[U] = { main_key };
		masks.forEach((m) => {
			const state: TriggerFilter = m.at(0) === '-' ? false : m.at(0) === '+' ? true : 'ignore';
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(filter as any)[m.substring(1)] = state;
		});
		return filter;
	};
}

export interface TextFocusable {
	focusAt(direction: 'begin' | 'end'): void;
}
type Actions<T extends string | number | symbol> = {
	[key in T]: () => void;
};

export type KeybindActions<L extends KeybindLevel> = Actions<
	keyof (typeof KeyBindDefinitionByLevel)[L]
>;

export abstract class KeybindingListener<L extends KeybindLevel> {
	abstract level: L;

	abstract custom_filter(): Omit<KeyFiltersByLevel[L], keyof KeyFilter>;

	state_filter(state: KeyFiltersByLevel[L], filter: KeyFiltersByLevel[L]) {
		return (
			Object.entries(filter).filter(([id, id_state]) => {
				const state_state: boolean = id in state ? (state as any)[id] : false;
				const filter_need: TriggerFilter = id_state as TriggerFilter;
				if (filter_need === 'ignore') return false;
				return filter_need !== state_state;
			}).length === 0
		);
	}

	trigger_state(event: KeyboardEvent): KeyFiltersByLevel[L] {
		const filter: KeyFilter = {
			main_key: event.key,
			ctrl: event.ctrlKey,
			shift: event.shiftKey
		};

		const c_filter = this.custom_filter();

		return { ...filter, ...c_filter };
	}

	listen(event: KeyboardEvent) {
		if (event.defaultPrevented) return;
		const state = this.trigger_state(event);

		const level_filter = filters(this.level);
		for (const [id, filters] of Object.entries(level_filter)) {
			if (filters.find((v) => this.state_filter(state, v))) {
				if (id in this) {
					const fn = (this as any)[id];
					if (typeof fn === 'function') {
						if ((fn as Function).apply(this) === false) {
							continue;
						}
					} else console.log('Action is present but is not a function', id);
				} else console.log('Missing action function', id);
			} else continue;
			event.preventDefault();
			return;
		}
	}
}
