const headerTemplate = require('../templates/pageheader.js');
const footerTemplate = require('../templates/pagefooter.js');

const dashboardTemplate = require('../templates/dashboard.js');
const resultsTemplate = require('../templates/results.js');
const graderResultsTemplate = require('../templates/grader_results.js');
const csvResultsTemplate = require('../templates/csv_results.js');
const statsTemplate = require('../templates/stats.js');

// Renders a full page with Studybuddy header and footer
const renderFullPage = (title, innerPage) => {
    return headerTemplate(title) + innerPage + footerTemplate();
}

const dashboardView = () => {
    const innerPage = dashboardTemplate();

    return renderFullPage(
        'Applications',
        innerPage
    );
}

const resultsView = () => {
    const innerPage = resultsTemplate();

    return renderFullPage(
        'Results',
        innerPage
    );
}

const graderResultsView = params => {
    const innerPage = graderResultsTemplate(params.grader);

    return renderFullPage(
        'Results for ${params.grader}',
        innerPage
    );
}

const csvResultsView = () => {
    const innerPage = csvResultsTemplate();

    return renderFullPage(
        'Results List',
        innerPage
    );
}

const statsView = () => {
    const innerPage = statsTemplate();

    return renderFullPage(
        'Grading stats',
        innerPage
    );
}

module.exports = {
    dashboardView,
    resultsView,
    graderResultsView,
    statsView,
    csvResultsView,
};
