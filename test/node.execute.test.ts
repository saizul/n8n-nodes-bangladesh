import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';

import { BangladeshUtils } from '../nodes/BangladeshUtils/BangladeshUtils.node';

type Params = Record<string, unknown>;

function context(inputs: Array<{ json: IDataObject; params: Params }>, continueOnFail = false) {
	const ctx = {
		getInputData: () => inputs.map((i) => ({ json: i.json })) as INodeExecutionData[],
		getNodeParameter: (name: string, index: number, fallback?: unknown) => {
			const value = inputs[index].params[name];
			if (value !== undefined) return value;
			if (fallback !== undefined) return fallback;
			throw new Error(`Missing parameter ${name}`);
		},
		getNode: () => ({ name: 'Bangladesh Utils', type: 'bangladeshUtils', typeVersion: 1 }),
		continueOnFail: () => continueOnFail,
	};
	return ctx as unknown as IExecuteFunctions;
}

async function run(params: Params, json: IDataObject = {}, continueOnFail = false) {
	const node = new BangladeshUtils();
	const [out] = await node.execute.call(context([{ json, params }], continueOnFail));
	return out;
}

describe('execute: successful operations', () => {
	it.each([
		[
			'phone validate',
			{ resource: 'phone', operation: 'validate', phoneNumber: '+৮৮০ ১৭১২-৩৪৫৬৭৮' },
			{ valid: true, e164: '+8801712345678', local: '01712345678', operator: 'Grameenphone' },
		],
		[
			'phone validate (invalid)',
			{ resource: 'phone', operation: 'validate', phoneNumber: '01212345678' },
			{ valid: false, reason: 'invalid_prefix', e164: null, operator: null },
		],
		[
			'phone normalize',
			{
				resource: 'phone',
				operation: 'normalize',
				phoneNumber: '01712345678',
				phoneFormat: 'international',
			},
			{ normalized: '+880 1712 345678' },
		],
		[
			'phone operator',
			{ resource: 'phone', operation: 'detectOperator', phoneNumber: '01912345678' },
			{ operator: 'Banglalink', operatorBn: 'বাংলালিংক', prefix: '019' },
		],
		[
			'phone mask',
			{ resource: 'phone', operation: 'mask', phoneNumber: '01712345678' },
			{ masked: '017******78' },
		],
		[
			'phone whatsapp',
			{
				resource: 'phone',
				operation: 'whatsappLink',
				phoneNumber: '01712345678',
				whatsappMessage: 'Hi',
			},
			{ whatsappLink: 'https://wa.me/8801712345678?text=Hi' },
		],
		[
			'number words',
			{ resource: 'number', operation: 'toWords', numberValue: '1234', numberLanguage: 'bn' },
			{ words: 'এক হাজার দুইশ চৌত্রিশ' },
		],
		[
			'taka words',
			{ resource: 'number', operation: 'takaToWords', numberValue: '1234.5', numberLanguage: 'en' },
			{ words: 'One Thousand Two Hundred Thirty Four Taka and Fifty Paisa Only' },
		],
		[
			'number format',
			{ resource: 'number', operation: 'format', numberValue: '1234567', decimalPlaces: 2 },
			{ formatted: '12,34,567.00' },
		],
		[
			'number format (keep decimals)',
			{
				resource: 'number',
				operation: 'format',
				numberValue: '1234567.5',
				decimalPlaces: -1,
				outputDigits: 'bangla',
			},
			{ formatted: '১২,৩৪,৫৬৭.৫' },
		],
		[
			'digits to Bangla',
			{
				resource: 'number',
				operation: 'convertDigits',
				digitText: 'Room 42',
				digitDirection: 'toBangla',
			},
			{ converted: 'Room ৪২' },
		],
		[
			'digits to English',
			{
				resource: 'number',
				operation: 'convertDigits',
				digitText: 'রুম ৪২',
				digitDirection: 'toEnglish',
			},
			{ converted: 'রুম 42' },
		],
		[
			'date to Bangla',
			{ resource: 'date', operation: 'toBanglaDate', dateValue: '2024-04-14' },
			{ year: 1431, month: 1, day: 1, monthNameBn: 'বৈশাখ', formattedBn: '১ বৈশাখ ১৪৩১' },
		],
		[
			'date from Bangla',
			{
				resource: 'date',
				operation: 'fromBanglaDate',
				banglaYear: 1431,
				banglaMonth: 9,
				banglaDay: 1,
			},
			{ gregorian: '2024-12-16', weekday: 'Monday' },
		],
		[
			'text slug',
			{ resource: 'text', operation: 'slugify', textValue: 'আমার সোনার বাংলা' },
			{ slug: 'amar-sonar-bangla' },
		],
		[
			'text normalize',
			{
				resource: 'text',
				operation: 'normalize',
				textValue: ' বাংলা\u200Bদেশ  ',
				keepJoiners: true,
				collapseWhitespace: true,
			},
			{ normalized: 'বাংলাদেশ', removed: 4 },
		],
		[
			'text transliterate',
			{ resource: 'text', operation: 'transliterate', textValue: 'ঢাকা' },
			{ transliterated: 'dhaka' },
		],
		[
			'text count',
			{ resource: 'text', operation: 'countGraphemes', textValue: 'বাংলা' },
			{ graphemes: 2, codePoints: 5 },
		],
		[
			'district lookup',
			{ resource: 'address', operation: 'lookupDistrict', districtName: 'Comilla' },
			{ found: true, district: 'Cumilla', division: 'Chattogram', divisionBn: 'চট্টগ্রাম' },
		],
		[
			'district lookup (missing)',
			{ resource: 'address', operation: 'lookupDistrict', districtName: 'Gotham' },
			{ found: false, division: null },
		],
	])('%s', async (_name, params, expected) => {
		const out = await run(params);
		expect(out).toHaveLength(1);
		expect(out[0].json).toMatchObject(expected);
		expect(out[0].pairedItem).toEqual({ item: 0 });
	});
});

describe('execute: lists', () => {
	it('returns one item per division', async () => {
		const out = await run({ resource: 'address', operation: 'listDivisions' });
		expect(out).toHaveLength(8);
		expect(out.every((o) => o.pairedItem && (o.pairedItem as { item: number }).item === 0)).toBe(
			true,
		);
		expect(out[2].json).toMatchObject({ name: 'Dhaka', nameBn: 'ঢাকা', districtCount: 13 });
	});

	it('returns 64 districts', async () => {
		const out = await run({ resource: 'address', operation: 'listDistricts' });
		expect(out).toHaveLength(64);
	});

	it('filters districts by division', async () => {
		const out = await run({
			resource: 'address',
			operation: 'listDistricts',
			divisionFilter: 'Sylhet',
		});
		expect(out.map((o) => o.json.name)).toEqual(['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet']);
	});

	it('can return a single item with an array', async () => {
		const out = await run({
			resource: 'address',
			operation: 'listDistricts',
			listOutput: 'single',
		});
		expect(out).toHaveLength(1);
		expect(out[0].json.count).toBe(64);
		expect(out[0].json.results).toHaveLength(64);
	});
});

describe('execute: item handling', () => {
	it('keeps input fields only when asked', async () => {
		const params = { resource: 'phone', operation: 'mask', phoneNumber: '01712345678' };
		const without = await run(params, { id: 7 });
		expect(without[0].json.id).toBeUndefined();
		const withInput = await run({ ...params, options: { includeInputFields: true } }, { id: 7 });
		expect(withInput[0].json).toMatchObject({ id: 7, masked: '017******78' });
	});

	it('pairs every output with its input item', async () => {
		const node = new BangladeshUtils();
		const inputs = ['01712345678', '01912345678', '01512345678'].map((phoneNumber) => ({
			json: {},
			params: { resource: 'phone', operation: 'detectOperator', phoneNumber },
		}));
		const [out] = await node.execute.call(context(inputs));
		expect(out.map((o) => o.json.operator)).toEqual(['Grameenphone', 'Banglalink', 'Teletalk']);
		expect(out.map((o) => (o.pairedItem as { item: number }).item)).toEqual([0, 1, 2]);
	});

	it('throws a NodeOperationError for bad input by default', async () => {
		const params = { resource: 'phone', operation: 'mask', phoneNumber: 'nope' };
		await expect(run(params)).rejects.toBeInstanceOf(NodeOperationError);
		await expect(run(params)).rejects.toThrow(/not a valid Bangladeshi mobile number/);
	});

	it('reports the item index in the error', async () => {
		const node = new BangladeshUtils();
		const inputs = [
			{ json: {}, params: { resource: 'number', operation: 'toWords', numberValue: '1' } },
			{ json: {}, params: { resource: 'number', operation: 'toWords', numberValue: 'x' } },
		];
		await expect(node.execute.call(context(inputs))).rejects.toMatchObject({
			context: { itemIndex: 1 },
		});
	});

	it('continues on fail and keeps the order', async () => {
		const node = new BangladeshUtils();
		const inputs = ['01712345678', 'bad', '01812345678'].map((phoneNumber) => ({
			json: {},
			params: { resource: 'phone', operation: 'detectOperator', phoneNumber },
		}));
		const [out] = await node.execute.call(context(inputs, true));
		expect(out).toHaveLength(3);
		expect(out[0].json.operator).toBe('Grameenphone');
		expect(out[1].json.error).toMatch(/not a valid Bangladeshi mobile number/);
		expect(out[1].pairedItem).toEqual({ item: 1 });
		expect(out[2].json.operator).toBe('Robi');
	});

	it('rejects unsupported operations', async () => {
		await expect(run({ resource: 'phone', operation: 'teleport' })).rejects.toThrow(
			/not supported/,
		);
	});

	it('returns an empty output for no input items', async () => {
		const node = new BangladeshUtils();
		const [out] = await node.execute.call(context([]));
		expect(out).toEqual([]);
	});
});
