import { toEnglishDigits } from './digits';

export interface Operator {
	/** Three digit prefix, for example "017". */
	prefix: string;
	/** Brand name, for example "Grameenphone". */
	name: string;
	/** Brand name in Bangla. */
	nameBn: string;
	/** Short brand name, for example "GP". */
	shortName: string;
}

const GP: Omit<Operator, 'prefix'> = {
	name: 'Grameenphone',
	nameBn: 'গ্রামীণফোন',
	shortName: 'GP',
};
const BANGLALINK: Omit<Operator, 'prefix'> = {
	name: 'Banglalink',
	nameBn: 'বাংলালিংক',
	shortName: 'BL',
};
const ROBI: Omit<Operator, 'prefix'> = { name: 'Robi', nameBn: 'রবি', shortName: 'Robi' };
const TELETALK: Omit<Operator, 'prefix'> = { name: 'Teletalk', nameBn: 'টেলিটক', shortName: 'TT' };

/** Mobile prefix allocation. Ported (MNP) numbers keep their original prefix. */
export const OPERATORS: Readonly<Record<string, Operator>> = {
	'013': { prefix: '013', ...GP },
	'014': { prefix: '014', ...BANGLALINK },
	'015': { prefix: '015', ...TELETALK },
	'016': { prefix: '016', ...ROBI },
	'017': { prefix: '017', ...GP },
	'018': { prefix: '018', ...ROBI },
	'019': { prefix: '019', ...BANGLALINK },
};

export type PhoneInvalidReason =
	'empty' | 'invalid_characters' | 'invalid_length' | 'invalid_prefix';

export interface PhoneParseResult {
	valid: boolean;
	/** The original input as a string. */
	input: string;
	/** Reason the number was rejected, otherwise null. */
	reason: PhoneInvalidReason | null;
	/** National number with the trunk zero, for example 01712345678. */
	national: string | null;
	operator: Operator | null;
}

export type PhoneFormat = 'e164' | 'local' | 'localSpaced' | 'international' | 'digitsOnly';

const NATIONAL_PATTERN = /^01[3-9]\d{8}$/;

function invalid(input: string, reason: PhoneInvalidReason): PhoneParseResult {
	return { valid: false, input, reason, national: null, operator: null };
}

/**
 * Parse a Bangladeshi mobile number written in any common style:
 * 01712345678, 8801712345678, +880 1712-345678, 008801712345678, 1712345678,
 * +88 01712 345 678 and the same with Bangla digits.
 */
export function parsePhone(raw: unknown): PhoneParseResult {
	const input = raw === null || raw === undefined ? '' : String(raw);
	const cleaned = toEnglishDigits(input).trim();
	if (cleaned === '') return invalid(input, 'empty');
	if (!/^\+?[\d\s\-().]+$/.test(cleaned)) return invalid(input, 'invalid_characters');

	let digits = cleaned.replace(/\D/g, '');
	if (digits.startsWith('00880')) digits = digits.slice(2);
	if (digits.startsWith('880')) digits = digits.slice(3);
	else if (digits.startsWith('88') && digits.length === 13) digits = digits.slice(2);

	// "+880 017..." style: the trunk zero is kept after the country code.
	let national: string;
	if (digits.length === 10 && digits.startsWith('1')) national = `0${digits}`;
	else national = digits;

	if (national.length !== 11) return invalid(input, 'invalid_length');
	if (!NATIONAL_PATTERN.test(national)) return invalid(input, 'invalid_prefix');

	return {
		valid: true,
		input,
		reason: null,
		national,
		operator: OPERATORS[national.slice(0, 3)] ?? null,
	};
}

export function isValidPhone(raw: unknown): boolean {
	return parsePhone(raw).valid;
}

function requireValid(raw: unknown): PhoneParseResult & { national: string } {
	const parsed = parsePhone(raw);
	if (!parsed.valid || parsed.national === null) {
		throw new Error(
			`"${parsed.input}" is not a valid Bangladeshi mobile number (${parsed.reason ?? 'unknown'})`,
		);
	}
	return parsed as PhoneParseResult & { national: string };
}

/** Format a valid number. Throws if the number is not a valid Bangladeshi mobile number. */
export function formatPhone(raw: unknown, format: PhoneFormat = 'e164'): string {
	const { national } = requireValid(raw);
	const subscriber = national.slice(1); // 1712345678
	switch (format) {
		case 'e164':
			return `+880${subscriber}`;
		case 'local':
			return national;
		case 'localSpaced':
			return `${national.slice(0, 5)} ${national.slice(5)}`;
		case 'international':
			return `+880 ${subscriber.slice(0, 4)} ${subscriber.slice(4)}`;
		case 'digitsOnly':
			return `880${subscriber}`;
		default:
			throw new Error(`Unknown phone format: ${String(format)}`);
	}
}

export function detectOperator(raw: unknown): Operator {
	const { operator } = requireValid(raw);
	if (!operator) throw new Error('Operator could not be determined');
	return operator;
}

export interface MaskOptions {
	/** Digits kept at the start of the local number (default 3). */
	visibleStart?: number;
	/** Digits kept at the end (default 2). */
	visibleEnd?: number;
	/** Mask character (default "*"). */
	maskChar?: string;
	format?: PhoneFormat;
}

/** Mask the middle of a valid number, for example 017******78. */
export function maskPhone(raw: unknown, options: MaskOptions = {}): string {
	const { visibleStart = 3, visibleEnd = 2, maskChar = '*', format = 'local' } = options;
	if (!Number.isInteger(visibleStart) || !Number.isInteger(visibleEnd)) {
		throw new Error('Visible digit counts must be integers');
	}
	if (visibleStart < 0 || visibleEnd < 0) {
		throw new Error('Visible digit counts must not be negative');
	}
	const formatted = formatPhone(raw, format);
	const char = maskChar === '' ? '*' : Array.from(maskChar)[0];
	// Only digits are masked; the "+" and spaces of the chosen format stay in place.
	const digitCount = (formatted.match(/\d/g) ?? []).length;
	if (visibleStart + visibleEnd >= digitCount) {
		throw new Error(
			`Visible digits (${visibleStart + visibleEnd}) must be less than ${digitCount}`,
		);
	}
	let seen = 0;
	return formatted.replace(/\d/g, (digit) => {
		seen += 1;
		return seen <= visibleStart || seen > digitCount - visibleEnd ? digit : char;
	});
}

/** Build a click-to-chat link: https://wa.me/8801712345678?text=... */
export function whatsappLink(raw: unknown, message?: string): string {
	const base = `https://wa.me/${formatPhone(raw, 'digitsOnly')}`;
	return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export interface ExtractedPhone {
	/** The number exactly as it appears in the text. */
	match: string;
	/** Offset of the match in the text (UTF-16 code units, like String.prototype.indexOf). */
	index: number;
	/** National number with the trunk zero, for example 01712345678. */
	local: string;
	/** The number in the requested output format. */
	number: string;
	operator: Operator;
}

export interface ExtractOptions {
	/** Output format of the `number` field (default "e164"). */
	format?: PhoneFormat;
	/** Keep only the first occurrence of every number (default true). */
	unique?: boolean;
	/** Only return numbers whose prefix is in this list, for example ["017", "013"]. */
	prefixes?: readonly string[];
}

/**
 * A digit group: an optional "+" and "(", a digit, then digits and the in-number separators
 * "-", ".", "(" and ")". Groups are joined by spaces or tabs, never by line breaks.
 */
const SEGMENT = String.raw`\+?\(?\d[\d().\-]*`;
const CANDIDATE_PATTERN = new RegExp(
	String.raw`(?<![A-Za-z0-9+])${SEGMENT}(?:[ \t\u00a0]+${SEGMENT})*`,
	'g',
);
const SEGMENT_PATTERN = new RegExp(SEGMENT, 'g');
/** The longest valid spelling is "+880 1712 345 678" style: at most six groups. */
const MAX_SEGMENTS = 6;

/**
 * Find every Bangladeshi mobile number in free text, for example an SMS, an email body or a
 * chat message. All spellings accepted by parsePhone are recognised, in English or Bangla
 * digits, and numbers that sit next to each other are split correctly.
 */
export function extractPhones(raw: unknown, options: ExtractOptions = {}): ExtractedPhone[] {
	const { format = 'e164', unique = true, prefixes } = options;
	const text = raw === null || raw === undefined ? '' : String(raw);
	// Bangla digits are single UTF-16 code units, so offsets stay the same after conversion.
	const ascii = toEnglishDigits(text);
	const allowed = prefixes && prefixes.length > 0 ? new Set(prefixes.map(normalizePrefix)) : null;
	const seen = new Set<string>();
	const found: ExtractedPhone[] = [];

	for (const candidate of ascii.matchAll(CANDIDATE_PATTERN)) {
		const start = candidate.index;
		const segments = [...candidate[0].matchAll(SEGMENT_PATTERN)].map((segment) => ({
			start: start + segment.index,
			end: start + segment.index + segment[0].length,
		}));

		let s = 0;
		while (s < segments.length) {
			let matched = false;
			// Prefer the longest run of groups that forms a valid number.
			const last = Math.min(segments.length, s + MAX_SEGMENTS) - 1;
			for (let e = last; e >= s; e--) {
				const [from, to] = trimMatch(ascii, segments[s].start, segments[e].end);
				const parsed = parsePhone(ascii.slice(from, to));
				if (!parsed.valid || parsed.national === null || parsed.operator === null) continue;

				matched = true;
				s = e + 1;
				if (allowed && !allowed.has(parsed.operator.prefix)) break;
				if (unique && seen.has(parsed.national)) break;
				seen.add(parsed.national);
				found.push({
					match: text.slice(from, to),
					index: from,
					local: parsed.national,
					number: formatPhone(parsed.national, format),
					operator: parsed.operator,
				});
				break;
			}
			if (!matched) s += 1;
		}
	}
	return found;
}

/**
 * Drop sentence punctuation and dangling separators at the end of a match, and a bracket that
 * belongs to the surrounding text, as in "(call 01712345678)".
 */
function trimMatch(text: string, from: number, to: number): [number, number] {
	let start = from;
	let end = to;
	const count = (char: string) => text.slice(start, end).split(char).length - 1;
	for (;;) {
		const before = [start, end];
		while (end > start && /[.\-(]/.test(text[end - 1])) end -= 1;
		if (text[end - 1] === ')' && count(')') > count('(')) end -= 1;
		if (text[start] === '(' && count('(') > count(')')) start += 1;
		if (
			text[start] === '(' &&
			text[end - 1] === ')' &&
			isBalanced(text.slice(start + 1, end - 1))
		) {
			start += 1;
			end -= 1;
		}
		if (before[0] === start && before[1] === end) return [start, end];
	}
}

/** Whether every ")" closes an earlier "(" and every "(" is closed. */
function isBalanced(value: string): boolean {
	let depth = 0;
	for (const char of value) {
		if (char === '(') depth += 1;
		else if (char === ')' && --depth < 0) return false;
	}
	return depth === 0;
}

function normalizePrefix(prefix: string): string {
	const digits = toEnglishDigits(prefix).replace(/\D/g, '');
	if (digits.length === 2) return `0${digits}`;
	if (digits.length === 5 && digits.startsWith('880')) return `0${digits.slice(3)}`;
	return digits;
}
