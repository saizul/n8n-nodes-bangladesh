import type { INodeProperties } from 'n8n-workflow';

import { addressFields, addressOperations } from './AddressDescription';
import { dateFields, dateOperations } from './DateDescription';
import { numberFields, numberOperations } from './NumberDescription';
import { phoneFields, phoneOperations } from './PhoneDescription';
import { textFields, textOperations } from './TextDescription';

export const resourceProperty: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{ name: 'Address', value: 'address' },
		{ name: 'Date', value: 'date' },
		{ name: 'Number', value: 'number' },
		{ name: 'Phone', value: 'phone' },
		{ name: 'Text', value: 'text' },
	],
	default: 'phone',
};

export const commonOptions: INodeProperties = {
	displayName: 'Options',
	name: 'options',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	options: [
		{
			displayName: 'Include Input Fields',
			name: 'includeInputFields',
			type: 'boolean',
			default: false,
			description:
				'Whether to copy the fields of the incoming item into the output. Result fields win on name clashes.',
		},
	],
};

export const allProperties: INodeProperties[] = [
	resourceProperty,
	...phoneOperations,
	...numberOperations,
	...dateOperations,
	...textOperations,
	...addressOperations,
	...phoneFields,
	...numberFields,
	...dateFields,
	...textFields,
	...addressFields,
	commonOptions,
];
