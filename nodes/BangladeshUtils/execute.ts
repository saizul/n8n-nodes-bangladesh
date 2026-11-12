import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import {
	banglaToGregorian,
	countText,
	detectOperator,
	extractPhones,
	formatNumber,
	formatPhone,
	listDistricts,
	listDivisions,
	lookupDistrict,
	maskPhone,
	numberToWords,
	parsePhone,
	normalizeText,
	OPERATORS,
	slugify,
	takaToWords,
	toBanglaDate,
	toBanglaDigits,
	toEnglishDigits,
	transliterate,
	whatsappLink,
} from './lib';
import type { Language, PhoneFormat } from './lib';

export type OperationResult = IDataObject | IDataObject[];

function listResult(items: IDataObject[], mode: string): OperationResult {
	return mode === 'single' ? { count: items.length, results: items } : items;
}

function isKnownOperator(name: string): boolean {
	return Object.values(OPERATORS).some((operator) => operator.name === name);
}

/** Run one operation for one input item. Pure library calls only, no network access. */
export function runOperation(
	ctx: IExecuteFunctions,
	resource: string,
	operation: string,
	i: number,
): OperationResult {
	switch (`${resource}.${operation}`) {
		case 'phone.validate': {
			const input = ctx.getNodeParameter('phoneNumber', i, '') as string;
			const parsed = parsePhone(input);
			return {
				input,
				valid: parsed.valid,
				reason: parsed.reason,
				e164: parsed.valid ? formatPhone(input, 'e164') : null,
				local: parsed.national,
				operator: parsed.operator?.name ?? null,
				operatorBn: parsed.operator?.nameBn ?? null,
			};
		}
		case 'phone.normalize': {
			const input = ctx.getNodeParameter('phoneNumber', i, '') as string;
			const format = ctx.getNodeParameter('phoneFormat', i, 'e164') as PhoneFormat;
			return { input, normalized: formatPhone(input, format), format };
		}
		case 'phone.detectOperator': {
			const input = ctx.getNodeParameter('phoneNumber', i, '') as string;
			const operator = detectOperator(input);
			return {
				input,
				local: formatPhone(input, 'local'),
				e164: formatPhone(input, 'e164'),
				prefix: operator.prefix,
				operator: operator.name,
				operatorBn: operator.nameBn,
				operatorShortName: operator.shortName,
			};
		}
		case 'phone.extract': {
			const text = ctx.getNodeParameter('phoneText', i, '') as string;
			const format = ctx.getNodeParameter('phoneFormat', i, 'e164') as PhoneFormat;
			const operators = ctx.getNodeParameter('operatorFilter', i, []) as string[];
			const mode = ctx.getNodeParameter('extractOutput', i, 'single') as string;
			const unknown = operators.filter((name) => !isKnownOperator(name));
			if (unknown.length > 0) throw new Error(`Unknown operator filter: ${unknown.join(', ')}`);
			const found = extractPhones(text, {
				format,
				unique: ctx.getNodeParameter('uniqueNumbers', i, true) as boolean,
				prefixes: Object.values(OPERATORS)
					.filter((operator) => operators.includes(operator.name))
					.map((operator) => operator.prefix),
			});
			const results: IDataObject[] = found.map((phone) => ({
				number: phone.number,
				local: phone.local,
				match: phone.match,
				index: phone.index,
				operator: phone.operator.name,
				operatorBn: phone.operator.nameBn,
				operatorShortName: phone.operator.shortName,
			}));
			if (mode === 'items') return results;
			return { count: results.length, numbers: results.map((r) => r.number), format, results };
		}
		case 'phone.mask': {
			const input = ctx.getNodeParameter('phoneNumber', i, '') as string;
			const masked = maskPhone(input, {
				visibleStart: ctx.getNodeParameter('visibleStart', i, 3) as number,
				visibleEnd: ctx.getNodeParameter('visibleEnd', i, 2) as number,
				maskChar: ctx.getNodeParameter('maskCharacter', i, '*') as string,
			});
			return { input, masked };
		}
		case 'phone.whatsappLink': {
			const input = ctx.getNodeParameter('phoneNumber', i, '') as string;
			const message = ctx.getNodeParameter('whatsappMessage', i, '') as string;
			return {
				input,
				e164: formatPhone(input, 'e164'),
				whatsappLink: whatsappLink(input, message),
			};
		}

		case 'number.toWords': {
			const input = ctx.getNodeParameter('numberValue', i, '') as string;
			const language = ctx.getNodeParameter('numberLanguage', i, 'bn') as Language;
			return { input, language, words: numberToWords(input, language) };
		}
		case 'number.takaToWords': {
			const input = ctx.getNodeParameter('numberValue', i, '') as string;
			const language = ctx.getNodeParameter('numberLanguage', i, 'bn') as Language;
			const words = takaToWords(input, {
				language,
				includePaisa: ctx.getNodeParameter('includePaisa', i, true) as boolean,
				suffix: ctx.getNodeParameter('appendSuffix', i, true) as boolean,
			});
			return { input, language, words };
		}
		case 'number.format': {
			const input = ctx.getNodeParameter('numberValue', i, '') as string;
			const places = ctx.getNodeParameter('decimalPlaces', i, -1) as number;
			const formatted = formatNumber(input, {
				decimals: places < 0 ? undefined : places,
				grouping: ctx.getNodeParameter('groupingStyle', i, 'southAsian') as
					'southAsian' | 'international',
				digits: ctx.getNodeParameter('outputDigits', i, 'english') as 'english' | 'bangla',
				separator: ctx.getNodeParameter('groupSeparator', i, ',') as string,
				prefix: ctx.getNodeParameter('numberPrefix', i, '') as string,
				suffix: ctx.getNodeParameter('numberSuffix', i, '') as string,
			});
			return { input, formatted };
		}
		case 'number.convertDigits': {
			const input = ctx.getNodeParameter('digitText', i, '') as string;
			const direction = ctx.getNodeParameter('digitDirection', i, 'toBangla') as string;
			return {
				input,
				direction,
				converted: direction === 'toEnglish' ? toEnglishDigits(input) : toBanglaDigits(input),
			};
		}

		case 'date.toBanglaDate': {
			const input = ctx.getNodeParameter('dateValue', i, '') as string;
			const offset = ctx.getNodeParameter('timezoneOffset', i, 360) as number;
			return { ...toBanglaDate(input, offset) };
		}
		case 'date.fromBanglaDate': {
			const year = ctx.getNodeParameter('banglaYear', i) as number;
			const month = ctx.getNodeParameter('banglaMonth', i) as number;
			const day = ctx.getNodeParameter('banglaDay', i) as number;
			const gregorian = banglaToGregorian(year, month, day);
			const bangla = toBanglaDate(gregorian.iso);
			return {
				banglaYear: year,
				banglaMonth: month,
				banglaDay: day,
				gregorian: gregorian.iso,
				weekday: bangla.weekday,
				weekdayBn: bangla.weekdayBn,
				formatted: bangla.formatted,
				formattedBn: bangla.formattedBn,
			};
		}

		case 'text.slugify': {
			const input = ctx.getNodeParameter('textValue', i, '') as string;
			const slug = slugify(input, {
				separator: ctx.getNodeParameter('slugSeparator', i, '-') as string,
				maxLength: ctx.getNodeParameter('slugMaxLength', i, 0) as number,
			});
			return { input, slug };
		}
		case 'text.normalize': {
			const input = ctx.getNodeParameter('textValue', i, '') as string;
			const normalized = normalizeText(input, {
				keepJoiners: ctx.getNodeParameter('keepJoiners', i, true) as boolean,
				collapseWhitespace: ctx.getNodeParameter('collapseWhitespace', i, false) as boolean,
			});
			return { input, normalized, removed: input.length - normalized.length };
		}
		case 'text.transliterate': {
			const input = ctx.getNodeParameter('textValue', i, '') as string;
			return { input, transliterated: transliterate(input) };
		}
		case 'text.countGraphemes': {
			const input = ctx.getNodeParameter('textValue', i, '') as string;
			return { input, ...countText(input) };
		}

		case 'address.listDivisions': {
			const mode = ctx.getNodeParameter('listOutput', i, 'items') as string;
			return listResult(listDivisions() as unknown as IDataObject[], mode);
		}
		case 'address.listDistricts': {
			const mode = ctx.getNodeParameter('listOutput', i, 'items') as string;
			const division = ctx.getNodeParameter('divisionFilter', i, 'all') as string;
			return listResult(listDistricts(division) as unknown as IDataObject[], mode);
		}
		case 'address.lookupDistrict': {
			const query = ctx.getNodeParameter('districtName', i, '') as string;
			const district = lookupDistrict(query);
			return district
				? {
						query,
						found: true,
						district: district.name,
						districtBn: district.nameBn,
						division: district.division,
						divisionBn: district.divisionBn,
					}
				: {
						query,
						found: false,
						district: null,
						districtBn: null,
						division: null,
						divisionBn: null,
					};
		}
		default:
			throw new Error(`The operation "${operation}" is not supported for resource "${resource}"`);
	}
}
