import { toEnglishDigits } from './digits';

const HASANTA = '্';
const NUKTA = '়';
const ZWJ = '‍';
const ZWNJ = '‌';

// prettier-ignore
const VOWELS: Readonly<Record<string, string>> = {
	'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri',
	'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
};

// prettier-ignore
const VOWEL_SIGNS: Readonly<Record<string, string>> = {
	'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
	'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
};

// prettier-ignore
const CONSONANTS: Readonly<Record<string, string>> = {
	'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
	'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
	'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
	'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
	'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
	'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
	'ৎ': 't',
};

// prettier-ignore
const MARKS: Readonly<Record<string, string>> = {
	'ং': 'ng', 'ঃ': 'h', 'ঁ': '', '।': '.', '॥': '.',
};

/** Consonants that take a nukta (U+09BC), written as base + nukta after NFC normalisation. */
const NUKTA_CONSONANTS: Readonly<Record<string, string>> = {
	'\u09a1': 'r', // ড় (ডর)
	'\u09a2': 'rh', // ঢ়
	'\u09af': 'y', // য়
};

function isBengaliLetter(ch: string | undefined): boolean {
	if (!ch) return false;
	const code = ch.charCodeAt(0);
	return code >= 0x0985 && code <= 0x09b9;
}

/**
 * Approximate phonetic Bangla to Latin transliteration. It is meant for slugs, file names and
 * search keys, not for scholarly romanisation. The inherent vowel "o" is dropped at the end of a
 * word ("বাংলাদেশ" becomes "bangladesh").
 */
export function transliterate(text: string): string {
	const src = Array.from(toEnglishDigits(String(text)).normalize('NFC'));
	let out = '';
	let afterHasanta = false;
	for (let i = 0; i < src.length; i += 1) {
		const ch = src[i];
		const wasAfterHasanta = afterHasanta;
		afterHasanta = false;

		if (CONSONANTS[ch] !== undefined) {
			let sound = CONSONANTS[ch];
			if (src[i + 1] === NUKTA && NUKTA_CONSONANTS[ch] !== undefined) {
				sound = NUKTA_CONSONANTS[ch];
				i += 1;
			} else if (ch === '\u09af' && wasAfterHasanta) {
				// ya-phala (conjunct with য) reads "y": "বিদ্যা" -> "bidya"
				sound = 'y';
			}
			out += sound;
			const next = src[i + 1];
			if (next !== undefined && VOWEL_SIGNS[next] !== undefined) {
				out += VOWEL_SIGNS[next];
				i += 1;
			} else if (next === HASANTA) {
				i += 1;
				afterHasanta = true;
			} else if (
				isBengaliLetter(next) ||
				next === '\u0982' ||
				next === '\u0983' ||
				next === '\u0981'
			) {
				out += 'o';
			}
			continue;
		}
		if (VOWELS[ch] !== undefined) out += VOWELS[ch];
		else if (MARKS[ch] !== undefined) out += MARKS[ch];
		else if (VOWEL_SIGNS[ch] !== undefined) out += VOWEL_SIGNS[ch];
		else if (ch === HASANTA || ch === NUKTA || ch === ZWJ || ch === ZWNJ) continue;
		else out += ch;
	}
	return out;
}

export interface NormalizeTextOptions {
	/** Keep ZWJ and ZWNJ, which are meaningful in some Bangla conjuncts (e.g. র‍্য). Default true. */
	keepJoiners?: boolean;
	/** Collapse runs of whitespace into one space and trim the ends. Default false. */
	collapseWhitespace?: boolean;
}

const INVISIBLE = /[\u200B\u2060\uFEFF\u00AD]/g;
const JOINERS = /[\u200C\u200D]/g;

/**
 * Clean pasted Bangla text: Unicode NFC, strip invisible characters (zero-width space, word
 * joiner, BOM, soft hyphen) and optionally the joiners and extra whitespace.
 */
export function normalizeText(text: string, options: NormalizeTextOptions = {}): string {
	const { keepJoiners = true, collapseWhitespace = false } = options;
	let out = String(text).replace(INVISIBLE, '');
	if (!keepJoiners) out = out.replace(JOINERS, '');
	out = out.normalize('NFC');
	if (collapseWhitespace) out = out.replace(/\s+/g, ' ').trim();
	return out;
}

export interface SlugOptions {
	separator?: string;
	/** Maximum slug length, 0 for unlimited. */
	maxLength?: number;
}

export function slugify(text: string, options: SlugOptions = {}): string {
	const { separator = '-', maxLength = 0 } = options;
	const latin = transliterate(text)
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/['’]/g, '');
	let slug = latin.replace(/[^a-z0-9]+/g, '\u0000');
	slug = slug.split('\u0000').filter(Boolean).join(separator);
	if (maxLength > 0 && slug.length > maxLength) {
		slug = slug.slice(0, maxLength);
		if (separator !== '') {
			while (slug.endsWith(separator)) slug = slug.slice(0, -separator.length);
		}
	}
	return slug;
}

/**
 * Split text into user perceived characters. Bangla clusters (consonant + vowel sign,
 * conjuncts joined by hasanta, nukta, chandrabindu, anusvara) stay together.
 */
export function splitGraphemes(text: string): string[] {
	const clusters: string[] = [];
	let joinNext = false;
	for (const ch of Array.from(String(text).normalize('NFC'))) {
		const extends_ = /\p{M}/u.test(ch) || ch === ZWJ || ch === ZWNJ;
		if (clusters.length > 0 && (extends_ || joinNext)) {
			clusters[clusters.length - 1] += ch;
		} else {
			clusters.push(ch);
		}
		joinNext = ch === HASANTA || ch === ZWJ;
	}
	return clusters;
}

export interface TextCounts {
	/** User perceived characters (Bangla conjuncts count as one). */
	graphemes: number;
	/** Graphemes that contain a Bangla letter. */
	banglaGraphemes: number;
	codePoints: number;
	/** JavaScript string length (UTF-16 units). */
	utf16Length: number;
	/** Whitespace separated words. */
	words: number;
	/** Graphemes excluding whitespace. */
	nonWhitespaceGraphemes: number;
}

export function countText(text: string): TextCounts {
	const value = String(text);
	const clusters = splitGraphemes(value);
	return {
		graphemes: clusters.length,
		banglaGraphemes: clusters.filter((c) => /[ঀ-৿]/.test(c)).length,
		codePoints: Array.from(value).length,
		utf16Length: value.length,
		words: value.split(/\s+/).filter(Boolean).length,
		nonWhitespaceGraphemes: clusters.filter((c) => !/^\s+$/.test(c)).length,
	};
}
