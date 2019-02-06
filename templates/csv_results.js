const {
    Submission,
} = require('../src/models.js');

const sortBy = require('lodash.sortby');

const render = () => {
    return `
        <h1>Results List</h1>
        <p>Names</p>
        <ol class="submissions">
            ${sortBy(Submission.all(), s => -s.getNormalizedOverallGrade()).map(sub => {
                return `
                    <li>
                    ${sub.get('full_name')}
                    </li>
                `;
            }).join('\n')}
        </ol>
        <p>Emails</p>
        <ol class="submissions">
            ${sortBy(Submission.all(), s => -s.getNormalizedOverallGrade()).map(sub => {
                return `
                    <li>
                    ${sub.get('username')}
                    </li>
                `;
            }).join('\n')}
        </ol>
    `;
}

module.exports = render;
