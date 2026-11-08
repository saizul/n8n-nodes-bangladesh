import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { INodeProperties } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';

import {
	BangladeshUtils,
	bangladeshUtilsDescription,
} from '../nodes/BangladeshUtils/BangladeshUtils.node';

const root = join(__dirname, '..');
const properties = bangladeshUtilsDescription.properties;
const nodeDir = join(root, 'nodes', 'BangladeshUtils');

const operationsByResource: Record<string, string[]> = {
	phone: ['validate', 'normalize', 'detectOperator', 'mask', 'whatsappLink'],
	number: ['toWords', 'takaToWords', 'format', 'convertDigits'],
	date: ['toBanglaDate', 'fromBanglaDate'],
	text: ['slugify', 'transliterate', 'countGraphemes'],
	address: ['listDivisions', 'listDistricts', 'lookupDistrict'],
};

function optionValues(property: INodeProperties): unknown[] {
	return (property.options ?? []).map((o) => ('value' in o ? o.value : undefined));
}

describe('node description', () => {
	it('has the expected identity', () => {
		expect(bangladeshUtilsDescription.displayName).toBe('Bangladesh Utils');
		expect(bangladeshUtilsDescription.name).toBe('bangladeshUtils');
		expect(bangladeshUtilsDescription.version).toBe(1);
		expect(bangladeshUtilsDescription.group).toEqual(['transform']);
		expect(bangladeshUtilsDescription.inputs).toEqual(['main']);
		expect(bangladeshUtilsDescription.outputs).toEqual(['main']);
		expect(bangladeshUtilsDescription.usableAsTool).toBe(true);
		expect(bangladeshUtilsDescription.credentials).toBeUndefined();
		expect(bangladeshUtilsDescription.description.length).toBeGreaterThan(20);
	});

	it('is exposed through the node class', () => {
		expect(new BangladeshUtils().description).toBe(bangladeshUtilsDescription);
		expect(typeof new BangladeshUtils().execute).toBe('function');
	});

	it('references an icon that exists', () => {
		const icon = bangladeshUtilsDescription.icon;
		expect(icon).toBe('file:bangladeshUtils.svg');
		expect(existsSync(join(nodeDir, 'bangladeshUtils.svg'))).toBe(true);
		expect(readFileSync(join(nodeDir, 'bangladeshUtils.svg'), 'utf8')).toContain('<svg');
	});

	it('has a codex file', () => {
		const codex = JSON.parse(readFileSync(join(nodeDir, 'BangladeshUtils.node.json'), 'utf8'));
		expect(codex.node).toContain('bangladeshUtils');
		expect(codex.categories).toContain('Utility');
	});

	it('offers the five resources', () => {
		const resource = properties.find((p) => p.name === 'resource');
		expect(resource).toBeDefined();
		expect(resource?.noDataExpression).toBe(true);
		expect(optionValues(resource!).sort()).toEqual(Object.keys(operationsByResource).sort());
		expect(resource?.default).toBe('phone');
	});

	it.each(Object.entries(operationsByResource))(
		'%s offers the expected operations',
		(resource, operations) => {
			const operationProperty = properties.find(
				(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes(resource),
			);
			expect(operationProperty).toBeDefined();
			expect(operationProperty?.noDataExpression).toBe(true);
			expect([...optionValues(operationProperty!)].sort()).toEqual([...operations].sort());
			expect(operations).toContain(operationProperty?.default);
			for (const option of operationProperty!.options ?? []) {
				expect((option as { action?: string }).action, `${resource}: ${option.name}`).toBeTruthy();
				expect((option as { description?: string }).description).toBeTruthy();
			}
		},
	);

	it('has well formed parameters', () => {
		for (const property of properties) {
			expect(property.displayName, property.name).toBeTruthy();
			expect(property.name).toMatch(/^[a-z][A-Za-z0-9]*$/);
			expect(property.type).toBeTruthy();
			expect(property.default, property.name).not.toBeUndefined();
			if (!['resource', 'operation', 'options'].includes(property.name)) {
				expect(property.description, `${property.name} needs a description`).toBeTruthy();
			}
		}
	});

	it('only reuses a parameter name where the display conditions cannot overlap', () => {
		const seen = new Map<string, INodeProperties>();
		for (const property of properties) {
			const previous = seen.get(property.name);
			if (previous) {
				expect(property.name).toBe('operation');
				const a = previous.displayOptions?.show?.resource ?? [];
				const b = property.displayOptions?.show?.resource ?? [];
				expect(a.filter((r) => b.includes(r))).toEqual([]);
			}
			seen.set(property.name, property);
		}
	});

	it('only shows fields for existing resources and operations', () => {
		for (const property of properties) {
			const show = property.displayOptions?.show;
			if (!show) continue;
			for (const resource of show.resource ?? []) {
				expect(Object.keys(operationsByResource)).toContain(resource);
				for (const operation of show.operation ?? []) {
					if ((show.resource ?? []).length === 1) {
						expect(operationsByResource[resource as string], property.name).toContain(operation);
					}
				}
			}
		}
	});

	it('hides every field behind a resource, apart from the shared options', () => {
		for (const property of properties) {
			if (property.name === 'resource' || property.name === 'options') continue;
			expect(property.displayOptions?.show?.resource, property.name).toBeDefined();
		}
	});

	it('requires the main input parameter of every operation', () => {
		const required = [
			'phoneNumber',
			'numberValue',
			'digitText',
			'textValue',
			'districtName',
			'banglaYear',
		];
		for (const name of required) {
			expect(properties.find((p) => p.name === name)?.required, name).toBe(true);
		}
	});

	it('offers the lakh/crore and Bangla digit choices', () => {
		const grouping = properties.find((p) => p.name === 'groupingStyle');
		expect(optionValues(grouping!)).toEqual(['international', 'southAsian']);
		const language = properties.find((p) => p.name === 'numberLanguage');
		expect(optionValues(language!)).toEqual(['bn', 'en']);
		const month = properties.find((p) => p.name === 'banglaMonth');
		expect(month?.options).toHaveLength(12);
	});

	it('has an include-input-fields option', () => {
		const options = properties.find((p) => p.name === 'options');
		expect(options?.type).toBe('collection');
		expect(JSON.stringify(options?.options)).toContain('includeInputFields');
	});
});

describe('package.json', () => {
	const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

	it('follows the community node conventions', () => {
		expect(pkg.name).toBe('n8n-nodes-bangladesh');
		expect(pkg.keywords).toContain('n8n-community-node-package');
		expect(pkg.license).toBe('MIT');
		expect(pkg.author.name).toBe('Saizul Amin');
		expect(pkg.peerDependencies['n8n-workflow']).toBeDefined();
		expect(pkg.dependencies).toBeUndefined();
		expect(pkg.n8n.n8nNodesApiVersion).toBe(1);
		expect(pkg.n8n.nodes).toEqual(['dist/nodes/BangladeshUtils/BangladeshUtils.node.js']);
		expect(pkg.files).toEqual(['dist']);
	});

	it('points at a source file for every listed node', () => {
		for (const node of pkg.n8n.nodes as string[]) {
			const source = node.replace(/^dist\//, '').replace(/\.js$/, '.ts');
			expect(existsSync(join(root, source)), source).toBe(true);
		}
	});
});
