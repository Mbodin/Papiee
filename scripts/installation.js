import { execSync } from 'child_process';
import * as fs from 'fs';
import unzipper from 'unzipper';

console.log('Starting installation.js ...');

console.log('Generating src/lib/cnl/cnl_tactic_specifier.ts from grammar file ...');
execSync('nearleyc src/lib/cnl/cnl_tactic_specifier.ne -o src/lib/cnl/cnl_tactic_specifier.ts');
console.log('Generation done \n');

if (!fs.existsSync('static/worker_artifact.zip')) {
	console.log(
		'File /static/worker_artifact.zip does not exist, download it from github and place it there.'
	);
	console.log(
		'(https://github.com/ejgallego/rocq-lsp/actions/runs/19231026459/artifacts/4518852242)'
	);
} else {
	console.log('File static/worker_artifact.zip exists, no need to download it');
}

if (!fs.existsSync('static/worker_artifact/')) {
	console.log('Trying to unzip worker_artifact.zip ...');

	await new Promise((resolve, rejects) =>
		fs
			.createReadStream('static/worker_artifact.zip')
			.pipe(unzipper.Extract({ path: 'static/worker_artifact' }))
			.on('close', () => resolve())
			.on('error', () => rejects())
	);
	console.log('Zip file was extracted !');
} else {
	console.log('Zip file is already extracted');
}

if (!fs.existsSync('static/wasm-bin')) {
	console.log('Copying wasm bin file from unzipped worker_artifact ...');

	await fs.promises.cp('static/worker_artifact/wasm-bin', 'static/wasm-bin', { recursive: true });
	console.log('Files were copied');
}

console.log('Installation done, it should work now !');

console.log('Creating a dump file containing rocq/**.v files.');

const files = fs
	.readdirSync('rocq')
	.filter((v) => v.endsWith('.v'))
	.map((name) => 'rocq/' + name);
const object = Object.fromEntries(
	files.map((path) => [path.substring('rocq/'.length), String(fs.readFileSync(path))])
);
fs.writeFileSync('rocq/rocq.json', JSON.stringify({ files: object }, undefined, 1));
