import type { CnlPosition } from '../tree';

export type Range = {
	parent: CnlPosition;
	startOffset: number;
	endOffset: number;
};

/**
 * A range is collapsed if the {@link Range.startOffset} is the same as the {@link Range.endOffset}
 * @param range
 * @returns true if this range is collapsed
 */
export function isRangeCollapsed(range: Range): boolean {
	if (range.endOffset === range.startOffset) return true;
	return false;
}

/**
 * Use a {@link CnlPosition} and a value to generate a range that should return true using {@link isRangeCollapsed}
 * @param path the path to generate the range with
 * @param value the value to be the {@link Range.startOffset} and {@link Range.endOffset}
 * @returns 
 */
export function collapsedRange(path: CnlPosition, value: number): Range {
	return { parent: path, startOffset: value, endOffset: value };
}

/**
 * Construct a range from the parameter
 * @param position the range position
 * @param startOffset the range start offset
 * @param endOffset the range end offset
 * @returns a range with the parameters as properties
 */
export function linePosition(position: CnlPosition, startOffset: number, endOffset: number): Range {
	return { parent: position, startOffset, endOffset };
}
