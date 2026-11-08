import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { allProperties } from './descriptions';
import { runOperation } from './execute';

export const bangladeshUtilsDescription: INodeTypeDescription = {
	displayName: 'Bangladesh Utils',
	name: 'bangladeshUtils',
	icon: 'file:bangladeshUtils.svg',
	group: ['transform'],
	version: 1,
	subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
	description:
		'Phone numbers, Taka amounts, Bangla numerals and dates, slugs, divisions and districts for Bangladesh',
	defaults: { name: 'Bangladesh Utils' },
	usableAsTool: true,
	inputs: [NodeConnectionTypes.Main],
	outputs: [NodeConnectionTypes.Main],
	properties: allProperties,
};

export class BangladeshUtils implements INodeType {
	description: INodeTypeDescription = bangladeshUtilsDescription;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const options = this.getNodeParameter('options', i, {}) as IDataObject;
				const base: IDataObject = options.includeInputFields ? { ...items[i].json } : {};

				const result = runOperation(this, resource, operation, i);
				const records = Array.isArray(result) ? result : [result];

				for (const record of records) {
					returnData.push({ json: { ...base, ...record }, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error instanceof Error ? error.message : String(error) },
						pairedItem: { item: i },
					});
					continue;
				}
				if (error instanceof NodeOperationError) throw error;
				throw new NodeOperationError(
					this.getNode(),
					error instanceof Error ? error : new Error(String(error)),
					{ itemIndex: i },
				);
			}
		}

		return [returnData];
	}
}
