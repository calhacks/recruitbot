// CSV loader and processor for applications.js

const parseCSV = content => {

    // sanitize
    content.replace(/\r\n/g, '\n');

    const rows = [];

    let inQuotedString = false;
    let currentRow = [];
    let currentValue = '';

    const addBufferedRow = () => {
        rows.push(currentRow);
        currentRow = [];
    }

    const addBufferedValue = () => {
        currentRow.push(currentValue);
        currentValue = '';
    }

    for (const char of content) {
        if (char === '"') {
            inQuotedString = !inQuotedString;
        } else {
            if (inQuotedString) {
                currentValue += char;
            } else if (char === '\n') {
                addBufferedValue();
                addBufferedRow();
            } else if (char === ',') {
                addBufferedValue();
            } else {
                currentValue += char;
            }
        }
    }

    addBufferedValue();
    addBufferedRow();

    return rows;
}

module.exports = {
    parseCSV,
}
