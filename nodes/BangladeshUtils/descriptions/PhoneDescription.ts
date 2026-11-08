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
		displayOptions: { show },
	},
	{
		displayName: 'Output Format',
		name: 'phoneFormat',
		type: 'options',
		default: 'e164',
		description: 'How the normalized number is written',
		displayOptions: { show: { resource: ['phone'], operation: ['normalize'] } },
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
];
