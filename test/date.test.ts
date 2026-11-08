import { describe, expect, it } from 'vitest';

import {
	BANGLA_MONTHS,
	banglaMonthLengths,
	banglaToGregorian,
	gregorianToBangla,
	isBanglaLeapYear,
	isGregorianLeapYear,
	parseDateInput,
	toBanglaDate,
	WEEKDAYS,
} from '../nodes/BangladeshUtils/lib';

describe('gregorianToBangla: known dates', () => {
	it.each([
		['2024-04-14', 1431, 1, 1, 'Boishakh', 'রবিবার'],
		['2025-04-14', 1432, 1, 1, 'Boishakh', 'সোমবার'],
		['2024-04-13', 1430, 12, 30, 'Choitro', 'শনিবার'],
		['2024-05-14', 1431, 1, 31, 'Boishakh', 'মঙ্গলবার'],
		['2024-05-15', 1431, 2, 1, 'Joishtho', 'বুধবার'],
		['2024-09-16', 1431, 6, 1, 'Ashwin', 'সোমবার'],
		['2024-10-16', 1431, 6, 31, 'Ashwin', 'বুধবার'],
		['2024-10-17', 1431, 7, 1, 'Kartik', 'বৃহস্পতিবার'],
		['2024-12-15', 1431, 8, 30, 'Agrahayan', 'রবিবার'],
		['2024-12-16', 1431, 9, 1, 'Poush', 'সোমবার'],
		['2025-01-15', 1431, 10, 1, 'Magh', 'বুধবার'],
		['2025-02-14', 1431, 11, 1, 'Falgun', 'শুক্রবার'],
		['2025-03-14', 1431, 11, 29, 'Falgun', 'শুক্রবার'],
		['2025-03-15', 1431, 12, 1, 'Choitro', 'শনিবার'],
		['2024-02-29', 1430, 11, 16, 'Falgun', 'বৃহস্পতিবার'],
		['2024-03-14', 1430, 11, 30, 'Falgun', 'বৃহস্পতিবার'],
		['2024-03-15', 1430, 12, 1, 'Choitro', 'শুক্রবার'],
		['2021-02-21', 1427, 11, 8, 'Falgun', 'রবিবার'],
		['2024-03-26', 1430, 12, 12, 'Choitro', 'মঙ্গলবার'],
		['1971-12-16', 1378, 9, 1, 'Poush', 'বৃহস্পতিবার'],
		['2000-01-01', 1406, 9, 17, 'Poush', 'শনিবার'],
		['2023-12-31', 1430, 9, 16, 'Poush', 'রবিবার'],
	])('%s', (iso, year, month, day, monthName, weekdayBn) => {
		const [y, m, d] = iso.split('-').map(Number);
		const result = gregorianToBangla({ year: y, month: m, day: d });
		expect(result.year).toBe(year);
		expect(result.month).toBe(month);
		expect(result.day).toBe(day);
		expect(result.monthName).toBe(monthName);
		expect(result.weekdayBn).toBe(weekdayBn);
		expect(result.gregorian).toBe(iso);
	});

	it('formats in English and Bangla', () => {
		const result = toBanglaDate('2024-04-14');
		expect(result.formatted).toBe('1 Boishakh 1431');
		expect(result.formattedBn).toBe('১ বৈশাখ ১৪৩১');
		expect(result.formattedFullBn).toBe('রবিবার, ১ বৈশাখ ১৪৩১');
		expect(result.monthNameBn).toBe('বৈশাখ');
		expect(result.weekday).toBe('Sunday');
		expect(result.dayOfYear).toBe(1);
	});

	it('reports seasons', () => {
		expect(toBanglaDate('2024-04-20').seasonBn).toBe('গ্রীষ্ম');
		expect(toBanglaDate('2024-06-20').seasonBn).toBe('বর্ষা');
		expect(toBanglaDate('2024-09-20').seasonBn).toBe('শরৎ');
		expect(toBanglaDate('2024-11-20').seasonBn).toBe('হেমন্ত');
		expect(toBanglaDate('2025-01-20').seasonBn).toBe('শীত');
		expect(toBanglaDate('2025-03-01').seasonBn).toBe('বসন্ত');
		expect(toBanglaDate('2025-03-01').season).toBe('Boshonto');
	});

	it('counts the day of the year', () => {
		expect(toBanglaDate('2025-04-13').dayOfYear).toBe(365);
		expect(toBanglaDate('2024-04-13').dayOfYear).toBe(366);
	});
});

describe('calendar rules', () => {
	it.each([
		[1430, 30, 366],
		[1431, 29, 365],
		[1432, 29, 365],
		[1433, 29, 365],
		[1434, 30, 366],
	])('Bangla year %i has Falgun %i and %i days', (year, falgun, total) => {
		const lengths = banglaMonthLengths(year);
		expect(lengths[10]).toBe(falgun);
		expect(lengths.reduce((a, b) => a + b, 0)).toBe(total);
	});

	it('has 31 days for Boishakh to Ashwin and 30 for Kartik to Magh and Choitro', () => {
		const lengths = banglaMonthLengths(1431);
		expect(lengths.slice(0, 6)).toEqual([31, 31, 31, 31, 31, 31]);
		expect(lengths.slice(6, 10)).toEqual([30, 30, 30, 30]);
		expect(lengths[11]).toBe(30);
		expect(lengths).toHaveLength(12);
	});

	it('detects leap years', () => {
		expect(isBanglaLeapYear(1430)).toBe(true);
		expect(isBanglaLeapYear(1431)).toBe(false);
		expect(isGregorianLeapYear(2000)).toBe(true);
		expect(isGregorianLeapYear(1900)).toBe(false);
		expect(isGregorianLeapYear(2024)).toBe(true);
		expect(isGregorianLeapYear(2023)).toBe(false);
	});

	it('has 12 months and 7 weekdays with names', () => {
		expect(BANGLA_MONTHS).toHaveLength(12);
		expect(WEEKDAYS).toHaveLength(7);
		expect(BANGLA_MONTHS.map((m) => m.name)[0]).toBe('Boishakh');
		expect(BANGLA_MONTHS.map((m) => m.nameBn)[11]).toBe('চৈত্র');
		expect(new Set(BANGLA_MONTHS.map((m) => m.nameBn)).size).toBe(12);
	});

	it('round trips every day for ten years', () => {
		let checked = 0;
		for (let ms = Date.UTC(2020, 0, 1); ms < Date.UTC(2030, 0, 1); ms += 86_400_000) {
			const d = new Date(ms);
			const ymd = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
			const bangla = gregorianToBangla(ymd);
			const back = banglaToGregorian(bangla.year, bangla.month, bangla.day);
			expect(back).toMatchObject(ymd);
			checked += 1;
		}
		expect(checked).toBe(3653);
	});

	it('advances one day at a time', () => {
		let previous = gregorianToBangla({ year: 2023, month: 4, day: 14 });
		for (let ms = Date.UTC(2023, 3, 15); ms <= Date.UTC(2026, 3, 14); ms += 86_400_000) {
			const d = new Date(ms);
			const current = gregorianToBangla({
				year: d.getUTCFullYear(),
				month: d.getUTCMonth() + 1,
				day: d.getUTCDate(),
			});
			const sameMonth = current.month === previous.month && current.year === previous.year;
			if (sameMonth) expect(current.day).toBe(previous.day + 1);
			else expect(current.day).toBe(1);
			previous = current;
		}
	});

	it('rejects impossible Gregorian dates', () => {
		expect(() => gregorianToBangla({ year: 2023, month: 2, day: 29 })).toThrow(/Invalid date/);
		expect(() => gregorianToBangla({ year: 2023, month: 13, day: 1 })).toThrow(/Invalid date/);
		expect(() => gregorianToBangla({ year: 2023, month: 4, day: 31 })).toThrow(/Invalid date/);
	});
});

describe('banglaToGregorian', () => {
	it.each([
		[1431, 1, 1, '2024-04-14'],
		[1431, 1, 31, '2024-05-14'],
		[1431, 6, 31, '2024-10-16'],
		[1430, 11, 30, '2024-03-14'],
		[1431, 11, 29, '2025-03-14'],
		[1431, 12, 30, '2025-04-13'],
		[1431, 9, 1, '2024-12-16'],
		[1427, 11, 8, '2021-02-21'],
	])('%i-%i-%i is %s', (year, month, day, iso) => {
		expect(banglaToGregorian(year, month, day).iso).toBe(iso);
	});

	it.each([
		[1431, 11, 30, /has 29 days/],
		[1431, 7, 31, /has 30 days/],
		[1431, 13, 1, /between 1 and 12/],
		[1431, 0, 1, /between 1 and 12/],
		[1431, 1, 32, /has 31 days/],
		[1431, 1, 0, /has 31 days/],
		[1431.5, 1, 1, /integers/],
	])('rejects %i-%i-%i', (year, month, day, message) => {
		expect(() => banglaToGregorian(year, month, day)).toThrow(message);
	});
});

describe('parseDateInput', () => {
	it.each([
		['2024-04-14', 2024, 4, 14],
		['২০২৪-০৪-১৪', 2024, 4, 14],
		['2024/04/14', 2024, 4, 14],
		['2024.4.14', 2024, 4, 14],
		['2024-04-14T23:30:00', 2024, 4, 14],
		['2024-04-14 23:30:00', 2024, 4, 14],
		['2024-04-13T20:00:00Z', 2024, 4, 14],
		['2024-04-13T20:00:00+00:00', 2024, 4, 14],
		['2024-04-14T00:30:00+06:00', 2024, 4, 14],
		['2024-04-14T01:00:00+10:00', 2024, 4, 13],
	])('parses %j', (input, y, m, d) => {
		expect(parseDateInput(input)).toEqual({ year: y, month: m, day: d });
	});

	it('honours the offset', () => {
		expect(parseDateInput('2024-04-13T20:00:00Z', 0)).toEqual({ year: 2024, month: 4, day: 13 });
		expect(parseDateInput('2024-04-13T20:00:00Z', 360)).toEqual({ year: 2024, month: 4, day: 14 });
	});

	it('accepts Date objects, epoch milliseconds and Luxon-like objects', () => {
		const ms = Date.UTC(2024, 3, 13, 19, 0, 0);
		expect(parseDateInput(new Date(ms))).toEqual({ year: 2024, month: 4, day: 14 });
		expect(parseDateInput(ms)).toEqual({ year: 2024, month: 4, day: 14 });
		expect(parseDateInput(String(ms))).toEqual({ year: 2024, month: 4, day: 14 });
		expect(parseDateInput({ toISO: () => '2024-04-14T10:00:00+06:00' })).toEqual({
			year: 2024,
			month: 4,
			day: 14,
		});
	});

	it('uses the clock when empty', () => {
		const now = () => Date.UTC(2025, 3, 13, 18, 30);
		expect(parseDateInput('', 360, now)).toEqual({ year: 2025, month: 4, day: 14 });
		expect(parseDateInput(undefined, 0, now)).toEqual({ year: 2025, month: 4, day: 13 });
		expect(toBanglaDate(null, 360, now).formatted).toBe('1 Boishakh 1432');
	});

	it.each(['2023-02-30', 'not a date', '2024-13-01', {}, true])('rejects %j', (input) => {
		expect(() => parseDateInput(input)).toThrow();
	});
});
