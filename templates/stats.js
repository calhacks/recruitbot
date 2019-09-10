const {
    Submission,
    Grade,
} = require('../src/models.js');

const sortBy = require('lodash.sortby');

const render = () => {

    const graderByCount = {};
    for (const grade of Grade.all()) {
        const grader = grade.get('graded_by');
        if (grader in graderByCount) {
            graderByCount[grader] ++;
        } else {
            graderByCount[grader] = 1;
        }
    }

    return `
        <h1>Stats</h1>
        <p>Grading <strong>${Submission.all().length}</strong> director applications</p>
        <ul class="submissions">
            ${sortBy(Object.entries(graderByCount), pair => pair[1]).map(([grader, count]) => {
                return `<li><strong>${count}</strong> graded by <a href="/results/${grader}">${grader}</a></li>`;
            }).join('\n')}
        </ul>
    `;
}

module.exports = render;
