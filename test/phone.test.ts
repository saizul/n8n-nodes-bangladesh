import { describe, expect, it } from 'vitest';

import {
	detectOperator,
	formatPhone,
	isValidPhone,
	maskPhone,
	OPERATORS,
	parsePhone,
	whatsappLink,
} from '../nodes/BangladeshUtils/lib';

describe('parsePhone: valid spellings', () => {
	it.each([
		'01712345678',
		'8801712345678',
		'+8801712345678',
		'+880 1712-345678',
		'008801712345678',
		'1712345678',
		'০১৭১২৩৪৫৬৭৮',
		'+৮৮০১৭১২৩৪৫৬৭৮',
		'(017) 1234-5678',
		'017 1234 5678',
		'+880 01712345678',
		'88 01712345678',
		'  01712.345.678  ',
		'+৮৮০ ১৭১২-৩৪৫৬৭৮',
	])('accepts %j', (input) => {
		const result = parsePhone(input);
		expect(result.valid).toBe(true);
		expect(result.national).toBe('01712345678');
		expect(result.reason).toBeNull();
	});
});

describe('parsePhone: invalid input', () => {
	it.each([
		['', 'empty'],
		['   ', 'empty'],
		[null, 'empty'],
		[undefined, 'empty'],
		['abc', 'invalid_characters'],
		['017-1234-5678x', 'invalid_characters'],
		['0171234567', 'invalid_length'],
		['017123456789', 'invalid_length'],
		['12345', 'invalid_length'],
		['+8801712', 'invalid_length'],
		['01212345678', 'invalid_prefix'],
		['01112345678', 'invalid_prefix'],
		['02123456789', 'invalid_prefix'],
		['+8801212345678', 'invalid_prefix'],
		['1212345678', 'invalid_prefix'],
	])('rejects %j as %s', (input, reason) => {
		const result = parsePhone(input);
		expect(result.valid).toBe(false);
		expect(result.reason).toBe(reason);
		expect(result.national).toBeNull();
		expect(result.operator).toBeNull();
	});
});

describe('operators', () => {
	it.each([
		['01312345678', 'Grameenphone', 'GP'],
		['01412345678', 'Banglalink', 'BL'],
		['01512345678', 'Teletalk', 'TT'],
		['01612345678', 'Robi', 'Robi'],
		['01712345678', 'Grameenphone', 'GP'],
		['01812345678', 'Robi', 'Robi'],
		['01912345678', 'Banglalink', 'BL'],
	])('%s belongs to %s', (number, name, shortName) => {
		const operator = detectOperator(number);
		expect(operator.name).toBe(name);
		expect(operator.shortName).toBe(shortName);
		expect(operator.prefix).toBe(number.slice(0, 3));
	});

	it('has Bangla names', () => {
		expect(detectOperator('01712345678').nameBn).toBe('গ্রামীণফোন');
		expect(detectOperator('01912345678').nameBn).toBe('বাংলালিংক');
		expect(detectOperator('01812345678').nameBn).toBe('রবি');
		expect(detectOperator('01512345678').nameBn).toBe('টেলিটক');
	});

	it('covers exactly the prefixes 013 to 019', () => {
		expect(Object.keys(OPERATORS).sort()).toEqual([
			'013',
			'014',
			'015',
			'016',
			'017',
			'018',
			'019',
		]);
	});

	it('detects operators from Bangla digits and international spelling', () => {
		expect(detectOperator('+৮৮০১৯১২৩৪৫৬৭৮').name).toBe('Banglalink');
	});

	it('throws for numbers that are not valid', () => {
		expect(() => detectOperator('01212345678')).toThrow(/not a valid Bangladeshi mobile number/);
	});
});

describe('formatPhone', () => {
	it.each([
		['e164', '+8801712345678'],
		['local', '01712345678'],
		['localSpaced', '01712 345678'],
		['international', '+880 1712 345678'],
		['digitsOnly', '8801712345678'],
	] as const)('formats as %s', (format, expected) => {
		expect(formatPhone('+880 1712-345678', format)).toBe(expected);
	});

	it('defaults to E.164', () => {
		expect(formatPhone('০১৭১২৩৪৫৬৭৮')).toBe('+8801712345678');
	});

	it('throws on invalid numbers', () => {
		expect(() => formatPhone('123')).toThrow(/invalid_length/);
	});

	it('throws on unknown format', () => {
		expect(() => formatPhone('01712345678', 'nope' as never)).toThrow(/Unknown phone format/);
	});
});

describe('isValidPhone', () => {
	it('is a boolean shortcut', () => {
		expect(isValidPhone('01912345678')).toBe(true);
		expect(isValidPhone('01212345678')).toBe(false);
	});
});

describe('maskPhone', () => {
	it('masks the middle by default', () => {
		expect(maskPhone('01712345678')).toBe('017******78');
	});

	it('honours visible counts', () => {
		expect(maskPhone('01712345678', { visibleStart: 4, visibleEnd: 4 })).toBe('0171***5678');
		expect(maskPhone('01712345678', { visibleStart: 0, visibleEnd: 0 })).toBe('***********');
	});

	it('uses a custom mask character', () => {
		expect(maskPhone('01712345678', { maskChar: 'x' })).toBe('017xxxxxx78');
		expect(maskPhone('01712345678', { maskChar: '' })).toBe('017******78');
	});

	it('masks other formats and keeps separators', () => {
		expect(maskPhone('01712345678', { format: 'e164' })).toBe(`+880${'*'.repeat(8)}78`);
		expect(
			maskPhone('01712345678', { format: 'localSpaced', visibleStart: 3, visibleEnd: 3 }),
		).toBe('017** ***678');
	});

	it('accepts any spelling of the number', () => {
		expect(maskPhone('+৮৮০১৭১২৩৪৫৬৭৮')).toBe('017******78');
	});

	it('rejects bad visible counts', () => {
		expect(() => maskPhone('01712345678', { visibleStart: -1 })).toThrow(/negative/);
		expect(() => maskPhone('01712345678', { visibleStart: 6, visibleEnd: 5 })).toThrow(/less than/);
		expect(() => maskPhone('01712345678', { visibleStart: 1.5 })).toThrow(/integers/);
	});

	it('rejects invalid numbers', () => {
		expect(() => maskPhone('hello')).toThrow();
	});
});

describe('whatsappLink', () => {
	it('builds a plain link', () => {
		expect(whatsappLink('01712345678')).toBe('https://wa.me/8801712345678');
	});

	it('encodes the message', () => {
		expect(whatsappLink('017-1234-5678', 'Hi there & welcome')).toBe(
			'https://wa.me/8801712345678?text=Hi%20there%20%26%20welcome',
		);
	});

	it('encodes Bangla text', () => {
		expect(whatsappLink('01712345678', 'হ্যালো')).toBe(
			`https://wa.me/8801712345678?text=${encodeURIComponent('হ্যালো')}`,
		);
	});

	it('ignores an empty message', () => {
		expect(whatsappLink('01712345678', '')).toBe('https://wa.me/8801712345678');
	});

	it('throws for an invalid number', () => {
		expect(() => whatsappLink('999')).toThrow();
	});
});
