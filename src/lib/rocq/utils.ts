import type { Position } from 'vscode-languageserver-protocol';

export function positionAfterString(value: string): Position {
	const line_number = value.includes('\n') ? value.split('\n').length : 0;
	const last_line = value.includes('\n') ? value.substring(value.lastIndexOf('\n') + 1) : value;
	return {
		line: line_number,
		character: last_line.length
	};
}

export function addPosition(pos1: Position, pos2: Position): Position {
	if (pos2.line === 0) return { line: pos1.line, character: pos1.character + pos1.character };
	return {
		line: pos1.line + pos2.line,
		character: pos2.character
	};
}
