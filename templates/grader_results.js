const {
    Submission,
} = require('../src/models.js');

const sortBy = require('lodash.sortby');

const render = (grader) => {
    return `
        <h1>Results for ${grader}</h1>
        <p>Names, emails, and scores ${grader} gave the submission</p>
        <ol class="submissions">
            ${sortBy(Submission.where({rejected: false}), s => -s.getGraderGrade(grader)).map(sub => {
                return `
                    <li>
                    ${sub.get('full_name')}
                    <a href="/submissions/${sub.get('number')}">${sub.get('email')}</a>
                    (${~~(sub.getGraderGrade(grader) * 100) / 100})
                    </li>
                `;
            }).join('\n')}
        </ol>
    `;
}

module.exports = render;
