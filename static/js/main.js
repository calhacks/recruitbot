const {
    Styled,
    Component,
    StyledComponent,
    Router,
} = Torus;

const clipRange = (val, min, max) => {
    if (val > min) {
        return val < max ? val : max;
    } else {
        return min;
    }
}

const pillify = stringList => {
    return stringList.split(';').map(item => {
        return jdom`<div class="pill">${item}</div>`;
    });
}

const paragraph = str => {
    return str.split('\n').map(line => jdom`<p>${line}</p>`);
}

class SubmissionView extends Styled(Component.from(data => {
    return jdom`<div class="submission_review">
        <div class="submission_demography">
            <div class="info">
                <p class="label">Name</p>
                <p>${data.full_name}</p>
            </div>
            <div class="info">
                <p class="label">Email</p>
                <p style="word-wrap:break-word">${data.username}</p>
            </div>
            <div class="info">
                <p class="label">Grade Level</p>
                <p>${data.grade_level}</p>
            </div>
            <div class="info">
                <p class="label">Major</p>
                <p>${data.major}</p>
            </div>
            <div class="info">
                <p class="label">Attended Cal Hacks before?</p>
                <p>${pillify(data.attended_calhacks_before)}</p>
            </div>
            <div class="info">
                <p class="label">Interested roles</p>
                <p>${pillify(data.interested_roles)}</p>
            </div>
            <div class="info">
                <p class="label">Resume</p>
                <p><a href="${data.resume_url}" target="_blank">Click here to see on Drive</a></p>
            </div>
        </div>

        <div class="submission_answers">
            <div class="answer">
                <p class="label">Why do you want to join the Cal Hacks team? What will you uniquely contribute?  [250 words max]</p>
                <p>${paragraph(data.question_1)}</p>
            </div>
            <div class="answer">
                <p class="label">If you have attended Cal Hacks before, what's something that you'd like to improve and how would you go about doing it? If not, what do you think makes a great event/hackathon? [250 words max]</p>
                <p>${paragraph(data.question_2)}</p>
            </div>
            <div class="answer">
                <p class="label">Extras</p>
                <p>${paragraph(data.extras || '(none)')}</p>
            </div>
            <div class="answer">
                <p class="label">Design Portfolio</p>
                <p>${data.design_portfolio || '(none)'}</p>
            </div>
            <div class="answer">
                <p class="label">Tech Portfolio</p>
                <p>${data.tech_portfolio || '(none)'}</p>
            </div>
        </div>
    </div>`;
})) {
    styles() {
        return {
            'display': 'flex',
            'flex-direction': 'row',
            'justify-content': 'space-between',
            '.submission_demography': {
                'width': '200px',
                'margin-right': '24px',
                'flex-shrink': '0',
                'overflow': 'hidden',
            },
            '.submission_answers': {
                'width': '100%',
                'flex-shrink': '1',
                'flex-grow': '1',
            },
            '.label': {
                'font-weight': 'bold',
                'margin-bottom': '6px',
            },
            '.info, .answer': {
                'margin-bottom': '18px',
            },
            '.pill': {
                'display': 'inline-block',
                'margin-top': '8px',
                'margin-right': '8px',
                'background': 'var(--rb-light-primary)',
                'border-radius': '18px',
                'padding': '4px 12px',
            },
            '@media (max-width: 600px)': {
                'flex-direction': 'column !important', // weird CSS bug
                '.submission_demography': {
                    'width': '100%',
                    'margin-right': '0',
                },
            },
        }
    }
}

class App extends StyledComponent {

    init(router) {
        this.graded_by = '';
        fetch('/api/current_user_email').then(resp => resp.text())
            .then(email => {
                this.graded_by = email;
                this.render();
            });

        this.submission_number = null;
        this.submissionData = null;

        this.q1_grade = null;
        this.q2_grade = null;
        this.overall_grade = null;
        this.justSaved = false;

        this.prevClick = this.prevClick.bind(this);
        this.nextClick = this.nextClick.bind(this);
        this.goToNumberClick = this.goToNumberClick.bind(this);
        this.handleSaveClick = this.handleSaveClick.bind(this);
        this.handleKeyup = this.handleKeyup.bind(this);
        this.handleQ1InputChange = this.handleQ1InputChange.bind(this);
        this.handleQ2InputChange = this.handleQ2InputChange.bind(this);
        this.handleOverallInputChange = this.handleOverallInputChange.bind(this);

        this.bind(router, ([route, params]) => {
            switch (route) {
                case 'submission':
                    this.showSubmissionNumber(+params.submission_number);
                    break;
                default:
                    this.showSubmissionNumber(1);
                    break;
            }
        });
    }

    async showSubmissionNumber(submission_number) {
        this.submission_number = submission_number;

        const submissionFetch = fetch(`/api/submission/${submission_number}`)
            .then(resp => resp.json());
        const gradeFetch = fetch(`/api/submission/${submission_number}/grades`)
            .then(resp => resp.json());

        this.submissionData = await submissionFetch;
        for (const grade of await gradeFetch) {
            if (grade.graded_by === this.graded_by) {
                this.q1_grade = grade.q1_grade;
                this.q2_grade = grade.q2_grade;
                this.overall_grade = grade.overall_grade;
            }
        }
        this.render();
    }

    prevClick() {
        this.resetGradeInputs();
        this.submission_number = clipRange(this.submission_number - 1, 1, this.submissionData.maxNumber);
        router.go(`/submissions/${this.submission_number}`);
    }

    nextClick() {
        this.resetGradeInputs();
        this.submission_number = clipRange(this.submission_number + 1, 1, this.submissionData.maxNumber);
        router.go(`/submissions/${this.submission_number}`);
    }

    goToNumberClick() {
        const numberInput = prompt('Enter the application number');
        if (numberInput) {
            if (isNaN(+numberInput)) {
                alert('Please enter a valid number');
            } else {
                this.submission_number = clipRange(+numberInput, 1, this.submissionData.maxNumber);
                router.go(`/submissions/${this.submission_number}`);
            }
        }
    }

    async handleSaveClick() {
        await fetch('/api/grade/', {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                submission_id: this.submissionData.id,
                graded_by: this.graded_by,
                q1_grade: this.q1_grade,
                q2_grade: this.q2_grade,
                overall_grade: this.overall_grade,
            }),
        }).then(resp => {
            if (resp.ok) {
                return resp.json();
            } else {
                window.alert('You may have gotten logged out -- please refresh the page!');
                return resp.text();
            }
        }).then(() => {
            this.justSaved = true;
            this.render();
            setTimeout(() => {
                this.justSaved = false;
                this.render();
            }, 300);
        }).catch(_e => {
            alert('There was an error! Please reload and try again.');
        });
    }

    resetGradeInputs() {
        this.q1_grade = null;
        this.q2_grade = null;
        this.overall_grade = null;
        this.render();
        this.node.querySelector('input').focus();
    }

    handleQ1InputChange(evt) {
        this.q1_grade = evt.target.value === '' ? null : +evt.target.value;
        if (this.q1_grade !== null) {
            this.q1_grade = clipRange(this.q1_grade, 1, 4);
        }
        this.render();
    }

    handleQ2InputChange(evt) {
        this.q2_grade = evt.target.value === '' ? null : +evt.target.value;
        if (this.q2_grade !== null) {
            this.q2_grade = clipRange(this.q2_grade, 1, 4);
        }
        this.render();
    }

    handleOverallInputChange(evt) {
        this.overall_grade = evt.target.value === '' ? null : +evt.target.value;
        if (this.overall_grade !== null) {
            this.overall_grade = clipRange(this.overall_grade, 0, 1);
        }
        this.render();
    }

    handleKeyup(evt) {
        if (evt.key === 'Enter') {
            this.handleSaveClick();
        } else if (evt.key === 'ArrowRight') {
            this.nextClick();
        } else if (evt.key === 'ArrowLeft') {
            this.prevClick();
        }
    }

    styles() {
        return {
            '.navButtons': {
                'display': 'flex',
                'flex-direction': 'row',
                'justify-content': 'flex-start',
                'align-items': 'center',
                'margin': '24px 0',
            },
            '.grades': {
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'justify-content': 'flex-start',
                'margin-bottom': '24px',
            },
            '.inputGroup': {
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'margin-right': '12px',
                'flex-wrap': 'wrap',

                'label': {
                    'margin-right': '8px',
                },
                'input': {
                    'width': '80px',
                },
            },
            '.saveButton': {
                'min-width': '80px',
            },
            '.appNumber': {
                'margin-right': '32px',
            },
            '.gradingAs': {
                'margin': '4px 0',
            },
        }
    }

    compose() {
        return jdom`<main>
            <div class="navButtons">
                <h2 class="appNumber">App #${this.submission_number}</h2>
                <button class="prevButton" onclick="${this.prevClick}">👈 Previous</button>
                <button class="nextButton" onclick="${this.nextClick}">Next 👉</button>
                <button class="goToNumber" onclick="${this.goToNumberClick}">🔢 Go to number</button>
            </div>

            <h3>Grades</h3>
            <p class="gradingAs">
                Grading as <strong>${this.graded_by || '...'}</strong>
                |
                Read the <a href="https://docs.google.com/document/d/1G2XEGrSiaUIEzGN-uyjrW8FYBLRz8k2GsheJv1GQmNo/edit#" target="_blank">Grading Guide</a>
            </p>
            <div class="grades">
                <div class="inputGroup">
                    <label>Question 1 (1 - 4)</label>
                    <input type="number" min="1" max="4" step="1" onkeyup="${this.handleKeyup}"
                        oninput=${this.handleQ1InputChange} value="${this.q1_grade}" />
                </div>
                <div class="inputGroup">
                    <label>Question 2 (1 - 4)</label>
                    <input type="number" min="1" max="4" step="1" onkeyup="${this.handleKeyup}"
                        oninput=${this.handleQ2InputChange} value="${this.q2_grade}" />
                </div>
                <div class="inputGroup">
                    <label>Overall (0 - 1)</label>
                    <input type="number" min="0" max="1" step="1" onkeyup="${this.handleKeyup}"
                        oninput=${this.handleOverallInputChange} value="${this.overall_grade}" />
                </div>
                <button class="saveButton" onclick="${this.handleSaveClick}">${this.justSaved ? '✔ Saved' : 'Save'}</button>
            </div>

            ${this.submissionData ? new SubmissionView(this.submissionData).node : (
                `loading application #${this.submission_number} ...`
            )}
        </main>`;
    }

}

const router = new Router({
    submission: '/submissions/:submission_number',
    default: '/submissions',
});
const app = new App(router);
document.body.appendChild(app.node);
