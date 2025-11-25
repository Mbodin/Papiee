import { createTacticFromTextual } from './cnl_tactic';

// const COMMENT = createTacticFromTextual<{ comment: string }>(
// 	'Comment',
// 	'{*|(|comment|)|}',
// 	({ value }) => `(*${value.comment}.*)`
// );

/**
 * For testing purpose we define crude tactics the looks like rocq tactics
 */

/**
 * r : reasoning
 * end : the goal is supposedly empty
 */

const START = createTacticFromTextual<{}>('start', '{START||-+reasoning}', ({}) => '');

const ADMITTED = createTacticFromTextual<{}>('admitted', '{reasoning||-+end}', ({}) => 'admitted.');

const DESTRUCTION = createTacticFromTextual<{ identifier: string }>(
	'destruction',
	'{reasoning|destruct |identifier|.|>+destruction}',
	({ value }) => `destruct ${value.identifier}.\n`
);

const DESTRUCT_ITEM = createTacticFromTextual<{}>(
	'destruct_item',
	'{destruction|-|+reasoning}',
	({ value }) => ``
);

const DESTRUCT_ITEM_END = createTacticFromTextual<{}>(
	'destruct_item_end',
	'{destruction end||#-}',
	({ value }) => ``
);

const DESTRUCTION_END = createTacticFromTextual<{}>(
	'destruction_end',
	'{destruction||--+end}',
	() => ''
);

const REWRITE_LEFT = createTacticFromTextual<{ rewrite: string }>(
	'rewrite_left',
	'{reasoning|rewrite < |rewrite|.|}',
	({ value }) => `rewrite < ${value.rewrite}.`
);

const REWRITE_RIGHT = createTacticFromTextual<{ rewrite: string }>(
	'rewrite_right',
	'{reasoning|rewrite > |rewrite|.|}',
	({ value }) => `rewrite < ${value.rewrite}.`
);

const REFLEXIVITY = createTacticFromTextual<{}>(
	'rewrite_right',
	'{reasoning|reflexivity.|-+end}',
	({ value }) => `reflexivity.`
);

const APPLY = createTacticFromTextual<{ apply: string }>(
	'apply',
	'{reasoning|apply |apply|.|}',
	({ value }) => `apply ${value.apply}.`
);

const INTROS = createTacticFromTextual<{ identifier: string }>(
	'intros',
	'{reasoning|intros |identifier|.|}',
	({ value }) => `intros ${value.identifier}.`
);

const SIMPL = createTacticFromTextual<{}>('simpl', '{reasoning|simpl.|}', () => `simpl.`);

const LEFT = createTacticFromTextual<{}>('left', '{reasoning|left.|}', () => `left.`);

const RIGHT = createTacticFromTextual<{}>('right', '{reasoning|right.|}', () => `right.`);
