
const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

function convert(n: number): string {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    const digit = n % 10;
    return `${tens[Math.floor(n / 10)]}${digit ? " " + ones[digit] : ""}`;
}

export function numberToWords(num: number): string {
    if (num === 0) return 'zero';
    if (num < 0) return "minus " + numberToWords(Math.abs(num));
    
    const number = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(number)) {
        return '';
    }

    let words = '';

    if (number >= 10000000) {
        words += convert(Math.floor(number / 10000000)) + " crore ";
        if (number % 10000000) {
            words += numberToWords(number % 10000000);
        }
        return words.trim();
    }

    if (number >= 100000) {
        words += convert(Math.floor(number / 100000)) + " lakh ";
        if (number % 100000) {
            words += numberToWords(number % 100000);
        }
        return words.trim();
    }
    
    if (number >= 1000) {
        words += convert(Math.floor(number / 1000)) + " thousand ";
         if (number % 1000) {
            words += numberToWords(number % 1000);
        }
        return words.trim();
    }

    if (number >= 100) {
        words += convert(Math.floor(number / 100)) + " hundred ";
         if (number % 100) {
            words += numberToWords(number % 100);
        }
        return words.trim();
    }
    
    return convert(number);
}
