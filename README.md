# n8n-nodes-bangladesh

[![CI](https://github.com/saizul/n8n-nodes-bangladesh/actions/workflows/ci.yml/badge.svg)](https://github.com/saizul/n8n-nodes-bangladesh/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/n8n-nodes-bangladesh.svg)](https://www.npmjs.com/package/n8n-nodes-bangladesh)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

An [n8n](https://n8n.io) community node with everyday helpers for workflows that deal with
Bangladesh: phone numbers, Taka amounts, Bangla numerals, the Bangla calendar, Bangla text and
administrative geography. One node, no credentials, no network calls, no runtime dependencies.

[Install](#installation) · [Operations](#operations) · [Examples](#examples) · [বাংলা](#বাংলা) · [Development](#development)

## Installation

### In the n8n editor (recommended)

1. Open **Settings > Community Nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-bangladesh` and accept the community node risk notice.
4. Select **Install**. The **Bangladesh Utils** node now shows up in the node panel.

### Self-hosted with npm

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-bangladesh
```

Restart n8n afterwards. See the
[n8n community nodes guide](https://docs.n8n.io/integrations/community-nodes/installation/)
for Docker and queue-mode notes.

## Operations

The node processes every input item separately, keeps the link to the source item
(paired items) and supports **Continue On Fail**: a failing item becomes `{ "error": "..." }`
instead of stopping the workflow. Enable **Options > Include Input Fields** to copy the incoming
fields into the output.

| Resource    | Operation            | What it does                                                                     |
| ----------- | -------------------- | -------------------------------------------------------------------------------- |
| **Phone**   | Validate             | Is it a valid BD mobile number? Returns reason, E.164, operator                  |
|             | Normalize            | `+8801712345678`, `01712345678`, `01712 345678`, `+880 1712 345678`              |
|             | Detect Operator      | 013/017 Grameenphone, 014/019 Banglalink, 016/018 Robi, 015 Teletalk             |
|             | Mask                 | `017******78` with configurable visible digits and mask character                |
|             | WhatsApp Link        | `https://wa.me/8801712345678?text=...`                                           |
| **Number**  | To Words             | `1234` to "এক হাজার দুইশ চৌত্রিশ" or "One Thousand Two Hundred Thirty Four"      |
|             | Taka Amount in Words | Cheque style with Taka, Paisa and "মাত্র" / "Only"                               |
|             | Format (Lakh/Crore)  | `1234567.5` to `12,34,567.50`, optional Bangla digits, prefix, suffix            |
|             | Convert Digits       | `2024` to `২০২৪` and back, inside any text                                       |
| **Date**    | To Bangla Date       | Gregorian to Bangla calendar with month, weekday and season names                |
|             | From Bangla Date     | Bangla year, month and day back to the Gregorian date                            |
| **Text**    | Normalize            | Unicode NFC, strip zero-width/invisible characters, optional whitespace collapse |
|             | Slugify              | `আমার সোনার বাংলা` to `amar-sonar-bangla`                                        |
|             | Transliterate        | Phonetic Bangla to Latin text                                                    |
|             | Count Graphemes      | Reader-perceived characters, code points, words                                  |
| **Address** | List Divisions       | The 8 divisions with district counts                                             |
|             | List Districts       | The 64 districts, optionally for one division                                    |
|             | Lookup District      | District name (English or Bangla) to its division                                |

All operations accept Bangla digits (০-৯) in their inputs where numbers are expected.

### Details worth knowing

- **Phone numbers** must be mobile numbers: `01[3-9]` followed by 8 digits. Accepted spellings
  include `01712345678`, `8801712345678`, `+880 1712-345678`, `008801712345678`, `1712345678`
  and the same in Bangla digits. Validate returns `valid: false` with a `reason`
  (`empty`, `invalid_characters`, `invalid_length`, `invalid_prefix`) instead of failing; the other
  phone operations raise an error for invalid numbers, which Continue On Fail can catch.
- **Operator detection uses the prefix.** Numbers ported between operators (MNP) keep their old
  prefix, so the result is the original operator.
- **Numbers are read as text**, so large values and decimals never suffer floating-point errors.
  Up to 15 integer digits are supported. A leading `৳`, `Tk` or `BDT` and thousands separators are
  ignored. Amounts are rounded half up to whole paisa.
- **Words use the South Asian scale** (হাজার, লক্ষ, কোটি / Thousand, Lakh, Crore). Bangla
  words cover every number from 0 to 99 with its own irregular form (for example 69 is ঊনসত্তর).
- **Bangla calendar** follows the revised calendar of Bangladesh (1987): 1 Boishakh is
  14 April, Boishakh to Ashwin have 31 days, Kartik to Magh and Choitro 30, Falgun 29 days or
  30 in a leap year. Dates without a time zone are used as written; date-times with a zone, JS dates
  and "now" are converted to the chosen UTC offset (default +6, Bangladesh Standard Time).
- **Slugs are phonetic and approximate.** The transliteration is designed for URLs, file names and
  search keys, not as a scholarly romanization. Word-final inherent vowels are dropped, so
  `বাংলাদেশ` becomes `bangladesh`.

## Examples

### Validate and normalize numbers from a form

Input item: `{ "mobile": "+৮৮০ ১৭১২-৩৪৫৬৭৮" }`

Phone > Validate, **Phone Number** = `{{ $json.mobile }}`:

```json
{
	"input": "+৮৮০ ১৭১২-৩৪৫৬৭৮",
	"valid": true,
	"reason": null,
	"e164": "+8801712345678",
	"local": "01712345678",
	"operator": "Grameenphone",
	"operatorBn": "গ্রামীণফোন"
}
```

Then add an **IF** node on `{{ $json.valid }}` and send valid numbers to your SMS or
WhatsApp step. Phone > WhatsApp Link gives you
`https://wa.me/8801712345678?text=Your%20order%20is%20ready`.

### Amount in words for an invoice or cheque

Number > Taka Amount in Words, **Number** = `1234.5`:

| Language | Result                                                         |
| -------- | -------------------------------------------------------------- |
| Bangla   | এক হাজার দুইশ চৌত্রিশ টাকা পঞ্চাশ পয়সা মাত্র                  |
| English  | One Thousand Two Hundred Thirty Four Taka and Fifty Paisa Only |

### Lakh/crore formatting with Bangla digits

Number > Format, **Number** = `1234567.5`, **Decimal Places** = `2`, **Output Digits** = Bangla,
**Prefix** = `৳ `:

```text
৳ ১২,৩৪,৫৬৭.৫০
```

### Bangla date for a message

Date > To Bangla Date, **Date** = `2024-04-14` (leave empty for today):

```json
{
	"gregorian": "2024-04-14",
	"year": 1431,
	"month": 1,
	"day": 1,
	"monthName": "Boishakh",
	"monthNameBn": "বৈশাখ",
	"weekdayBn": "রবিবার",
	"seasonBn": "গ্রীষ্ম",
	"formatted": "1 Boishakh 1431",
	"formattedBn": "১ বৈশাখ ১৪৩১",
	"formattedFullBn": "রবিবার, ১ বৈশাখ ১৪৩১"
}
```

### Slugs for Bangla blog titles

Text > Slugify, **Text** = `আমার সোনার বাংলা` returns `{ "slug": "amar-sonar-bangla" }`.

### Find the division of a district

Address > Lookup District, **District Name** = `Comilla`:

```json
{
	"query": "Comilla",
	"found": true,
	"district": "Cumilla",
	"districtBn": "কুমিল্লা",
	"division": "Chattogram",
	"divisionBn": "চট্টগ্রাম"
}
```

Unknown names return `found: false` rather than an error, so you can branch on the result.
Case, spacing and common older spellings (Comilla, Chittagong, Jessore, Bogra, Barisal) are handled.

## বাংলা

**n8n-nodes-bangladesh** হলো বাংলাদেশের ওয়ার্কফ্লো অটোমেশনের জন্য একটি n8n কমিউনিটি নোড।
কোনো ক্রেডেনশিয়াল বা ইন্টারনেট সংযোগ ছাড়াই এটি কাজ করে।

### ইনস্টল করার নিয়ম

1. n8n-এ **Settings > Community Nodes** খুলুন।
2. **Install** চাপুন এবং `n8n-nodes-bangladesh` লিখুন।
3. ঝুঁকির নোটিশটি মেনে নিয়ে **Install** চাপুন। এরপর নোড প্যানেলে **Bangladesh Utils** পাওয়া যাবে।

### কী কী করা যায়

- **ফোন নম্বর:** যাচাই, `+৮৮০` বা `০১৭…` ফরম্যাটে রূপান্তর, অপারেটর শনাক্ত (গ্রামীণফোন, বাংলালিংক,
  রবি, টেলিটক), মাঝের অংশ লুকানো এবং হোয়াটসঅ্যাপ লিংক। বাংলা অঙ্কে লেখা নম্বরও চলে।
- **সংখ্যা:** সংখ্যা থেকে বাংলা বা ইংরেজি কথায় রূপ (যেমন ১২৩৪ থেকে "এক হাজার দুইশ চৌত্রিশ"),
  টাকার অঙ্ক কথায় ("... টাকা ... পয়সা মাত্র"), লক্ষ-কোটি হিসাবে কমা বসানো (১২,৩৪,৫৬৭) এবং
  বাংলা ও ইংরেজি অঙ্কের মধ্যে রূপান্তর।
- **তারিখ:** ইংরেজি তারিখ থেকে বাংলা সন, মাস, বার ও ঋতু (সংশোধিত বাংলাদেশ পঞ্জিকা অনুযায়ী,
  ১ বৈশাখ = ১৪ এপ্রিল), এবং বাংলা তারিখ থেকে ইংরেজি তারিখ।
- **লেখা:** বাংলা লেখা থেকে ইংরেজি হরফে স্লাগ বা প্রতিবর্ণীকরণ (ধ্বনিভিত্তিক, আনুমানিক) এবং
  যুক্তাক্ষরসহ বর্ণ (গ্রাফিম) গণনা।
- **ঠিকানা:** ৮টি বিভাগ ও ৬৪টি জেলার তালিকা (বাংলা ও ইংরেজি নামসহ) এবং জেলার নাম থেকে বিভাগ খুঁজে বের করা।

### উদাহরণ

| ইনপুট          | অপারেশন              | ফলাফল                                         |
| -------------- | -------------------- | --------------------------------------------- |
| `০১৭১২-৩৪৫৬৭৮` | Phone > Normalize    | `+8801712345678`                              |
| `১২৩৪.৫০`      | Taka Amount in Words | এক হাজার দুইশ চৌত্রিশ টাকা পঞ্চাশ পয়সা মাত্র |
| `1234567`      | Format (Lakh/Crore)  | `12,34,567` (বাংলা অঙ্কে `১২,৩৪,৫৬৭`)         |
| `2024-04-14`   | To Bangla Date       | ১ বৈশাখ ১৪৩১                                  |
| `কুমিল্লা`     | Lookup District      | চট্টগ্রাম বিভাগ                               |

## Development

```bash
npm install --ignore-scripts   # n8n-workflow only needs to provide types here
npm run lint
npm test
npm run build
```

All logic is plain TypeScript under `nodes/BangladeshUtils/lib/` and is unit tested without n8n.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the layout and for testing the node inside n8n, and
[CHANGELOG.md](CHANGELOG.md) for release notes.

## Compatibility

Built against `n8n-workflow` 2.x with `n8nNodesApiVersion` 1. Requires Node.js 22 or newer.

## Author

Made by [Saizul Amin](https://saizul.com), automation specialist from Bangladesh.

## License

[MIT](LICENSE)
