import { describe, expect, it } from 'vitest';

import { toBanglaDigits, toEnglishDigits } from '../nodes/BangladeshUtils/lib';

describe('toBanglaDigits', () => {
	it.each([
		['0123456789', '০১২৩৪৫৬৭৮৯'],
		['2024', '২০২৪'],
		['Tk 1,500.50', 'Tk ১,৫০০.৫০'],
		['no digits', 'no digits'],
		['', ''],
		['০১২', '০১২'],
	])('converts %j', (input, expected) => {
		expect(toBanglaDigits(input)).toBe(expected);
	});

	it('accepts numbers and bigints', () => {
		expect(toBanglaDigits(1971)).toBe('১৯৭১');
		expect(toBanglaDigits(12345678901234567890n)).toBe('১২৩৪৫৬৭৮৯০১২৩৪৫৬৭৮৯০');
	});
});

describe('toEnglishDigits', () => {
	it.each([
		['০১২৩৪৫৬৭৮৯', '0123456789'],
		['১৪ বৈশাখ ১৪৩১', '14 বৈশাখ 1431'],
		['৳ ১,২৩৪', '৳ 1,234'],
		['abc 123', 'abc 123'],
		['', ''],
	])('converts %j', (input, expected) => {
		expect(toEnglishDigits(input)).toBe(expected);
	});

	it('round trips', () => {
		expect(toEnglishDigits(toBanglaDigits('9876543210'))).toBe('9876543210');
	});
});
