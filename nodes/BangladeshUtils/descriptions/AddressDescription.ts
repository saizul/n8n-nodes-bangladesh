import type { INodeProperties } from 'n8n-workflow';

import { DIVISIONS } from '../lib/address';

const show = { resource: ['address'] };

export const addressOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'List Districts',
				value: 'listDistricts',
				description: 'List the 64 districts, optionally for a single division',
				action: 'List districts of Bangladesh',
			},
			{
				name: 'List Divisions',
				value: 'listDivisions',
				description: 'List the 8 divisions with their district counts',
				action: 'List divisions of Bangladesh',
			},
			{
				name: 'Lookup District',
				value: 'lookupDistrict',
				description: 'Find the division of a district by its English or Bangla name',
				action: 'Look up the division of a district',
			},
		],
		default: 'lookupDistrict',
	},
];

export const addressFields: INodeProperties[] = [
	{
		displayName: 'District Name',
		name: 'districtName',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'Cumilla',
		description:
			'English or Bangla district name. Case, spaces and common old spellings (Comilla, Chittagong, Jessore, Bogra) are handled.',
		displayOptions: { show: { resource: ['address'], operation: ['lookupDistrict'] } },
	},
	{
		displayName: 'Division',
		name: 'divisionFilter',
		type: 'options',
		default: 'all',
		description: 'Only list districts of this division',
		displayOptions: { show: { resource: ['address'], operation: ['listDistricts'] } },
		options: [
			{ name: 'All Divisions', value: 'all' },
			...DIVISIONS.map((division) => ({
				name: `${division.name} (${division.nameBn})`,
				value: division.name,
			})),
		],
	},
	{
		displayName: 'Output',
		name: 'listOutput',
		type: 'options',
		default: 'items',
		description: 'How the list is returned',
		displayOptions: {
			show: { resource: ['address'], operation: ['listDistricts', 'listDivisions'] },
		},
		options: [
			{
				name: 'One Item per Entry',
				value: 'items',
				description: 'Every division or district becomes its own item',
			},
			{
				name: 'Single Item With Array',
				value: 'single',
				description: 'One item with the whole list in a "results" field',
			},
		],
	},
];
