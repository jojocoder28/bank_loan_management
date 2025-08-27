
const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

function convert_millions(n: number): string {
    if (n >= 1000000) {
        return convert_millions(Math.floor(n / 1000000)) + " million " + convert_thousands(n % 1000000);
    } else {
        return convert_thousands(n);
    }
}

function convert_thousands(n: number): string {
    if (n >= 1000) {
        return convert_hundreds(Math.floor(n / 1000)) + " thousand " + convert_hundreds(n % 1000);
    } else {
        return convert_hundreds(n);
    }
}

function convert_hundreds(n: number): string {
    if (n > 99) {
        return ones[Math.floor(n / 100)] + " hundred " + convert_tens(n % 100);
    } else {
        return convert_tens(n);
    }
}

function convert_tens(n: number): string {
    if (n < 10) return ones[n];
    else if (n >= 10 && n < 20) return teens[n - 10];
    else {
        return tens[Math.floor(n / 10)] + " " + ones[n % 10];
    }
}

export function numberToWords(num: number): string {
    if (num === 0) return 'zero';
    if (num < 0) return "minus " + numberToWords(Math.abs(num));
    
    // Handle the case where the number is a string from an input
    const number = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(number)) {
        return '';
    }

    return convert_millions(number).replace(/\s+/g, ' ').trim();
}
