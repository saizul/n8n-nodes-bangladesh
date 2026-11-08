import { toBanglaDigits, toEnglishDigits } from './digits';

export const BANGLA_MONTHS = [
	{ name: 'Boishakh', nameBn: 'বৈশাখ', season: 'Grishmo', seasonBn: 'গ্রীষ্ম' },
	{ name: 'Joishtho', nameBn: 'জ্যৈষ্ঠ', season: 'Grishmo', seasonBn: 'গ্রীষ্ম' },
	{ name: 'Asharh', nameBn: 'আষাঢ়', season: 'Borsha', seasonBn: 'বর্ষা' },
	{ name: 'Srabon', nameBn: 'শ্রাবণ', season: 'Borsha', seasonBn: 'বর্ষা' },
	{ name: 'Bhadro', nameBn: 'ভাদ্র', season: 'Shorot', seasonBn: 'শরৎ' },
	{ name: 'Ashwin', nameBn: 'আশ্বিন', season: 'Shorot', seasonBn: 'শরৎ' },
	{ name: 'Kartik', nameBn: 'কার্তিক', season: 'Hemonto', seasonBn: 'হেমন্ত' },
	{ name: 'Agrahayan', nameBn: 'অগ্রহায়ণ', season: 'Hemonto', seasonBn: 'হেমন্ত' },
	{ name: 'Poush', nameBn: 'পৌষ', season: 'Sheet', seasonBn: 'শীত' },
	{ name: 'Magh', nameBn: 'মাঘ', season: 'Sheet', seasonBn: 'শীত' },
	{ name: 'Falgun', nameBn: 'ফাল্গুন', season: 'Boshonto', seasonBn: 'বসন্ত' },
	{ name: 'Choitro', nameBn: 'চৈত্র', season: 'Boshonto', seasonBn: 'বসন্ত' },
] as const;

/** Index 0 is Sunday, matching Date.getUTCDay(). */
export const WEEKDAYS = [
	{ name: 'Sunday', nameBn: 'রবিবার' },
	{ name: 'Monday', nameBn: 'সোমবার' },
	{ name: 'Tuesday', nameBn: 'মঙ্গলবার' },
	{ name: 'Wednesday', nameBn: 'বুধবার' },
	{ name: 'Thursday', nameBn: 'বৃহস্পতিবার' },
	{ name: 'Friday', nameBn: 'শুক্রবার' },
	{ name: 'Saturday', nameBn: 'শনিবার' },
] as const;

/** Bangladesh is UTC+6 with no daylight saving. */
export const DHAKA_OFFSET_MINUTES = 360;

const DAY_MS = 86_400_000;

export interface YMD {
	year: number;
	month: number;
	day: number;
}

export interface BanglaDate {
	/** Source date as YYYY-MM-DD. */
	gregorian: string;
	year: number;
	month: number;
	day: number;
	monthName: string;
	monthNameBn: string;
	season: string;
	seasonBn: string;
	weekday: string;
	weekdayBn: string;
	/** Day of the Bangla year, 1 to 365/366. */
	dayOfYear: number;
	/** English formatted date, for example "14 Boishakh 1431". */
	formatted: string;
	/** Bangla formatted date, for example "১৪ বৈশাখ ১৪৩১". */
	formattedBn: string;
	/** Bangla formatted date with weekday, for example "রবিবার, ১৪ বৈশাখ ১৪৩১". */
	formattedFullBn: string;
}

export function isGregorianLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function pad(n: number, width: number): string {
	return String(n).padStart(width, '0');
}

function utcDate(year: number, month: number, day: number): Date {
	const d = new Date(0);
	d.setUTCFullYear(year, month - 1, day);
	d.setUTCHours(0, 0, 0, 0);
	return d;
}

function assertValidYmd({ year, month, day }: YMD): void {
	const d = utcDate(year, month, day);
	if (
		!Number.isInteger(year) ||
		year < 1000 ||
		year > 9999 ||
		d.getUTCFullYear() !== year ||
		d.getUTCMonth() !== month - 1 ||
		d.getUTCDate() !== day
	) {
		throw new Error(`Invalid date: ${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`);
	}
}

/**
 * Month lengths of a Bangla year in the revised Bangladesh calendar:
 * Boishakh-Ashwin 31 days, Kartik-Magh 30, Falgun 29 (30 in leap years), Choitro 30.
 */
export function banglaMonthLengths(banglaYear: number): number[] {
	const gregorianStartYear = banglaYear + 593;
	const falgun = isGregorianLeapYear(gregorianStartYear + 1) ? 30 : 29;
	return [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, falgun, 30];
}

export function isBanglaLeapYear(banglaYear: number): boolean {
	return banglaMonthLengths(banglaYear)[10] === 30;
}

export function gregorianToBangla(ymd: YMD): BanglaDate {
	assertValidYmd(ymd);
	const { year, month, day } = ymd;
	const startYear = month > 4 || (month === 4 && day >= 14) ? year : year - 1;
	const banglaYear = startYear - 593;
	const offset = Math.round(
		(utcDate(year, month, day).getTime() - utcDate(startYear, 4, 14).getTime()) / DAY_MS,
	);
	const lengths = banglaMonthLengths(banglaYear);
	let remaining = offset;
	let monthIndex = 0;
	while (remaining >= lengths[monthIndex]) {
		remaining -= lengths[monthIndex];
		monthIndex += 1;
	}
	const banglaDay = remaining + 1;
	const meta = BANGLA_MONTHS[monthIndex];
	const weekday = WEEKDAYS[utcDate(year, month, day).getUTCDay()];
	const formattedBn = `${toBanglaDigits(banglaDay)} ${meta.nameBn} ${toBanglaDigits(banglaYear)}`;
	return {
		gregorian: `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`,
		year: banglaYear,
		month: monthIndex + 1,
		day: banglaDay,
		monthName: meta.name,
		monthNameBn: meta.nameBn,
		season: meta.season,
		seasonBn: meta.seasonBn,
		weekday: weekday.name,
		weekdayBn: weekday.nameBn,
		dayOfYear: offset + 1,
		formatted: `${banglaDay} ${meta.name} ${banglaYear}`,
		formattedBn,
		formattedFullBn: `${weekday.nameBn}, ${formattedBn}`,
	};
}

/** Convert a Bangla date back to the Gregorian calendar. */
export function banglaToGregorian(
	banglaYear: number,
	banglaMonth: number,
	banglaDay: number,
): YMD & { iso: string } {
	if (
		!Number.isInteger(banglaYear) ||
		!Number.isInteger(banglaMonth) ||
		!Number.isInteger(banglaDay)
	) {
		throw new Error('Bangla year, month and day must be integers');
	}
	if (banglaMonth < 1 || banglaMonth > 12) throw new Error('Bangla month must be between 1 and 12');
	const lengths = banglaMonthLengths(banglaYear);
	if (banglaDay < 1 || banglaDay > lengths[banglaMonth - 1]) {
		throw new Error(
			`${BANGLA_MONTHS[banglaMonth - 1].name} ${banglaYear} has ${lengths[banglaMonth - 1]} days, got day ${banglaDay}`,
		);
	}
	const startYear = banglaYear + 593;
	if (startYear < 1000 || startYear > 9998)
		throw new Error('Bangla year is out of the supported range');
	let offset = banglaDay - 1;
	for (let i = 0; i < banglaMonth - 1; i += 1) offset += lengths[i];
	const date = new Date(utcDate(startYear, 4, 14).getTime() + offset * DAY_MS);
	const result = {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth() + 1,
		day: date.getUTCDate(),
	};
	return { ...result, iso: `${pad(result.year, 4)}-${pad(result.month, 2)}-${pad(result.day, 2)}` };
}

function shiftToZone(ms: number, offsetMinutes: number): YMD {
	const d = new Date(ms + offsetMinutes * 60_000);
	if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
	return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/**
 * Turn user input into a calendar date.
 *  - empty input means "now" in the given zone
 *  - "2024-04-14", "2024/04/14" and ISO date-times without a zone use the date as written
 *  - date-times with a zone (Z, +06:00), Date objects and epoch milliseconds are converted
 *    to the given UTC offset (default Dhaka, UTC+6)
 */
export function parseDateInput(
	input: unknown,
	offsetMinutes: number = DHAKA_OFFSET_MINUTES,
	now: () => number = Date.now,
): YMD {
	if (input === undefined || input === null || input === '')
		return shiftToZone(now(), offsetMinutes);
	if (input instanceof Date) return shiftToZone(input.getTime(), offsetMinutes);
	if (typeof input === 'number') return shiftToZone(input, offsetMinutes);
	if (typeof input !== 'string') {
		// Luxon DateTime and similar objects expose toISO()
		const maybe = input as { toISO?: () => string | null };
		if (typeof maybe.toISO === 'function') return parseDateInput(maybe.toISO(), offsetMinutes, now);
		throw new Error('Unsupported date value');
	}
	const text = toEnglishDigits(input).trim();
	const written = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/.exec(text);
	const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text) && /[T\s]/.test(text);
	if (written && !hasZone) {
		const ymd = { year: Number(written[1]), month: Number(written[2]), day: Number(written[3]) };
		assertValidYmd(ymd);
		return ymd;
	}
	if (/^\d{9,}$/.test(text)) return shiftToZone(Number(text), offsetMinutes);
	const ms = Date.parse(text);
	if (Number.isNaN(ms)) throw new Error(`"${input}" is not a valid date`);
	return shiftToZone(ms, offsetMinutes);
}

/** Convenience wrapper: any supported date input to a Bangla date. */
export function toBanglaDate(
	input: unknown,
	offsetMinutes: number = DHAKA_OFFSET_MINUTES,
	now: () => number = Date.now,
): BanglaDate {
	return gregorianToBangla(parseDateInput(input, offsetMinutes, now));
}
