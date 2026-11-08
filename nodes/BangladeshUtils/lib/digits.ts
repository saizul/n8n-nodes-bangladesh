const BANGLA_ZERO_CODE = 0x09e6;

/** Convert ASCII digits (0-9) to Bangla digits (০-৯). Other characters are untouched. */
export function toBanglaDigits(input: string | number | bigint): string {
	return String(input).replace(/[0-9]/g, (d) => String.fromCharCode(BANGLA_ZERO_CODE + Number(d)));
}

/** Convert Bangla digits (০-৯) to ASCII digits (0-9). Other characters are untouched. */
export function toEnglishDigits(input: string | number | bigint): string {
	return String(input).replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - BANGLA_ZERO_CODE));
}
