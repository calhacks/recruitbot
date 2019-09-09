const {
    Submission,
} = require('../src/models.js');

const sortBy = require('lodash.sortby');

const render = () => {
    return `
        <h1>Results</h1>
        <p>Names, emails, and scores normalized to the 2 - 9 range</p>
        <ol class="submissions">
            ${sortBy(Submission.where({rejected: false}), s => -s.getNormalizedOverallGrade()).map(sub => {
                return `
                    <li>
                    ${sub.get('full_name')}
                    <a href="/submissions/${sub.get('number')}">${sub.get('email')}</a>
                    (${~~(sub.getNormalizedOverallGrade() * 100) / 100})
                    </li>
                `;
            }).join('\n')}
        </ol>
    `;
}

module.exports = render;
