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
