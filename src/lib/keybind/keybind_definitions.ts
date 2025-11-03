import { $keyfilter, type KeybindLevel } from './keybind';

export const CellKeybindDefinition = {
	insert_new_line_after: [$keyfilter('Enter')('-selected_completion')],
	move_before: [$keyfilter('ArrowLeft')('+start_input', '-selected_completion')],
	move_after: [$keyfilter('ArrowRight')('+end_input', '-selected_completion')],
	delete: [$keyfilter('Delete')('+end_input', '+start_input')],
	indent_increase: [$keyfilter('+')('+first_cell_of_paragraph', '+shift', '+ctrl')],
	indent_decrease: [$keyfilter('-')('+first_cell_of_paragraph', '+shift', '+ctrl')],
	selected_completion_up: [$keyfilter('ArrowUp')('_selected_completion')],
	selected_completion_down: [$keyfilter('ArrowDown')('_selected_completion')],
	selected_completion_complete: [$keyfilter('Enter')('+selected_completion')]
} as const;

export const KeyBindDefinitionByLevel = {
	cell: CellKeybindDefinition
} as const;

export function filters<U extends KeybindLevel>(level: U): (typeof KeyBindDefinitionByLevel)[U] {
	return KeyBindDefinitionByLevel[level];
}
