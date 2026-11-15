import { describe, expect, it } from 'vitest';

import { numberToWords, parseAmount, takaToWords } from '../nodes/BangladeshUtils/lib';

describe('parseAmount: digits', () => {
	it.each([
		['1234.5', '1234.5', '1234.50'],
		['৳১,২৫,০০০.৫০', '125000.5', '125000.50'],
		['Tk. 500/-', '500', '500.00'],
		['BDT 1,500/=', '1500', '1500.00'],
		['-42', '-42', '-42.00'],
		['0.005', '0.005', '0.01'],
	])('reads %j', (input, value, amount) => {
		expect(parseAmount(input)).toMatchObject({ value, amount, method: 'numeric' });
	});

	it('accepts numbers and bigints', () => {
		expect(parseAmount(99.99)).toMatchObject({ value: '99.99', taka: '99', paisa: 99 });
		expect(parseAmount(10n ** 12n)).toMatchObject({ value: '1000000000000', number: 1e12 });
	});
});

describe('parseAmount: scale words', () => {
	it.each([
		['1.5 lakh', '150000'],
		['1.5 lac', '150000'],
		['2.25 crore taka', '22500000'],
		['50k', '50000'],
		['1.2 million', '1200000'],
		['২ কোটি ৫০ লক্ষ টাকা', '25000000'],
		['১.৫লাখ', '150000'],
		['৫ হাজার ২০০ টাকা', '5200'],
		['৫০০টাকা', '500'],
		['Tk.2 lakh', '200000'],
		['-1.5 crore', '-15000000'],
	])('reads %j', (input, value) => {
		expect(parseAmount(input)).toMatchObject({ value, method: 'words' });
	});
});

describe('parseAmount: Bangla words', () => {
	it.each([
		['এক হাজার দুইশ চৌত্রিশ টাকা পঞ্চাশ পয়সা মাত্র', '1234.5'],
		['এক লক্ষ পঁচিশ হাজার টাকা মাত্র', '125000'],
		['পাঁচশো টাকা', '500'],
		['বারোশ টাকা', '1200'],
		['দুই শত পঞ্চাশ', '250'],
		['পঞ্চাশ পয়সা', '0.5'],
		['এক হাজার টাকা ও পঞ্চাশ পয়সা', '1000.5'],
		['ঋণাত্মক এক হাজার', '-1000'],
		['তিন দশমিক এক চার', '3.14'],
		['উনিশ', '19'],
		['এক কোটি কোটি', '100000000000000'],
	])('reads %j', (input, value) => {
		expect(parseAmount(input).value).toBe(value);
	});

	it('accepts both encodings of য়', () => {
		const decomposed = 'ছয় হাজার'.normalize('NFD');
		const composed = 'ছয় হাজার';
		expect(parseAmount(decomposed).value).toBe('6000');
		expect(parseAmount(composed).value).toBe('6000');
	});
});

describe('parseAmount: English words', () => {
	it.each([
		['One Thousand Two Hundred Thirty Four Taka and Fifty Paisa Only', '1234.5'],
		['twelve lakh thirty-four thousand five hundred', '1234500'],
		['one point five lakh', '150000'],
		['Hundred', '100'],
		['Minus Seven', '-7'],
		['Five Crore Taka Only', '50000000'],
	])('reads %j', (input, value) => {
		expect(parseAmount(input).value).toBe(value);
	});
});

describe('parseAmount: round trip with the word operations', () => {
	const samples = [
		'0',
		'7',
		'19',
		'69',
		'100',
		'101',
		'999',
		'1000',
		'12345',
		'100000',
		'1234567',
		'10000000',
		'99999999',
		'123456789',
		'1000000000',
		'987654321012345',
	];

	it.each(samples)('numberToWords(%s) parses back in both languages', (n) => {
		expect(parseAmount(numberToWords(n, 'bn')).value).toBe(n);
		expect(parseAmount(numberToWords(n, 'en')).value).toBe(n);
	});

	it.each(['0.5', '1.01', '1234.56', '123456789012.34', '-250.75'])(
		'takaToWords(%s) parses back in both languages',
		(n) => {
			expect(parseAmount(takaToWords(n)).value).toBe(String(Number(n)));
			expect(parseAmount(takaToWords(n, { language: 'en' })).value).toBe(String(Number(n)));
		},
	);

	it('round trips fractions read digit by digit', () => {
		expect(parseAmount(numberToWords('3.1415', 'bn')).value).toBe('3.1415');
		expect(parseAmount(numberToWords('0.05', 'en')).value).toBe('0.05');
	});
});

describe('parseAmount: result fields', () => {
	it('splits the rounded amount into taka and paisa', () => {
		expect(parseAmount('১,২৩৪.৫৬৭')).toEqual({
			value: '1234.567',
			amount: '1234.57',
			number: 1234.567,
			negative: false,
			taka: '1234',
			paisa: 57,
			method: 'numeric',
		});
	});
});

describe('parseAmount: errors', () => {
	it.each([
		['', /empty/],
		['   ', /empty/],
		['abc', /Unrecognised word "abc"/],
		['টাকা', /does not contain an amount/],
		['120 paisa', /between 0 and 99/],
		['1.5 paisa', /whole number/],
		['five taka six', /Unexpected number after/],
		['5 lakh 3 2', /Two numbers without a unit/],
		['three 4', /Two numbers without a unit/],
		['ten taka five taka', /Taka twice/],
		['ten paisa five paisa', /Paisa twice/],
		['point', /Missing digits/],
		['one point twelve', /single digits/],
		['crore', /needs a number/],
		['paisa', /needs a number/],
		['minus minus five', /Unexpected "minus"/],
	])('rejects %j', (input, message) => {
		expect(() => parseAmount(input)).toThrow(message);
	});

	it('rejects amounts above 15 integer digits', () => {
		expect(() => parseAmount('1234567890123456')).toThrow(/too large/);
		expect(() => parseAmount('১০০০ কোটি কোটি')).toThrow(/too large/);
	});
});
