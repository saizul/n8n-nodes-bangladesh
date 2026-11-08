# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-11-08

### Added

- **Bangladesh Utils** node with five resources and no credentials.
- Phone: validate, normalize (E.164, local, spaced, digits only), detect operator
  (013/017 Grameenphone, 014/019 Banglalink, 016/018 Robi, 015 Teletalk), mask and
  WhatsApp link. Bangla digits are accepted everywhere.
- Number: to words (Bangla and English), Taka amount in words with Paisa and
  "মাত্র" / "Only", lakh/crore formatting, Bangla and English digit conversion.
- Date: Gregorian to Bangla calendar (revised Bangladesh calendar) with month, weekday and
  season names, and Bangla to Gregorian.
- Text: Bangla to Latin slug, Bangla to Latin transliteration, grapheme counting.
- Address: the 8 divisions and 64 districts in English and Bangla, and district to division
  lookup with common alternative spellings.
- Per-item processing, `continueOnFail` support, paired items and usable-as-tool flag.
- Unit tests for every library function and for the node description and execution.
