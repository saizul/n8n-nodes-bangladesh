import type { INodeProperties } from 'n8n-workflow';

import { BANGLA_MONTHS } from '../lib/date';

const show = { resource: ['date'] };

export const dateOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'From Bangla Date',
				value: 'fromBanglaDate',
				description: 'Convert a Bangla calendar date back to the Gregorian calendar',
				action: 'Convert a Bangla date to Gregorian',
			},
			{
				name: 'To Bangla Date',
				value: 'toBanglaDate',
				description: 'Convert a Gregorian date to the revised Bangladesh calendar',
				action: 'Convert a date to the Bangla calendar',
			},
		],
		default: 'toBanglaDate',
	},
];

export const dateFields: INodeProperties[] = [
	{
		displayName: 'Date',
		name: 'dateValue',
		type: 'string',
		default: '',
		placeholder: '2024-04-14',
		description:
			'ISO date or date-time (Bangla digits are fine). Leave empty to use the current time. Dates without a time zone are used as written; ones with a zone are converted to the offset below.',
		displayOptions: { show: { resource: ['date'], operation: ['toBanglaDate'] } },
	},
	{
		displayName: 'Time Zone Offset (Minutes)',
		name: 'timezoneOffset',
		type: 'number',
		typeOptions: { minValue: -720, maxValue: 840 },
		default: 360,
		description:
			'Offset from UTC used for "now" and for date-times that carry a zone. 360 is Bangladesh Standard Time (UTC+6).',
		displayOptions: { show: { resource: ['date'], operation: ['toBanglaDate'] } },
	},
	{
		displayName: 'Bangla Year',
		name: 'banglaYear',
		type: 'number',
		typeOptions: { minValue: 407, maxValue: 9000 },
		default: 1431,
		required: true,
		description: 'Bangla year in ASCII digits, for example 1431',
		displayOptions: { show: { resource: ['date'], operation: ['fromBanglaDate'] } },
	},
	{
		displayName: 'Bangla Month',
		name: 'banglaMonth',
		type: 'options',
		default: 1,
		description:
			'Bangla month. Boishakh to Ashwin have 31 days, Kartik to Magh and Choitro 30, Falgun 29 or 30.',
		displayOptions: { show: { resource: ['date'], operation: ['fromBanglaDate'] } },
		options: BANGLA_MONTHS.map((month, index) => ({
			name: `${month.name} (${month.nameBn})`,
			value: index + 1,
		})),
	},
	{
		displayName: 'Bangla Day',
		name: 'banglaDay',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 31 },
		default: 1,
		description: 'Day of the Bangla month',
		displayOptions: { show: { resource: ['date'], operation: ['fromBanglaDate'] } },
	},
];
