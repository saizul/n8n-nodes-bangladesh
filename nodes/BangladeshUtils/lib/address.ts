export interface Division {
	name: string;
	nameBn: string;
}

export interface District {
	name: string;
	nameBn: string;
	division: string;
	divisionBn: string;
}

export const DIVISIONS: readonly Division[] = [
	{ name: 'Barishal', nameBn: 'বরিশাল' },
	{ name: 'Chattogram', nameBn: 'চট্টগ্রাম' },
	{ name: 'Dhaka', nameBn: 'ঢাকা' },
	{ name: 'Khulna', nameBn: 'খুলনা' },
	{ name: 'Mymensingh', nameBn: 'ময়মনসিংহ' },
	{ name: 'Rajshahi', nameBn: 'রাজশাহী' },
	{ name: 'Rangpur', nameBn: 'রংপুর' },
	{ name: 'Sylhet', nameBn: 'সিলেট' },
];

type DistrictSeed = readonly [name: string, nameBn: string];

const DISTRICT_SEEDS: Readonly<Record<string, readonly DistrictSeed[]>> = {
	Barishal: [
		['Barguna', 'বরগুনা'],
		['Barishal', 'বরিশাল'],
		['Bhola', 'ভোলা'],
		['Jhalokati', 'ঝালকাঠি'],
		['Patuakhali', 'পটুয়াখালী'],
		['Pirojpur', 'পিরোজপুর'],
	],
	Chattogram: [
		['Bandarban', 'বান্দরবান'],
		['Brahmanbaria', 'ব্রাহ্মণবাড়িয়া'],
		['Chandpur', 'চাঁদপুর'],
		['Chattogram', 'চট্টগ্রাম'],
		['Cumilla', 'কুমিল্লা'],
		["Cox's Bazar", 'কক্সবাজার'],
		['Feni', 'ফেনী'],
		['Khagrachhari', 'খাগড়াছড়ি'],
		['Lakshmipur', 'লক্ষ্মীপুর'],
		['Noakhali', 'নোয়াখালী'],
		['Rangamati', 'রাঙ্গামাটি'],
	],
	Dhaka: [
		['Dhaka', 'ঢাকা'],
		['Faridpur', 'ফরিদপুর'],
		['Gazipur', 'গাজীপুর'],
		['Gopalganj', 'গোপালগঞ্জ'],
		['Kishoreganj', 'কিশোরগঞ্জ'],
		['Madaripur', 'মাদারীপুর'],
		['Manikganj', 'মানিকগঞ্জ'],
		['Munshiganj', 'মুন্সিগঞ্জ'],
		['Narayanganj', 'নারায়ণগঞ্জ'],
		['Narsingdi', 'নরসিংদী'],
		['Rajbari', 'রাজবাড়ী'],
		['Shariatpur', 'শরীয়তপুর'],
		['Tangail', 'টাঙ্গাইল'],
	],
	Khulna: [
		['Bagerhat', 'বাগেরহাট'],
		['Chuadanga', 'চুয়াডাঙ্গা'],
		['Jashore', 'যশোর'],
		['Jhenaidah', 'ঝিনাইদহ'],
		['Khulna', 'খুলনা'],
		['Kushtia', 'কুষ্টিয়া'],
		['Magura', 'মাগুরা'],
		['Meherpur', 'মেহেরপুর'],
		['Narail', 'নড়াইল'],
		['Satkhira', 'সাতক্ষীরা'],
	],
	Mymensingh: [
		['Jamalpur', 'জামালপুর'],
		['Mymensingh', 'ময়মনসিংহ'],
		['Netrokona', 'নেত্রকোণা'],
		['Sherpur', 'শেরপুর'],
	],
	Rajshahi: [
		['Bogura', 'বগুড়া'],
		['Chapainawabganj', 'চাঁপাইনবাবগঞ্জ'],
		['Joypurhat', 'জয়পুরহাট'],
		['Naogaon', 'নওগাঁ'],
		['Natore', 'নাটোর'],
		['Pabna', 'পাবনা'],
		['Rajshahi', 'রাজশাহী'],
		['Sirajganj', 'সিরাজগঞ্জ'],
	],
	Rangpur: [
		['Dinajpur', 'দিনাজপুর'],
		['Gaibandha', 'গাইবান্ধা'],
		['Kurigram', 'কুড়িগ্রাম'],
		['Lalmonirhat', 'লালমনিরহাট'],
		['Nilphamari', 'নীলফামারী'],
		['Panchagarh', 'পঞ্চগড়'],
		['Rangpur', 'রংপুর'],
		['Thakurgaon', 'ঠাকুরগাঁও'],
	],
	Sylhet: [
		['Habiganj', 'হবিগঞ্জ'],
		['Moulvibazar', 'মৌলভীবাজার'],
		['Sunamganj', 'সুনামগঞ্জ'],
		['Sylhet', 'সিলেট'],
	],
};

export const DISTRICTS: readonly District[] = DIVISIONS.flatMap((division) =>
	DISTRICT_SEEDS[division.name].map(([name, nameBn]) => ({
		name,
		nameBn,
		division: division.name,
		divisionBn: division.nameBn,
	})),
);

/** Common alternative spellings, mapped to the official English name. */
const ALIASES: Readonly<Record<string, string>> = {
	barisal: 'Barishal',
	chittagong: 'Chattogram',
	chittagongdivision: 'Chattogram',
	comilla: 'Cumilla',
	coxsbazar: "Cox's Bazar",
	coxbazar: "Cox's Bazar",
	coxsbazaar: "Cox's Bazar",
	jessore: 'Jashore',
	bogra: 'Bogura',
	jhalakathi: 'Jhalokati',
	jhalokathi: 'Jhalokati',
	patuakhali: 'Patuakhali',
	netrakona: 'Netrokona',
	maulvibazar: 'Moulvibazar',
	moulvibazar: 'Moulvibazar',
	maulavibazar: 'Moulvibazar',
	nawabganj: 'Chapainawabganj',
	chapainawabganj: 'Chapainawabganj',
	chapaingnawabganj: 'Chapainawabganj',
	chapainababganj: 'Chapainawabganj',
	brahmanbaria: 'Brahmanbaria',
	brahmonbaria: 'Brahmanbaria',
	narshingdi: 'Narsingdi',
	narsinghdi: 'Narsingdi',
	laxmipur: 'Lakshmipur',
	lakshmipur: 'Lakshmipur',
	khagrachari: 'Khagrachhari',
	khagrachhari: 'Khagrachhari',
	joypurhat: 'Joypurhat',
	jaipurhat: 'Joypurhat',
	munshiganj: 'Munshiganj',
	munshigonj: 'Munshiganj',
	narayangonj: 'Narayanganj',
	sariatpur: 'Shariatpur',
	shariatpur: 'Shariatpur',
	rangamati: 'Rangamati',
	barguna: 'Barguna',
};

function key(value: string): string {
	return value
		.normalize('NFC')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '');
}

const BY_KEY = new Map<string, District>();
for (const district of DISTRICTS) {
	BY_KEY.set(key(district.name), district);
	BY_KEY.set(key(district.nameBn), district);
}

export function listDivisions(): Array<Division & { districtCount: number }> {
	return DIVISIONS.map((division) => ({
		...division,
		districtCount: DISTRICT_SEEDS[division.name].length,
	}));
}

/** Resolve a division from its English or Bangla name (case-insensitive). */
export function findDivision(query: string): Division | undefined {
	const k = key(query);
	if (k === '') return undefined;
	if (k === 'chittagong') return DIVISIONS[1];
	if (k === 'barisal') return DIVISIONS[0];
	return DIVISIONS.find((d) => key(d.name) === k || key(d.nameBn) === k);
}

/** List all 64 districts, or the districts of one division. Throws for unknown divisions. */
export function listDistricts(division?: string): District[] {
	if (division === undefined || division === '' || key(division) === 'all') return [...DISTRICTS];
	const found = findDivision(division);
	if (!found) throw new Error(`Unknown division: "${division}"`);
	return DISTRICTS.filter((d) => d.division === found.name);
}

/** Find a district by English or Bangla name, ignoring case, spaces and punctuation. */
export function lookupDistrict(query: string): District | undefined {
	const k = key(String(query ?? ''));
	if (k === '') return undefined;
	const direct = BY_KEY.get(k);
	if (direct) return direct;
	const alias = ALIASES[k];
	return alias ? BY_KEY.get(key(alias)) : undefined;
}
