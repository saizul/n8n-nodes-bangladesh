import { toBanglaDigits, toEnglishDigits } from './digits';

export type Language = 'bn' | 'en';

export interface Decimal {
	negative: boolean;
	integer: bigint;
	/** Fraction digits without the dot ("" when there is none). */
	fraction: string;
}

const MAX_INTEGER_DIGITS = 15;

/** Parse numbers and strings such as "১২,৩৪,৫৬৭.৫০", "৳ 1,500", "-42" without floating point. */
export function parseDecimal(input: string | number | bigint): Decimal {
	let text: string;
	if (typeof input === 'number') {
		if (!Number.isFinite(input)) throw new Error('The number is not finite');
		text = String(input);
		if (/e/i.test(text)) {
			throw new Error('Numbers in exponent notation are not supported, pass the value as a string');
		}
	} else {
		text = String(input);
	}
	text = toEnglishDigits(text)
		.trim()
		.replace(/^(?:৳|tk\.?|bdt)\s*/i, '')
		.replace(/[,\s_]/g, '');
	let negative = false;
	if (text.startsWith('-')) {
		negative = true;
		text = text.slice(1);
	} else if (text.startsWith('+')) {
		text = text.slice(1);
	}
	const match = /^(\d*)(?:\.(\d*))?$/.exec(text);
	if (!match || (match[1] === '' && !match[2])) {
		throw new Error(`"${String(input)}" is not a valid number`);
	}
	const integerDigits = (match[1] || '0').replace(/^0+(?=\d)/, '');
	if (integerDigits.length > MAX_INTEGER_DIGITS) {
		throw new Error(`The number is too large (more than ${MAX_INTEGER_DIGITS} integer digits)`);
	}
	const fraction = match[2] ?? '';
	const integer = BigInt(integerDigits);
	const isZero = integer === 0n && /^0*$/.test(fraction);
	return { negative: negative && !isZero, integer, fraction };
}

/** Round half away from zero to a fixed number of decimal places using exact arithmetic. */
export function roundDecimal(value: Decimal, places: number): Decimal {
	if (!Number.isInteger(places) || places < 0) throw new Error('Decimal places must be >= 0');
	if (value.fraction.length <= places) {
		return { ...value, fraction: value.fraction.padEnd(places, '0') };
	}
	const kept = value.fraction.slice(0, places);
	const roundUp = Number(value.fraction[places]) >= 5;
	const scale = 10n ** BigInt(places);
	let scaled = value.integer * scale + (kept === '' ? 0n : BigInt(kept));
	if (roundUp) scaled += 1n;
	const integer = scaled / scale;
	const fraction = places === 0 ? '' : (scaled % scale).toString().padStart(places, '0');
	const isZero = integer === 0n && /^0*$/.test(fraction);
	return { negative: value.negative && !isZero, integer, fraction };
}

// ---------------------------------------------------------------------------
// Bangla words
// ---------------------------------------------------------------------------

// prettier-ignore
const BN_UNDER_100 = [
	'শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়',
	'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোল', 'সতেরো', 'আঠারো', 'উনিশ',
	'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'ঊনত্রিশ',
	'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ',
	'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ',
	'পঞ্চাশ', 'একান্ন', 'বাহান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট',
	'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর',
	'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি',
	'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'ঊননব্বই',
	'নব্বই', 'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই',
];

const BN_HUNDREDS = ['', 'একশ', 'দুইশ', 'তিনশ', 'চারশ', 'পাঁচশ', 'ছয়শ', 'সাতশ', 'আটশ', 'নয়শ'];

function bnBelow1000(n: number): string {
	const hundreds = Math.floor(n / 100);
	const rest = n % 100;
	const parts: string[] = [];
	if (hundreds > 0) parts.push(BN_HUNDREDS[hundreds]);
	if (rest > 0) parts.push(BN_UNDER_100[rest]);
	return parts.join(' ');
}

/** Non-negative integer to Bangla words using the South Asian scale (হাজার, লক্ষ, কোটি). */
export function integerToBanglaWords(n: bigint): string {
	if (n < 0n) throw new Error('Expected a non-negative integer');
	if (n === 0n) return BN_UNDER_100[0];
	const crore = n / 10_000_000n;
	const rest = Number(n % 10_000_000n);
	const lakh = Math.floor(rest / 100_000);
	const thousand = Math.floor((rest % 100_000) / 1000);
	const below = rest % 1000;
	const parts: string[] = [];
	if (crore > 0n) parts.push(`${integerToBanglaWords(crore)} কোটি`);
	if (lakh > 0) parts.push(`${BN_UNDER_100[lakh]} লক্ষ`);
	if (thousand > 0) parts.push(`${BN_UNDER_100[thousand]} হাজার`);
	if (below > 0) parts.push(bnBelow1000(below));
	return parts.join(' ');
}

// ---------------------------------------------------------------------------
// English words (South Asian scale: Thousand, Lakh, Crore)
// ---------------------------------------------------------------------------

// prettier-ignore
const EN_ONES = [
	'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
	'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const EN_TENS = [
	'',
	'',
	'Twenty',
	'Thirty',
	'Forty',
	'Fifty',
	'Sixty',
	'Seventy',
	'Eighty',
	'Ninety',
];

function enBelow100(n: number): string {
	if (n < 20) return EN_ONES[n];
	const tens = EN_TENS[Math.floor(n / 10)];
	return n % 10 === 0 ? tens : `${tens} ${EN_ONES[n % 10]}`;
}

function enBelow1000(n: number): string {
	const hundreds = Math.floor(n / 100);
	const rest = n % 100;
	const parts: string[] = [];
	if (hundreds > 0) parts.push(`${EN_ONES[hundreds]} Hundred`);
	if (rest > 0) parts.push(enBelow100(rest));
	return parts.join(' ');
}

/** Non-negative integer to English words using Lakh and Crore, as used in Bangladesh. */
export function integerToEnglishWords(n: bigint): string {
	if (n < 0n) throw new Error('Expected a non-negative integer');
	if (n === 0n) return EN_ONES[0];
	const crore = n / 10_000_000n;
	const rest = Number(n % 10_000_000n);
	const lakh = Math.floor(rest / 100_000);
	const thousand = Math.floor((rest % 100_000) / 1000);
	const below = rest % 1000;
	const parts: string[] = [];
	if (crore > 0n) parts.push(`${integerToEnglishWords(crore)} Crore`);
	if (lakh > 0) parts.push(`${enBelow100(lakh)} Lakh`);
	if (thousand > 0) parts.push(`${enBelow100(thousand)} Thousand`);
	if (below > 0) parts.push(enBelow1000(below));
	return parts.join(' ');
}

function integerWords(n: bigint, language: Language): string {
	return language === 'bn' ? integerToBanglaWords(n) : integerToEnglishWords(n);
}

/** Convert any number (with an optional fraction read digit by digit) to words. */
export function numberToWords(input: string | number | bigint, language: Language = 'bn'): string {
	const value = parseDecimal(input);
	let text = integerWords(value.integer, language);
	if (value.fraction !== '') {
		const digitWords = value.fraction
			.split('')
			.map((d) => (language === 'bn' ? BN_UNDER_100[Number(d)] : EN_ONES[Number(d)]));
		text += `${language === 'bn' ? ' দশমিক ' : ' Point '}${digitWords.join(' ')}`;
	}
	if (value.negative) text = `${language === 'bn' ? 'ঋণাত্মক' : 'Minus'} ${text}`;
	return text;
}

export interface TakaWordsOptions {
	language?: Language;
	/** Spell out the paisa (default true). If false the amount is rounded to whole Taka. */
	includePaisa?: boolean;
	/** Append "মাত্র" / "Only" (default true). */
	suffix?: boolean;
}

/** "1234.50" -> "এক হাজার দুইশ চৌত্রিশ টাকা পঞ্চাশ পয়সা মাত্র". */
export function takaToWords(
	input: string | number | bigint,
	options: TakaWordsOptions = {},
): string {
	const { language = 'bn', includePaisa = true, suffix = true } = options;
	const rounded = roundDecimal(parseDecimal(input), includePaisa ? 2 : 0);
	const paisa = includePaisa ? Number(rounded.fraction) : 0;
	const bn = language === 'bn';
	const parts: string[] = [];

	if (rounded.integer > 0n || paisa === 0) {
		parts.push(`${integerWords(rounded.integer, language)} ${bn ? 'টাকা' : 'Taka'}`);
	}
	if (paisa > 0) {
		const paisaText = `${integerWords(BigInt(paisa), language)} ${bn ? 'পয়সা' : 'Paisa'}`;
		parts.push(!bn && rounded.integer > 0n ? `and ${paisaText}` : paisaText);
	}
	let text = parts.join(' ');
	if (rounded.negative) text = `${bn ? 'ঋণাত্মক' : 'Minus'} ${text}`;
	if (suffix) text += bn ? ' মাত্র' : ' Only';
	return text;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export interface FormatNumberOptions {
	/** Fixed number of decimal places. Leave undefined to keep the input as is. */
	decimals?: number;
	/** "southAsian" groups as 12,34,567 (default), "international" as 1,234,567. */
	grouping?: 'southAsian' | 'international';
	separator?: string;
	decimalSeparator?: string;
	digits?: 'english' | 'bangla';
	prefix?: string;
	suffix?: string;
}

function groupInteger(
	digits: string,
	grouping: 'southAsian' | 'international',
	separator: string,
): string {
	if (digits.length <= 3) return digits;
	if (grouping === 'international') return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
	const head = digits.slice(0, -3);
	const tail = digits.slice(-3);
	return `${head.replace(/\B(?=(\d{2})+(?!\d))/g, separator)}${separator}${tail}`;
}

/** 1234567.891 -> "12,34,567.891" (lakh/crore grouping). */
export function formatNumber(
	input: string | number | bigint,
	options: FormatNumberOptions = {},
): string {
	const {
		decimals,
		grouping = 'southAsian',
		separator = ',',
		decimalSeparator = '.',
		digits = 'english',
		prefix = '',
		suffix = '',
	} = options;
	let value = parseDecimal(input);
	if (decimals !== undefined) value = roundDecimal(value, decimals);
	let text = groupInteger(value.integer.toString(), grouping, separator);
	if (value.fraction !== '') text += `${decimalSeparator}${value.fraction}`;
	if (value.negative) text = `-${text}`;
	text = `${prefix}${text}${suffix}`;
	return digits === 'bangla' ? toBanglaDigits(text) : text;
}
