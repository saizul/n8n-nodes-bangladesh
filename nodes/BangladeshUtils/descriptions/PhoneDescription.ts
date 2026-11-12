import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['phone'] };

export const phoneOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'Detect Operator',
				value: 'detectOperator',
				description: 'Find the mobile operator from the number prefix (013 to 019)',
				action: 'Detect the operator of a phone number',
			},
			{
				name: 'Extract From Text',
				value: 'extract',
				description:
					'Find every Bangladeshi mobile number in a message, email or note, in English or Bangla digits',
				action: 'Extract phone numbers from text',
			},
			{
				name: 'Mask',
				value: 'mask',
				description: 'Hide the middle digits, for example 017******78',
				action: 'Mask a phone number',
			},
			{
				name: 'Normalize',
				value: 'normalize',
				description: 'Convert any common spelling of a number to E.164 or local format',
				action: 'Normalize a phone number',
			},
			{
				name: 'Validate',
				value: 'validate',
				description: 'Check whether the value is a valid Bangladeshi mobile number',
				action: 'Validate a phone number',
			},
			{
				name: 'WhatsApp Link',
				value: 'whatsappLink',
				description: 'Build a wa.me click-to-chat link, with an optional prefilled message',
				action: 'Create a WhatsApp link for a phone number',
			},
		],
		default: 'validate',
	},
];

export const phoneFields: INodeProperties[] = [
	{
		displayName: 'Phone Number',
		name: 'phoneNumber',
		type: 'string',
		default: '',
		required: true,
		placeholder: '01712-345678',
		description:
			'Bangladeshi mobile number. Accepts 01712345678, 8801712345678, +880 1712-345678, 008801712345678 and Bangla digits such as ০১৭১২৩৪৫৬৭৮',
		displayOptions: { show, hide: { operation: ['extract'] } },
	},
	{
		displayName: 'Text',
		name: 'phoneText',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		placeholder: 'Call 01712-345678 or +৮৮০ ১৯১২ ৩৪৫৬৭৮',
		description: 'Free text to search, for example an SMS, a form comment or an email body',
		displayOptions: { show: { resource: ['phone'], operation: ['extract'] } },
	},
	{
		displayName: 'Output Format',
		name: 'phoneFormat',
		type: 'options',
		default: 'e164',
		description: 'How the normalized number is written',
		displayOptions: { show: { resource: ['phone'], operation: ['normalize', 'extract'] } },
		options: [
			{ name: 'Digits Only (8801712345678)', value: 'digitsOnly' },
			{ name: 'E.164 (+8801712345678)', value: 'e164' },
			{ name: 'International Spaced (+880 1712 345678)', value: 'international' },
			{ name: 'Local (01712345678)', value: 'local' },
			{ name: 'Local Spaced (01712 345678)', value: 'localSpaced' },
		],
	},
	{
		displayName: 'Visible Digits at Start',
		name: 'visibleStart',
		type: 'number',
		typeOptions: { minValue: 0, maxValue: 10 },
		default: 3,
		description: 'How many leading digits stay visible. 3 keeps the operator prefix.',
		displayOptions: { show: { resource: ['phone'], operation: ['mask'] } },
	},
	{
		displayName: 'Visible Digits at End',
		name: 'visibleEnd',
		type: 'number',
		typeOptions: { minValue: 0, maxValue: 10 },
		default: 2,
		description: 'How many trailing digits stay visible',
		displayOptions: { show: { resource: ['phone'], operation: ['mask'] } },
	},
	{
		displayName: 'Mask Character',
		name: 'maskCharacter',
		type: 'string',
		default: '*',
		description: 'Character that replaces the hidden digits. Only the first character is used.',
		displayOptions: { show: { resource: ['phone'], operation: ['mask'] } },
	},
	{
		displayName: 'Message',
		name: 'whatsappMessage',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: 'Optional text that is prefilled in the chat. It is URL-encoded automatically.',
		displayOptions: { show: { resource: ['phone'], operation: ['whatsappLink'] } },
	},
	{
		displayName: 'Operators',
		name: 'operatorFilter',
		type: 'multiOptions',
		default: [],
		description: 'Only return numbers of these operators. Leave empty to return every operator.',
		displayOptions: { show: { resource: ['phone'], operation: ['extract'] } },
		options: [
			{ name: 'Banglalink (014, 019)', value: 'Banglalink' },
			{ name: 'Grameenphone (013, 017)', value: 'Grameenphone' },
			{ name: 'Robi (016, 018)', value: 'Robi' },
			{ name: 'Teletalk (015)', value: 'Teletalk' },
		],
	},
	{
		displayName: 'Remove Duplicates',
		name: 'uniqueNumbers',
		type: 'boolean',
		default: true,
		description:
			'Whether to keep only the first occurrence of a number, even when it is written differently',
		displayOptions: { show: { resource: ['phone'], operation: ['extract'] } },
	},
	{
		displayName: 'Output',
		name: 'extractOutput',
		type: 'options',
		default: 'single',
		description: 'How the numbers found are returned',
		displayOptions: { show: { resource: ['phone'], operation: ['extract'] } },
		options: [
			{
				name: 'One Item per Number',
				value: 'items',
				description: 'Every number becomes its own item. Text without numbers returns no item.',
			},
			{
				name: 'Single Item With Array',
				value: 'single',
				description: 'One item with "count", "numbers" and the details in "results"',
			},
		],
	},
];
