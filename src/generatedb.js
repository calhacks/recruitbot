const fs = require('fs');
const path = require('path');

const {
    parseCSV,
} = require('./csv.js');

const {
    Submission,
} = require('./models.js');

if (Submission.all().length !== 0) {
    console.error(`Error: There are ${Submission.all().length} existing submissions in the database, so none were added.`);
} else {
    const csvContent = fs.readFileSync(path.join(__dirname, '../fixtures/applications.csv'), 'utf8');

    const rows = parseCSV(csvContent);

    // create Submission models
    let index = 0;
    for (const row of rows.slice(1)) {
        const sub = new Submission({
            number: ++ index,
            timestamp: row[0],
            username: row[1],
            full_name: row[2],
            grade_level: row[3],
            major: row[4],
            resume_url: row[5],
            design_portfolio: row[6],
            tech_portfolio: row[7],
            attended_calhacks_before: row[8],
            question_1: row[9],
            question_2: row[10],
            interested_roles: row[11],
            extras: row[12],
        });
        sub.save();
    }

    console.log(`Generated ${index} director app submissions into the database`);
}
