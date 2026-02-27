@preprocessor typescript
@{%
export type Specification = {
	type: 'specification';
	header: SpecificationHeader;
	content: SpecificationContent;
	footer: SpecificationFooter;
};

export type StateFilter = string[] | '*';
export type SpecificationHeader = { type: 'header'; states?: StateFilter };
export type SpecificationFooter = {
	type: 'footer';
	structure?: StructureSpecification;
	actions: StateAction[];
};

export type SpecificationContent = SpecificationContentNode[];
export type SpecificationContentNode = Reference | Text | Iteration | Either;
export type Reference = { type: 'reference'; value: string };
export type Text = { type: 'text'; value: string };
export type Iteration = { type: 'iteration'; content: SpecificationContent };
export type Either = { type: 'either'; contents: SpecificationContent[] }; // Each branch shall contain exactly the same references, and that there shall be at least two branches.

export type StateAction = StateActionPop | StateActionPush;
export type StateActionPop = { type: 'state_action'; action: 'pop' };
export type StateActionPush = { type: 'state_action'; action: 'push'; value: string };

export type StructureSpecification =
	| StructureSpecificationEndOfLine
	| StructureSpecificationEndOfParagraph
	| StructureSpecificationBeginOfParagraph;

export type StructureSpecificationEndOfLine = {
	type: 'footer_structure_action';
	specification: 'end_of_line';
};

export type StructureSpecificationEndOfParagraph = {
	type: 'footer_structure_action';
	specification: 'end_of_paragraph';
};

export type StructureSpecificationBeginOfParagraph = {
	type: 'footer_structure_action';
	specification: 'begin_of_paragraph';
};

export function get_references(c: SpecificationContent): Reference[] {
	return c.flatMap(v => {
		switch (v.type) {
			case 'text':
				return [] ;
			case 'reference':
				return [v] ;
			case 'iteration':
				return get_references(v.content) ;
			case 'either':
				return get_references (v.contents[0]) ; // By construction, all branches will have the same references.
			default:
				throw new Error(`${v as any} is unknown`);
		}
	}) ;
}

function specification(
	_header: SpecificationHeader,
	content: SpecificationContent,
	_footer: SpecificationFooter
): Specification {
	return { type: 'specification', header: _header, content, footer: _footer };
}

function text(value: string): Text {
	return { type: 'text', value };
}

function reference(value: string): Reference {
	return { type: 'reference', value };
}

function iteration(content: SpecificationContent): Iteration {
	return { type: 'iteration', content };
}

function either(contents: SpecificationContent[]): Either {
	if(contents.length <= 1) throw new Error(`At least two branches are expected`);
	const r0 = get_references(contents[0]).sort() ;
	if(!contents.every(c => {
		const r2 = get_references(c).sort() ;
		if (r0.length !== r2.length) return false ;
		for (let i = 0; i < r0.length; i++) {
      if (r0[i] !== r2[i]) return false ;
    }
		return true ;
	})) throw new Error(`Mismatch references`);

	return { type: 'either', contents };
}

function header(states: StateFilter): SpecificationHeader {
	return { type: 'header', states };
}

function footer(
	structure_specification: StructureSpecification,
	state_actions: StateAction[]
): SpecificationFooter {
	return { type: 'footer', structure: structure_specification, actions: state_actions };
}

function pop(): StateActionPop {
	return { type: 'state_action', action: 'pop' };
}

function push(value: string): StateActionPush {
	return { type: 'state_action', action: 'push', value };
}

function footer_structure_specification_endofline(): StructureSpecificationEndOfLine {
	return { type: 'footer_structure_action', specification: 'end_of_line' };
}

function footer_structure_specification_endofparagraph(): StructureSpecificationEndOfParagraph {
	return { type: 'footer_structure_action', specification: 'end_of_paragraph' };
}

function footer_structure_specification_beginofparagraph(): StructureSpecificationBeginOfParagraph {
	return { type: 'footer_structure_action', specification: 'begin_of_paragraph' };
}
%}

main -> specification
{% d => d[0] %}

specification -> "{" header "|" content "|" footer "}"
{% d => specification(d[1], d[3], d[5]) %}

header -> (header_states | "*"):?
{% d => header(d.flat().filter(Boolean)[0]) %}

footer -> footer_structure_action footer_state_actions
{% d => footer(d[0], d[1]) %}

footer_state_actions -> (footer_pop | footer_push):*
{% d => d[0].flat(Infinity) %}

footer_pop -> "-"
{% d => pop() %}

footer_push -> "+" word
{% d => push(d[1]) %}

footer_structure_action -> (footer_endofline | footer_beginparagraph | footer_endparagraph):?
{% d => d.flat()[0] %}

footer_endofline -> "#"
{% d => footer_structure_specification_endofline() %}

footer_beginparagraph -> ">"
{% d => footer_structure_specification_beginofparagraph() %}

footer_endparagraph -> "<"
{% d => footer_structure_specification_endofparagraph() %}

header_states -> (word " "):* word
{% d => d[0].map((v: any) => v[0]).flat().concat(d[1]) %}

content -> text:? (interactive text):* interactive:?
{% d => d.flat(Infinity).filter(Boolean) %}

text -> ([^|] | "\\|"):+
{% d => text(d[0].map((v: string) => v[0] === "\\|" ? "|" : v[0]).join("")) %}

interactive -> reference | iteration
{% d => d %}

reference -> "|" word "|"
{% d => reference(d[1]) %}

word -> [a-zA-Z0-9_]:+
{% d => d[0].join("") %}

iteration -> "|(|" content ("||" content):* "|)" (null | "*" | "+") "|"
{% d => {
	const c = d[2] ? either([d[1], ...d[2]]) : d[1] ;
	switch (d[4]){
		case null: return c ;
		case "*": return iteration(c) ;
		case "+": return [c, iteration(c)] ;
		default: assert(false) ;
	}
} %}

