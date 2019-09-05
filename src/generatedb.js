const fs = require('fs');
const path = require('path');

const {
    parseCSV,
} = require('./csv.js');

const {
    Submission,
} = require('./models.js');

const parseHasAttended = ans => {
    if (ans.includes('Yes, as')) {
        return true;
    } else {
        return false;
    }
}

if (Submission.all().length !== 0) {
    console.error(`Error: There are ${Submission.all().length} existing submissions in the database, so none were added.`);
} else {
    const csvContent = fs.readFileSync(path.join(__dirname, '../fixtures/applications.csv'), 'utf8');

    const rows = parseCSV(csvContent);

    // create Submission models
    let index = 0;
    for (const row of rows.slice(1)) {
        if (row.length === 1) {
            // is an empty row at the end
            break;
        }

        const sub = new Submission({
            number: ++ index,
            timestamp: row[0],
            email: row[1],
            full_name: row[2],
            grade_level: row[3],
            major: row[4],
            resume_url: row[5],
            ref_links: row[6],

            has_attended_before: parseHasAttended(row[7]),

            attended_roles: row[8],
            attended_question_1: row[9],
            attended_question_2: row[10],
            attended_interested_roles: row[11],
            attended_extras: row[12],

            not_attended_question_1: row[13],
            not_attended_question_2: row[14],
            not_attended_interested_roles: row[15],
            not_atended_extras: row[16],
        });
        sub.save();
    }

    console.log(`Generated ${index} director app submissions into the database`);
}
