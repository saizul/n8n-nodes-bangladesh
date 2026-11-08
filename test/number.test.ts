import { describe, expect, it } from 'vitest';

import {
	formatNumber,
	integerToBanglaWords,
	integerToEnglishWords,
	numberToWords,
	parseDecimal,
	roundDecimal,
	takaToWords,
} from '../nodes/BangladeshUtils/lib';

describe('parseDecimal', () => {
	it.each([
		['0', false, 0n, ''],
		['42', false, 42n, ''],
		['-42', true, 42n, ''],
		['+7', false, 7n, ''],
		['1,23,456.78', false, 123456n, '78'],
		['১২,৩৪,৫৬৭.৫০', false, 1234567n, '50'],
		['৳ 1,500', false, 1500n, ''],
		['Tk. 250.5', false, 250n, '5'],
		['BDT 99', false, 99n, ''],
		['.5', false, 0n, '5'],
		['5.', false, 5n, ''],
		['007', false, 7n, ''],
		['-0', false, 0n, ''],
		['-0.00', false, 0n, '00'],
	])('parses %j', (input, negative, integer, fraction) => {
		expect(parseDecimal(input)).toEqual({ negative, integer, fraction });
	});

	it('accepts numbers', () => {
		expect(parseDecimal(12.5)).toEqual({ negative: false, integer: 12n, fraction: '5' });
		expect(parseDecimal(-3)).toEqual({ negative: true, integer: 3n, fraction: '' });
	});

	it('accepts bigint', () => {
		expect(parseDecimal(10n ** 14n).integer).toBe(10n ** 14n);
	});

	it.each(['', 'abc', '1.2.3', '--5', '.', '1e5', '12 34x'])('rejects %j', (input) => {
		expect(() => parseDecimal(input)).toThrow(/not a valid number/);
	});

	it('rejects non finite and exponent numbers', () => {
		expect(() => parseDecimal(Number.NaN)).toThrow(/not finite/);
		expect(() => parseDecimal(Number.POSITIVE_INFINITY)).toThrow(/not finite/);
		expect(() => parseDecimal(1e21)).toThrow(/exponent/);
	});

	it('rejects numbers that are too large', () => {
		expect(() => parseDecimal('1234567890123456')).toThrow(/too large/);
		expect(() => parseDecimal('999999999999999')).not.toThrow();
	});
});

describe('roundDecimal', () => {
	it.each([
		['2.675', 2, '2', '68'],
		['0.005', 2, '0', '01'],
		['1.999', 0, '2', ''],
		['1.5', 0, '2', ''],
		['1.49', 0, '1', ''],
		['9.995', 2, '10', '00'],
		['5', 2, '5', '00'],
		['5.1', 3, '5', '100'],
		['0.994', 2, '0', '99'],
	])('rounds %s to %i places', (input, places, integer, fraction) => {
		const result = roundDecimal(parseDecimal(input), places);
		expect(result.integer.toString()).toBe(integer);
		expect(result.fraction).toBe(fraction);
	});

	it('drops the sign when the result is zero', () => {
		expect(roundDecimal(parseDecimal('-0.001'), 2).negative).toBe(false);
		expect(roundDecimal(parseDecimal('-0.01'), 2).negative).toBe(true);
	});

	it('rejects bad places', () => {
		expect(() => roundDecimal(parseDecimal('1'), -1)).toThrow();
		expect(() => roundDecimal(parseDecimal('1'), 1.5)).toThrow();
	});
});

describe('integerToBanglaWords', () => {
	it.each([
		[0n, 'শূন্য'],
		[1n, 'এক'],
		[10n, 'দশ'],
		[11n, 'এগারো'],
		[19n, 'উনিশ'],
		[21n, 'একুশ'],
		[29n, 'ঊনত্রিশ'],
		[39n, 'ঊনচল্লিশ'],
		[45n, 'পঁয়তাল্লিশ'],
		[56n, 'ছাপ্পান্ন'],
		[69n, 'ঊনসত্তর'],
		[78n, 'আটাত্তর'],
		[88n, 'আটাশি'],
		[99n, 'নিরানব্বই'],
		[100n, 'একশ'],
		[101n, 'একশ এক'],
		[250n, 'দুইশ পঞ্চাশ'],
		[999n, 'নয়শ নিরানব্বই'],
		[1000n, 'এক হাজার'],
		[1001n, 'এক হাজার এক'],
		[10000n, 'দশ হাজার'],
		[99999n, 'নিরানব্বই হাজার নয়শ নিরানব্বই'],
		[100000n, 'এক লক্ষ'],
		[1000000n, 'দশ লক্ষ'],
		[10000000n, 'এক কোটি'],
		[123456n, 'এক লক্ষ তেইশ হাজার চারশ ছাপ্পান্ন'],
		[123456789n, 'বারো কোটি চৌত্রিশ লক্ষ ছাপ্পান্ন হাজার সাতশ ঊননব্বই'],
		[1000000000n, 'একশ কোটি'],
		[1000000000000n, 'এক লক্ষ কোটি'],
		[10000000000000n, 'দশ লক্ষ কোটি'],
	])('%s', (n, expected) => {
		expect(integerToBanglaWords(n)).toBe(expected);
	});

	it('has a distinct word for every number below 100', () => {
		const words = Array.from({ length: 100 }, (_, n) => integerToBanglaWords(BigInt(n)));
		expect(new Set(words).size).toBe(100);
	});

	it('rejects negatives', () => {
		expect(() => integerToBanglaWords(-1n)).toThrow();
	});
});

describe('integerToEnglishWords', () => {
	it.each([
		[0n, 'Zero'],
		[7n, 'Seven'],
		[13n, 'Thirteen'],
		[20n, 'Twenty'],
		[99n, 'Ninety Nine'],
		[100n, 'One Hundred'],
		[115n, 'One Hundred Fifteen'],
		[1000n, 'One Thousand'],
		[100000n, 'One Lakh'],
		[250000n, 'Two Lakh Fifty Thousand'],
		[10000000n, 'One Crore'],
		[123456789n, 'Twelve Crore Thirty Four Lakh Fifty Six Thousand Seven Hundred Eighty Nine'],
		[1000000000n, 'One Hundred Crore'],
	])('%s', (n, expected) => {
		expect(integerToEnglishWords(n)).toBe(expected);
	});

	it('rejects negatives', () => {
		expect(() => integerToEnglishWords(-5n)).toThrow();
	});
});

describe('numberToWords', () => {
	it.each([
		['0', 'bn', 'শূন্য'],
		['1234', 'bn', 'এক হাজার দুইশ চৌত্রিশ'],
		['১২৩৪', 'bn', 'এক হাজার দুইশ চৌত্রিশ'],
		['1,50,000', 'bn', 'এক লক্ষ পঞ্চাশ হাজার'],
		['-5', 'bn', 'ঋণাত্মক পাঁচ'],
		['45.67', 'bn', 'পঁয়তাল্লিশ দশমিক ছয় সাত'],
		['0.05', 'bn', 'শূন্য দশমিক শূন্য পাঁচ'],
		['1234', 'en', 'One Thousand Two Hundred Thirty Four'],
		['-5', 'en', 'Minus Five'],
		['45.67', 'en', 'Forty Five Point Six Seven'],
		['100000', 'en', 'One Lakh'],
	] as const)('%s in %s', (input, language, expected) => {
		expect(numberToWords(input, language)).toBe(expected);
	});

	it('defaults to Bangla', () => {
		expect(numberToWords(3)).toBe('তিন');
	});

	it('throws for invalid input', () => {
		expect(() => numberToWords('twelve')).toThrow();
	});
});

describe('takaToWords', () => {
	it.each([
		['1234.50', 'bn', 'এক হাজার দুইশ চৌত্রিশ টাকা পঞ্চাশ পয়সা মাত্র'],
		['1500', 'bn', 'এক হাজার পাঁচশ টাকা মাত্র'],
		['৫০০০', 'bn', 'পাঁচ হাজার টাকা মাত্র'],
		['0', 'bn', 'শূন্য টাকা মাত্র'],
		['0.50', 'bn', 'পঞ্চাশ পয়সা মাত্র'],
		['99.999', 'bn', 'একশ টাকা মাত্র'],
		['100000', 'bn', 'এক লক্ষ টাকা মাত্র'],
		['-250', 'bn', 'ঋণাত্মক দুইশ পঞ্চাশ টাকা মাত্র'],
		['1234.50', 'en', 'One Thousand Two Hundred Thirty Four Taka and Fifty Paisa Only'],
		['0.5', 'en', 'Fifty Paisa Only'],
		['1', 'en', 'One Taka Only'],
		['25000', 'en', 'Twenty Five Thousand Taka Only'],
		['৳ 1,00,000', 'en', 'One Lakh Taka Only'],
		['10000000.05', 'en', 'One Crore Taka and Five Paisa Only'],
		['0', 'en', 'Zero Taka Only'],
		['-10', 'en', 'Minus Ten Taka Only'],
	] as const)('%s in %s', (input, language, expected) => {
		expect(takaToWords(input, { language })).toBe(expected);
	});

	it('can skip the suffix', () => {
		expect(takaToWords('500', { suffix: false })).toBe('পাঁচশ টাকা');
		expect(takaToWords('500', { language: 'en', suffix: false })).toBe('Five Hundred Taka');
	});

	it('can round away the paisa', () => {
		expect(takaToWords('10.50', { includePaisa: false, language: 'en' })).toBe('Eleven Taka Only');
		expect(takaToWords('10.49', { includePaisa: false, language: 'en' })).toBe('Ten Taka Only');
	});

	it('uses Bangla by default', () => {
		expect(takaToWords(10)).toBe('দশ টাকা মাত্র');
	});

	it('throws for invalid input', () => {
		expect(() => takaToWords('abc')).toThrow();
	});
});

describe('formatNumber', () => {
	it.each([
		['0', '0'],
		['123', '123'],
		['1234', '1,234'],
		['12345', '12,345'],
		['123456', '1,23,456'],
		['1234567', '12,34,567'],
		['12345678', '1,23,45,678'],
		['1234567890', '1,23,45,67,890'],
		['1234567.891', '12,34,567.891'],
		['-1234567.5', '-12,34,567.5'],
		['১২৩৪৫৬৭', '12,34,567'],
		['1,234,567', '12,34,567'],
	])('groups %s as %s', (input, expected) => {
		expect(formatNumber(input)).toBe(expected);
	});

	it('supports international grouping', () => {
		expect(formatNumber('1234567', { grouping: 'international' })).toBe('1,234,567');
		expect(formatNumber('123', { grouping: 'international' })).toBe('123');
		expect(formatNumber('1234567890', { grouping: 'international' })).toBe('1,234,567,890');
	});

	it('rounds to fixed decimals', () => {
		expect(formatNumber('1234567.5', { decimals: 2 })).toBe('12,34,567.50');
		expect(formatNumber('2.675', { decimals: 2 })).toBe('2.68');
		expect(formatNumber('5', { decimals: 2 })).toBe('5.00');
		expect(formatNumber('1999.999', { decimals: 0 })).toBe('2,000');
		expect(formatNumber('-0.001', { decimals: 2 })).toBe('0.00');
	});

	it('writes Bangla digits', () => {
		expect(formatNumber(1234567, { digits: 'bangla' })).toBe('১২,৩৪,৫৬৭');
		expect(formatNumber('1234.5', { digits: 'bangla', prefix: '৳ ' })).toBe('৳ ১,২৩৪.৫');
	});

	it('supports custom separators and affixes', () => {
		expect(formatNumber('1234567.5', { separator: ' ', decimalSeparator: ',' })).toBe(
			'12 34 567,5',
		);
		expect(formatNumber('1500', { prefix: 'Tk ', suffix: ' only' })).toBe('Tk 1,500 only');
	});

	it('throws for invalid input', () => {
		expect(() => formatNumber('x')).toThrow();
	});
});
