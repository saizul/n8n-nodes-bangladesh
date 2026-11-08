import { describe, expect, it } from 'vitest';

import { countText, slugify, splitGraphemes, transliterate } from '../nodes/BangladeshUtils/lib';

describe('transliterate', () => {
	it.each([
		['আমার সোনার বাংলা', 'amar sonar bangla'],
		['বাংলাদেশ', 'bangladesh'],
		['ঢাকা', 'dhaka'],
		['আমি', 'ami'],
		['কলম', 'kolom'],
		['রংপুর', 'rongpur'],
		['বিদ্যালয়', 'bidyaloy'],
		['শ্রী', 'shri'],
		['জ্ঞান', 'jnan'],
		['সিলেট', 'silet'],
		['রাজশাহী', 'rajoshahi'],
		['চট্টগ্রাম', 'chottogram'],
		['ড়াক', 'rak'],
		['আমি তোমাকে ভালোবাসি', 'ami tomake bhalobasi'],
		['২০২৪ সাল', '2024 sal'],
		['ঐ ঔ ঋ', 'oi ou ri'],
		['হ্যাঁ', 'hya'],
		['পদ্মা', 'podma'],
		['Hello', 'Hello'],
		['Hello বাংলা', 'Hello bangla'],
		['', ''],
	])('%j -> %j', (input, expected) => {
		expect(transliterate(input)).toBe(expected);
	});

	it('maps the danda to a full stop', () => {
		expect(transliterate('আমি যাই।')).toBe('ami jai.');
	});

	it('is stable for already Latin text', () => {
		expect(transliterate('plain text 123')).toBe('plain text 123');
	});
});

describe('slugify', () => {
	it.each([
		['আমার সোনার বাংলা', 'amar-sonar-bangla'],
		['বাংলাদেশ', 'bangladesh'],
		['Hello বাংলা!', 'hello-bangla'],
		['  ঢাকা   শহর  ', 'dhaka-shohor'],
		['Café Déjà Vu', 'cafe-deja-vu'],
		['৫টি আম', '5ti-am'],
		['!!!', ''],
		['', ''],
		["Cox's Bazar", 'coxs-bazar'],
		['A---B___C', 'a-b-c'],
	])('%j -> %j', (input, expected) => {
		expect(slugify(input)).toBe(expected);
	});

	it('supports separators', () => {
		expect(slugify('আমার সোনার বাংলা', { separator: '_' })).toBe('amar_sonar_bangla');
		expect(slugify('আমার সোনার বাংলা', { separator: '' })).toBe('amarsonarbangla');
	});

	it('supports a maximum length without trailing separators', () => {
		expect(slugify('আমার সোনার বাংলা', { maxLength: 8 })).toBe('amar-son');
		expect(slugify('আমার সোনার বাংলা', { maxLength: 5 })).toBe('amar');
		expect(slugify('আমার সোনার বাংলা', { maxLength: 0 })).toBe('amar-sonar-bangla');
		expect(slugify('আমার সোনার বাংলা', { maxLength: 100 })).toBe('amar-sonar-bangla');
	});
});

describe('splitGraphemes and countText', () => {
	it.each([
		['', 0],
		['abc', 3],
		['কি', 1],
		['বাংলা', 2],
		['ক্ষ', 1],
		['হ্যাঁ', 1],
		['বাংলাদেশ', 4],
		['স্বাধীনতা', 4],
		['ঢাকা', 2],
		['আমার সোনার বাংলা', 10],
		['ক্ষত্রিয়', 3],
	])('%j has %i graphemes', (input, count) => {
		expect(splitGraphemes(input)).toHaveLength(count);
		expect(countText(input).graphemes).toBe(count);
	});

	it('returns the clusters', () => {
		expect(splitGraphemes('বাংলা')).toEqual(['বাং', 'লা']);
	});

	it('reports code points, words and Bangla graphemes', () => {
		const counts = countText('বাংলা ভাষা');
		expect(counts).toEqual({
			graphemes: 5,
			banglaGraphemes: 4,
			codePoints: 10,
			utf16Length: 10,
			words: 2,
			nonWhitespaceGraphemes: 4,
		});
	});

	it('counts mixed text', () => {
		const counts = countText('Hi ঢাকা');
		expect(counts.graphemes).toBe(5);
		expect(counts.banglaGraphemes).toBe(2);
		expect(counts.words).toBe(2);
	});

	it('counts astral characters as one code point', () => {
		const counts = countText('😀');
		expect(counts.codePoints).toBe(1);
		expect(counts.utf16Length).toBe(2);
	});

	it('handles empty text', () => {
		expect(countText('')).toMatchObject({ graphemes: 0, words: 0, codePoints: 0 });
	});
});
