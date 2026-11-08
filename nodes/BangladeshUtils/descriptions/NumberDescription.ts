import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['number'] };

const languageOptions = [
	{ name: 'Bangla', value: 'bn' },
	{ name: 'English', value: 'en' },
];

export const numberOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'Convert Digits',
				value: 'convertDigits',
				description: 'Switch between Bangla (০-৯) and English (0-9) digits inside any text',
				action: 'Convert digits between Bangla and English',
			},
			{
				name: 'Format (Lakh/Crore)',
				value: 'format',
				description: 'Group digits the South Asian way, for example 12,34,567.50',
				action: 'Format a number with lakh and crore grouping',
			},
			{
				name: 'Taka Amount in Words',
				value: 'takaToWords',
				description: 'Write an amount as on a cheque, with Taka, Paisa and মাত্র / Only',
				action: 'Write a taka amount in words',
			},
			{
				name: 'To Words',
				value: 'toWords',
				description: 'Spell a number in Bangla or English words',
				action: 'Convert a number to words',
			},
		],
		default: 'toWords',
	},
];

export const numberFields: INodeProperties[] = [
	{
		displayName: 'Number',
		name: 'numberValue',
		type: 'string',
		default: '',
		required: true,
		placeholder: '1234567.50',
		description:
			'The number or amount. Commas, a leading ৳ or Tk, and Bangla digits are accepted. Up to 15 integer digits. Passed as text to avoid rounding errors.',
		displayOptions: {
			show: { resource: ['number'], operation: ['toWords', 'takaToWords', 'format'] },
		},
	},
	{
		displayName: 'Language',
		name: 'numberLanguage',
		type: 'options',
		options: languageOptions,
		default: 'bn',
		description: 'Language of the words',
		displayOptions: { show: { resource: ['number'], operation: ['toWords', 'takaToWords'] } },
	},
	{
		displayName: 'Include Paisa',
		name: 'includePaisa',
		type: 'boolean',
		default: true,
		description:
			'Whether to spell out the paisa part. If off, the amount is rounded to whole Taka.',
		displayOptions: { show: { resource: ['number'], operation: ['takaToWords'] } },
	},
	{
		displayName: 'Add "মাত্র" / "Only"',
		name: 'appendSuffix',
		type: 'boolean',
		default: true,
		description: 'Whether to end the amount with মাত্র (Bangla) or Only (English)',
		displayOptions: { show: { resource: ['number'], operation: ['takaToWords'] } },
	},
	{
		displayName: 'Decimal Places',
		name: 'decimalPlaces',
		type: 'number',
		typeOptions: { minValue: -1, maxValue: 20 },
		default: -1,
		description: 'Fixed number of decimals (rounded half up). Use -1 to keep the input as written.',
		displayOptions: { show: { resource: ['number'], operation: ['format'] } },
	},
	{
		displayName: 'Grouping',
		name: 'groupingStyle',
		type: 'options',
		default: 'southAsian',
		description: 'How the integer digits are grouped',
		displayOptions: { show: { resource: ['number'], operation: ['format'] } },
		options: [
			{ name: 'International (1,234,567)', value: 'international' },
			{ name: 'Lakh/Crore (12,34,567)', value: 'southAsian' },
		],
	},
	{
		displayName: 'Output Digits',
		name: 'outputDigits',
		type: 'options',
		default: 'english',
		description: 'Which digit script to write the result in',
		displayOptions: { show: { resource: ['number'], operation: ['format'] } },
		options: [
			{ name: 'Bangla (০-৯)', value: 'bangla' },
			{ name: 'English (0-9)', value: 'english' },
		],
	},
	{
		displayName: 'Group Separator',
		name: 'groupSeparator',
		type: 'string',
		default: ',',
		description: 'Character placed between digit groups',
		displayOptions: { show: { resource: ['number'], operation: ['format'] } },
	},
	{
		displayName: 'Prefix',
		name: 'numberPrefix',
		type: 'string',
		default: '',
		placeholder: '৳ ',
		description: 'Text placed in front of the number, for example the Taka sign ৳',
		displayOptions: { show: { resource: ['number'], operation: ['format'] } },
	},
	{
		displayName: 'Suffix',
		name: 'numberSuffix',
		type: 'string',
		default: '',
		placeholder: ' টাকা',
		description: 'Text placed after the number',
		displayOptions: { show: { resource: ['number'], operation: ['format'] } },
	},
	{
		displayName: 'Text',
		name: 'digitText',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		required: true,
		description: 'Text in which the digits are converted. Letters and punctuation stay unchanged.',
		displayOptions: { show: { resource: ['number'], operation: ['convertDigits'] } },
	},
	{
		displayName: 'Direction',
		name: 'digitDirection',
		type: 'options',
		default: 'toBangla',
		description: 'Which way to convert',
		displayOptions: { show: { resource: ['number'], operation: ['convertDigits'] } },
		options: [
			{ name: 'English to Bangla (0-9 to ০-৯)', value: 'toBangla' },
			{ name: 'Bangla to English (০-৯ to 0-9)', value: 'toEnglish' },
		],
	},
];
