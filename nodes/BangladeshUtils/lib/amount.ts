import { toEnglishDigits } from './digits';
import { BN_HUNDREDS, BN_UNDER_100, EN_ONES, EN_TENS, parseDecimal, roundDecimal } from './number';
import type { Decimal } from './number';

/**
 * Parse amounts as people write them in Bangladesh back into an exact number:
 * "৳১,২৫,০০০.৫০", "Tk. 500/-", "1.5 lakh", "২ কোটি ৫০ লক্ষ টাকা",
 * "এক হাজার দুইশ চৌত্রিশ টাকা পঞ্চাশ পয়সা মাত্র" or
 * "One Thousand Two Hundred Thirty Four Taka and Fifty Paisa Only".
 *
 * All arithmetic is done on scaled bigints, so there are no floating point errors.
 */

const MAX_INTEGER_DIGITS = 15;

/** An exact decimal: units / 10^scale. */
interface Fixed {
	units: bigint;
	scale: number;
}

const ZERO: Fixed = { units: 0n, scale: 0 };

function fixedFromDecimal(value: Decimal): Fixed {
	const scale = value.fraction.length;
	const units = value.integer * 10n ** BigInt(scale) + (scale ? BigInt(value.fraction) : 0n);
	return { units, scale };
}

function align(a: Fixed, b: Fixed): [bigint, bigint, number] {
	const scale = Math.max(a.scale, b.scale);
	return [
		a.units * 10n ** BigInt(scale - a.scale),
		b.units * 10n ** BigInt(scale - b.scale),
		scale,
	];
}

function add(a: Fixed, b: Fixed): Fixed {
	const [x, y, scale] = align(a, b);
	return { units: x + y, scale };
}

function mul(a: Fixed, factor: bigint): Fixed {
	return { units: a.units * factor, scale: a.scale };
}

function isZero(a: Fixed): boolean {
	return a.units === 0n;
}

function toDecimal(a: Fixed, negative: boolean): Decimal {
	const scale = 10n ** BigInt(a.scale);
	const integer = a.units / scale;
	const fraction = a.scale ? (a.units % scale).toString().padStart(a.scale, '0') : '';
	return { negative: negative && a.units !== 0n, integer, fraction };
}

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

const nfc = (word: string) => word.normalize('NFC').toLowerCase();

const NUMBER_WORDS = new Map<string, number>();
BN_UNDER_100.forEach((word, value) => NUMBER_WORDS.set(nfc(word), value));
EN_ONES.forEach((word, value) => NUMBER_WORDS.set(nfc(word), value));
EN_TENS.forEach((word, index) => {
	if (word) NUMBER_WORDS.set(nfc(word), index * 10);
});
BN_HUNDREDS.forEach((word, index) => {
	if (word) NUMBER_WORDS.set(nfc(word), index * 100);
});
// Common alternative spellings in Bangla.
const BN_VARIANTS: Record<string, number> = {
	দু: 2,
	এগার: 11,
	বার: 12,
	তের: 13,
	চোদ্দ: 14,
	পনের: 15,
	ষোলো: 16,
	সতের: 17,
	আঠার: 18,
	ঊনিশ: 19,
	শুন্য: 0,
};
for (const [word, value] of Object.entries(BN_VARIANTS)) NUMBER_WORDS.set(nfc(word), value);

const SCALES = new Map<string, 'hundred' | 'thousand' | 'lakh' | 'million' | 'crore'>();
for (const word of ['hundred', 'hundreds', 'শ', 'শো', 'শত']) SCALES.set(nfc(word), 'hundred');
for (const word of ['thousand', 'thousands', 'k', 'হাজার', 'hazar', 'hajar', 'সহস্র']) {
	SCALES.set(nfc(word), 'thousand');
}
for (const word of ['lakh', 'lakhs', 'lac', 'lacs', 'লক্ষ', 'লাখ']) {
	SCALES.set(nfc(word), 'lakh');
}
for (const word of ['million', 'millions', 'mn']) SCALES.set(nfc(word), 'million');
for (const word of ['crore', 'crores', 'cr', 'কোটি']) SCALES.set(nfc(word), 'crore');

const TAKA_WORDS = new Set(['taka', 'tk', 'bdt', 'টাকা', 'টাকার'].map(nfc));
const PAISA_WORDS = new Set(['paisa', 'paise', 'poisa', 'পয়সা'].map(nfc));
const FILLER_WORDS = new Set(['and', 'only', 'মাত্র', 'এবং', 'ও'].map(nfc));
const NEGATIVE_WORDS = new Set(['minus', 'negative', 'ঋণাত্মক', 'মাইনাস'].map(nfc));
const POINT_WORDS = new Set(['point', 'দশমিক'].map(nfc));
const HUNDRED_SUFFIXES = ['শত', 'শো', 'শ'].map(nfc);

/** Look up a number word, including Bangla hundreds such as "পাঁচশো" or "বারোশ" (1200). */
function numberWord(token: string): number | undefined {
	const direct = NUMBER_WORDS.get(token);
	if (direct !== undefined) return direct;
	if (token.startsWith(nfc('উন'))) {
		const alt = NUMBER_WORDS.get(nfc('ঊন') + token.slice(nfc('উন').length));
		if (alt !== undefined) return alt;
	}
	for (const suffix of HUNDRED_SUFFIXES) {
		if (token.length > suffix.length && token.endsWith(suffix)) {
			const head = numberWord(token.slice(0, -suffix.length));
			if (head !== undefined && head > 0 && head < 100) return head * 100;
		}
	}
	return undefined;
}

function tokenize(input: string): string[] {
	return (
		toEnglishDigits(input)
			.normalize('NFC')
			.toLowerCase()
			// "500/-" and "500/=" are the usual way to close an amount.
			.replace(/\/\s*[-=]+/g, ' ')
			.replace(/৳/g, ' ')
			// Thousands separators between digits.
			.replace(/(\d),(?=\d)/g, '$1')
			// A dot after a word is an abbreviation ("Tk."), not a decimal point.
			.replace(/([\p{L}\p{M}])\./gu, '$1 ')
			// Split digits from words: "500taka", "tk500", "১.৫লাখ".
			.replace(/(\d)(?=[\p{L}\p{M}])/gu, '$1 ')
			.replace(/([\p{L}\p{M}])(?=\d)/gu, '$1 ')
			// A leading hyphen is a minus sign; any other hyphen ("thirty-four") is a space.
			.replace(/^\s*-\s*/, ' - ')
			.replace(/(?<=\S)-|-(?=\S)/g, ' ')
			.replace(/[,;:()[\]{}।|!?"'“”‘’]/g, ' ')
			.split(/\s+/)
			.filter(Boolean)
	);
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export interface ParsedAmount {
	/** Exact value, for example "150000" or "1234.5". */
	value: string;
	/** Value rounded to two decimals (half away from zero), for example "1234.50". */
	amount: string;
	/** The value as a JavaScript number, for arithmetic in later nodes. */
	number: number;
	negative: boolean;
	/** Whole Taka of the rounded amount. */
	taka: string;
	/** Paisa (0-99) of the rounded amount. */
	paisa: number;
	/** "numeric" when the input was a plain number, "words" when words or scale words were read. */
	method: 'numeric' | 'words';
}

function decimalString(value: Decimal): string {
	const fraction = value.fraction.replace(/0+$/, '');
	return `${value.negative ? '-' : ''}${value.integer}${fraction ? `.${fraction}` : ''}`;
}

function finish(value: Decimal, method: ParsedAmount['method']): ParsedAmount {
	if (value.integer.toString().length > MAX_INTEGER_DIGITS) {
		throw new Error(`The amount is too large (more than ${MAX_INTEGER_DIGITS} integer digits)`);
	}
	const rounded = roundDecimal(value, 2);
	const amount = `${rounded.negative ? '-' : ''}${rounded.integer}.${rounded.fraction}`;
	const exact = decimalString(value);
	return {
		value: exact,
		amount,
		number: Number(exact),
		negative: rounded.negative,
		taka: rounded.integer.toString(),
		paisa: Number(rounded.fraction),
		method,
	};
}

class WordAccumulator {
	/** Everything already multiplied by crore. */
	private high: Fixed = ZERO;
	/** Thousands, lakhs and millions below the current crore. */
	private total: Fixed = ZERO;
	/** The group being built, for example 234 in "two hundred thirty four thousand". */
	private current: Fixed | null = null;
	/** Fraction digits after "point" / "দশমিক", or null when not reading them. */
	private fraction: string | null = null;
	private lastWasNumber = false;
	private lastWasDigits = false;
	used = false;

	addNumber(value: Fixed, fromDigits: boolean, token: string): void {
		if (this.fraction !== null) {
			const digit = fromDigits ? token : String(value.units);
			if (!/^\d+$/.test(digit) || (!fromDigits && value.units > 9n)) {
				throw new Error(`Expected single digits after the decimal point, got "${token}"`);
			}
			this.fraction += digit;
			this.used = true;
			return;
		}
		if (this.lastWasNumber && (fromDigits || this.lastWasDigits)) {
			throw new Error(`Two numbers without a unit between them near "${token}"`);
		}
		this.current = this.current === null ? value : add(this.current, value);
		this.lastWasNumber = true;
		this.lastWasDigits = fromDigits;
		this.used = true;
	}

	startFraction(token: string): void {
		if (this.fraction !== null) throw new Error(`Unexpected "${token}"`);
		this.fraction = '';
	}

	private closeFraction(): void {
		if (this.fraction === null) return;
		if (this.fraction === '') throw new Error('Missing digits after the decimal point');
		const digits = { units: BigInt(this.fraction), scale: this.fraction.length };
		this.current = add(this.current ?? ZERO, digits);
		this.fraction = null;
	}

	scale(kind: 'hundred' | 'thousand' | 'lakh' | 'million' | 'crore', token: string): void {
		this.closeFraction();
		this.lastWasNumber = false;
		this.lastWasDigits = false;
		this.used = true;
		const group = this.current ?? { units: 1n, scale: 0 };
		switch (kind) {
			case 'hundred':
				this.current = mul(group, 100n);
				return;
			case 'thousand':
				this.total = add(this.total, mul(group, 1000n));
				break;
			case 'lakh':
				this.total = add(this.total, mul(group, 100_000n));
				break;
			case 'million':
				this.total = add(this.total, mul(group, 1_000_000n));
				break;
			case 'crore': {
				const below = this.current === null ? this.total : add(this.total, this.current);
				if (this.current === null && isZero(below) && isZero(this.high)) {
					throw new Error(`"${token}" needs a number in front of it`);
				}
				// A crore multiplies everything before it, so the nested form produced for
				// large numbers ("নয় কোটি সাতাশি লক্ষ ... কোটি") and "এক কোটি কোটি" both work.
				this.high = mul(add(this.high, below), 10_000_000n);
				this.total = ZERO;
				break;
			}
		}
		this.current = null;
	}

	/** Return the value read so far and reset. */
	take(): Fixed | null {
		this.closeFraction();
		if (!this.used) return null;
		let value = add(this.high, this.total);
		if (this.current !== null) value = add(value, this.current);
		this.high = ZERO;
		this.total = ZERO;
		this.current = null;
		this.lastWasNumber = false;
		this.lastWasDigits = false;
		this.used = false;
		return value;
	}
}

function parseWords(input: string): ParsedAmount {
	const tokens = tokenize(input);
	if (tokens.length === 0) throw new Error('The amount is empty');
	const acc = new WordAccumulator();
	let negative = false;
	let taka: Fixed | null = null;
	let paisa: Fixed | null = null;

	tokens.forEach((token, index) => {
		if ((token === '-' || NEGATIVE_WORDS.has(token)) && !acc.used && taka === null) {
			if (negative) throw new Error(`Unexpected "${token}"`);
			negative = true;
			return;
		}
		if (token === '+' && index === 0) return;
		if (FILLER_WORDS.has(token)) return;
		if (TAKA_WORDS.has(token)) {
			const value = acc.take();
			if (value !== null) {
				if (taka !== null) throw new Error('The amount names Taka twice');
				taka = value;
			}
			return;
		}
		if (PAISA_WORDS.has(token)) {
			const value = acc.take();
			if (value === null) throw new Error(`"${token}" needs a number in front of it`);
			if (paisa !== null) throw new Error('The amount names Paisa twice');
			paisa = value;
			return;
		}
		if (POINT_WORDS.has(token)) {
			acc.startFraction(token);
			return;
		}
		if (/^(?:\d+\.?\d*|\.\d+)$/.test(token)) {
			acc.addNumber(fixedFromDecimal(parseDecimal(token)), true, token);
			return;
		}
		const scale = SCALES.get(token);
		if (scale) {
			acc.scale(scale, token);
			return;
		}
		const word = numberWord(token);
		if (word !== undefined) {
			acc.addNumber({ units: BigInt(word), scale: 0 }, false, token);
			return;
		}
		throw new Error(`Unrecognised word "${token}" in the amount`);
	});

	const rest = acc.take();
	if (rest !== null) {
		if (taka !== null || paisa !== null) {
			throw new Error('Unexpected number after the Taka or Paisa part of the amount');
		}
		taka = rest;
	}
	if (taka === null && paisa === null) throw new Error(`"${input}" does not contain an amount`);

	let total: Fixed = taka ?? ZERO;
	if (paisa !== null) {
		const p = paisa as Fixed;
		if (p.scale > 0 && p.units % 10n ** BigInt(p.scale) !== 0n) {
			throw new Error('Paisa must be a whole number');
		}
		const whole = p.units / 10n ** BigInt(p.scale);
		if (whole > 99n) throw new Error('Paisa must be between 0 and 99');
		total = add(total, { units: whole, scale: 2 });
	}
	return finish(toDecimal(total, negative), 'words');
}

/** Read an amount written with digits, scale words (lakh, crore) or fully in Bangla/English words. */
export function parseAmount(input: string | number | bigint): ParsedAmount {
	if (typeof input !== 'string') return finish(parseDecimal(input), 'numeric');
	const plain = input.replace(/\/\s*[-=]+\s*$/, '');
	try {
		return finish(parseDecimal(plain), 'numeric');
	} catch (error) {
		if (error instanceof Error && /too large/.test(error.message)) throw error;
	}
	return parseWords(input);
}
