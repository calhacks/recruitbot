const {
    Submission,
    Grade,
} = require('./models.js');

const error = reason => {
    return {
        success: false,
        error: reason,
    }
}

const api = {
    submission: {},
    grade: {},
}

// SUBMISSION

const findSubmissionWithIdentifier = identifier => {
    let submission;
    if (identifier.includes('@berkeley.edu')) {
        submission = Submission.where({username: identifier})[0];
    } else {
        submission = Submission.find(identifier);
    }

    if (!submission) {
        submission = Submission.where({number: +identifier})[0];
    }

    return submission;
}

api.submission.get = params => {
    if (params.submission_id) {
        const submission = findSubmissionWithIdentifier(params.submission_id);
        if (submission) {
            return submission.toJSON();
        } else {
            return error(`Could not find submission with id ${params.submission_id}`);
        }
    } else {
        return error('Invalid request');
    }
}

api.submission.get_grades = params => {
    if (params.submission_id) {
        const submission = findSubmissionWithIdentifier(params.submission_id);
        if (submission) {
            return submission.getGrades().map(g => g.toJSON());
        } else {
            return error(`Could not find submission with id ${params.submission_id}`);
        }
    } else {
        return error('Invalid request');
    }
}

// GRADE

api.grade.get = params => {
    if (params.grade_id) {
        const grade = Grade.find(grade_id);
        if (grade) {
            return grade.toJSON();
        } else {
            return error(`Could not find grade with id ${params.grade_id}`);
        }
    } else {
        return error('Invalid request');
    }
}

api.grade.post = (_params, _query, body) => {
    let grade = Grade.where({
        submission_id: body.submission_id,
        graded_by: body.graded_by,
    })[0];
    if (!grade) {
        grade = new Grade();
    }
    grade.setAttributes(body);
    grade.save();
    return grade.toJSON();
}

api.grade.delete = params => {
    const grade = Grade.find(params.grade_id);
    if (grade) {
        grade.delete();
        return true;
    } else {
        return error(`Could not find a grade with id ${params.grade_id}`);
    }
}

module.exports = api;
