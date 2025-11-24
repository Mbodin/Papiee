import type { CnlPosition } from '../tree';

export type Range = {
	parent: CnlPosition;
	startOffset: number;
	endOffset: number;
};

export function collapsedRange(path: CnlPosition, value: number): Range {
	return { parent: path, startOffset: value, endOffset: value };
}

export function isRangeCollapsed(range: Range): boolean {
	if (range.endOffset === range.startOffset) return true;
	return false;
}

export function linePosition(position: CnlPosition, startOffset: number, endOffset: number): Range {
	return { parent: position, startOffset, endOffset };
}
