import { describe, expect, it } from 'vitest';

import {
	DISTRICTS,
	DIVISIONS,
	findDivision,
	listDistricts,
	listDivisions,
	lookupDistrict,
} from '../nodes/BangladeshUtils/lib';

describe('data integrity', () => {
	it('has 8 divisions and 64 districts', () => {
		expect(DIVISIONS).toHaveLength(8);
		expect(DISTRICTS).toHaveLength(64);
	});

	it('has unique English and Bangla names', () => {
		expect(new Set(DISTRICTS.map((d) => d.name)).size).toBe(64);
		expect(new Set(DISTRICTS.map((d) => d.nameBn)).size).toBe(64);
		expect(new Set(DIVISIONS.map((d) => d.name)).size).toBe(8);
	});

	it('gives every district a division and Bangla text', () => {
		for (const district of DISTRICTS) {
			expect(DIVISIONS.map((d) => d.name)).toContain(district.division);
			expect(district.nameBn).toMatch(/[ঀ-৿]/);
			expect(district.divisionBn).toMatch(/[ঀ-৿]/);
		}
	});

	it.each([
		['Barishal', 6],
		['Chattogram', 11],
		['Dhaka', 13],
		['Khulna', 10],
		['Mymensingh', 4],
		['Rajshahi', 8],
		['Rangpur', 8],
		['Sylhet', 4],
	])('%s has %i districts', (division, count) => {
		expect(listDistricts(division)).toHaveLength(count);
		expect(listDivisions().find((d) => d.name === division)?.districtCount).toBe(count);
	});
});

describe('lookupDistrict', () => {
	it.each([
		['Dhaka', 'Dhaka', 'Dhaka'],
		['dhaka', 'Dhaka', 'Dhaka'],
		['  DHAKA  ', 'Dhaka', 'Dhaka'],
		['Gazipur', 'Gazipur', 'Dhaka'],
		['Cumilla', 'Cumilla', 'Chattogram'],
		['Comilla', 'Cumilla', 'Chattogram'],
		['Chittagong', 'Chattogram', 'Chattogram'],
		["Cox's Bazar", "Cox's Bazar", 'Chattogram'],
		['coxs bazar', "Cox's Bazar", 'Chattogram'],
		['Cox Bazar', "Cox's Bazar", 'Chattogram'],
		['Barisal', 'Barishal', 'Barishal'],
		['Jessore', 'Jashore', 'Khulna'],
		['Bogra', 'Bogura', 'Rajshahi'],
		['Chapai Nawabganj', 'Chapainawabganj', 'Rajshahi'],
		['Nawabganj', 'Chapainawabganj', 'Rajshahi'],
		['Sylhet', 'Sylhet', 'Sylhet'],
		['Maulvibazar', 'Moulvibazar', 'Sylhet'],
		['Rangpur', 'Rangpur', 'Rangpur'],
		['Netrakona', 'Netrokona', 'Mymensingh'],
		['Mymensingh', 'Mymensingh', 'Mymensingh'],
		['Khulna', 'Khulna', 'Khulna'],
		['Pirojpur', 'Pirojpur', 'Barishal'],
		['Thakurgaon', 'Thakurgaon', 'Rangpur'],
		['Brahmanbaria', 'Brahmanbaria', 'Chattogram'],
	])('%s -> %s (%s)', (query, name, division) => {
		const result = lookupDistrict(query);
		expect(result?.name).toBe(name);
		expect(result?.division).toBe(division);
	});

	it.each([
		['ঢাকা', 'Dhaka'],
		['কুমিল্লা', 'Cumilla'],
		['চট্টগ্রাম', 'Chattogram'],
		['সিলেট', 'Sylhet'],
		['ময়মনসিংহ', 'Mymensingh'],
		['কক্সবাজার', "Cox's Bazar"],
	])('finds Bangla name %s', (query, name) => {
		expect(lookupDistrict(query)?.name).toBe(name);
	});

	it('returns Bangla division names', () => {
		expect(lookupDistrict('Bogura')?.divisionBn).toBe('রাজশাহী');
	});

	it('finds every district by its own name', () => {
		for (const district of DISTRICTS) {
			expect(lookupDistrict(district.name)).toEqual(district);
			expect(lookupDistrict(district.nameBn)).toEqual(district);
		}
	});

	it.each(['', '   ', 'Atlantis', '123'])('returns undefined for %j', (query) => {
		expect(lookupDistrict(query)).toBeUndefined();
	});
});

describe('divisions', () => {
	it('lists divisions with Bangla names', () => {
		const names = listDivisions().map((d) => d.nameBn);
		expect(names).toContain('ঢাকা');
		expect(names).toContain('ময়মনসিংহ');
	});

	it('finds a division by English or Bangla name', () => {
		expect(findDivision('sylhet')?.nameBn).toBe('সিলেট');
		expect(findDivision('রংপুর')?.name).toBe('Rangpur');
		expect(findDivision('Chittagong')?.name).toBe('Chattogram');
		expect(findDivision('Barisal')?.name).toBe('Barishal');
		expect(findDivision('nowhere')).toBeUndefined();
		expect(findDivision('')).toBeUndefined();
	});

	it('lists all districts when no division is given', () => {
		expect(listDistricts()).toHaveLength(64);
		expect(listDistricts('all')).toHaveLength(64);
		expect(listDistricts('')).toHaveLength(64);
	});

	it('filters by Bangla division name', () => {
		expect(listDistricts('সিলেট').map((d) => d.name)).toEqual([
			'Habiganj',
			'Moulvibazar',
			'Sunamganj',
			'Sylhet',
		]);
	});

	it('throws for an unknown division', () => {
		expect(() => listDistricts('Narnia')).toThrow(/Unknown division/);
	});
});
