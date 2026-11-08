import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['text'] };

export const textOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'Count Graphemes',
				value: 'countGraphemes',
				description: 'Count characters the way a reader sees them (conjuncts count as one)',
				action: 'Count Bangla graphemes',
			},
			{
				name: 'Slugify (Bangla to Latin)',
				value: 'slugify',
				description: 'Make a URL-friendly Latin slug from Bangla text (phonetic, approximate)',
				action: 'Create a slug from Bangla text',
			},
			{
				name: 'Transliterate',
				value: 'transliterate',
				description: 'Convert Bangla text to Latin letters (phonetic, approximate)',
				action: 'Transliterate Bangla text to Latin',
			},
		],
		default: 'slugify',
	},
];

export const textFields: INodeProperties[] = [
	{
		displayName: 'Text',
		name: 'textValue',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		required: true,
		placeholder: 'আমার সোনার বাংলা',
		description: 'Bangla text, or mixed Bangla and Latin text',
		displayOptions: { show },
	},
	{
		displayName: 'Separator',
		name: 'slugSeparator',
		type: 'options',
		default: '-',
		description: 'Character placed between words in the slug',
		displayOptions: { show: { resource: ['text'], operation: ['slugify'] } },
		options: [
			{ name: 'Dash (-)', value: '-' },
			{ name: 'None', value: '' },
			{ name: 'Underscore (_)', value: '_' },
		],
	},
	{
		displayName: 'Maximum Length',
		name: 'slugMaxLength',
		type: 'number',
		typeOptions: { minValue: 0 },
		default: 0,
		description: 'Cut the slug to this many characters. 0 means no limit.',
		displayOptions: { show: { resource: ['text'], operation: ['slugify'] } },
	},
];
