const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const shortid = require('shortid');

const config = require('../config.js');

const {
    now,
}  = require('./utils.js');

/**
 * A very rudimentary JSON file-backed database
 *  for quick prototyping. Do NOT use in environments
 *  that require robustness under scale. This WILL fail.
 */
class JSONStorage {

    constructor(db_path) {
        this.path = db_path;
        this.inMemoryCopy = {};

        // create a file there if not already exists
        // No try-catch here since the app should fail
        //  loudly if the DB doesn't exist
        if (!fs.existsSync(this.path)) {
            const dirname = path.dirname(this.path);
            mkdirp(dirname);
            fs.writeFile(this.path, '{}', 'utf8', err => {
                if (err) {
                    console.error(err);
                }
            });
        } else {
            const dbContents = fs.readFileSync(
                this.path,
                {encoding: 'utf8'}
            );
            try {
                this.inMemoryCopy = JSON.parse(dbContents);
            } catch (e) {
                console.error('Error while reading JSON database', e);
                console.log('JSON dump:', dbContents);
                throw new Error('Please remedy any issues with the JSON database and restart the server')
            }
        }
    }

    flush() {
        return this._flush();
    }

    _flush() {
        try {
            const contents = JSON.stringify(this.inMemoryCopy);

            return new Promise((res, rej) => {
                try {
                    fs.writeFile(this.path, contents, 'utf8', err => {
                        if (err) {
                            console.error('Error while flushing data to database', e);
                        }

                        res();
                    });
                } catch (e) {
                    rej(e);
                }
            });
        } catch (e) {
            return Promise.reject(new Error('Error while stringifying in-memory copy of database'), e);
        }
    }

    createCollection(label) {
        label = label.toString();
        if (!(label in this.inMemoryCopy)) {
            this.inMemoryCopy[label] = {};
        }
        this.flush();
    }

    _hasCollection(label) {
        return label in this.inMemoryCopy;
    }

    _hasId(label, id) {
        return (
            this._hasCollection(label)
            && id in this.inMemoryCopy[label]
        );
    }

    has(label, id) {
        return this._hasId(label, id);
    }

    getCollection(label) {
        if (this._hasCollection(label)) {
            return Object.values(this.inMemoryCopy[label])
        } else {
            throw new Error(`Could not find collection ${label} in database`);
        }
    }

    createInCollection(label, id, attributes) {
        if (this._hasCollection(label)) {
            if (this._hasId(label, id)) {
                throw new Error(`Object with id ${id} in collection ${label} already exists`);
            } else {
                this.inMemoryCopy[label][id] = Object.assign({}, attributes);
            }
        } else {
            throw new Error(`Could not find collection ${label} in database`);
        }
        this.flush();
    }

    deleteFromCollection(label, id) {
        if (this._hasCollection(label)) {
            if (this._hasId(label, id)) {
                delete this.inMemoryCopy[label][id];
            } else {
                throw new Error(`Object with id ${id} in collection ${label} doesn't exist`);
            }
        } else {
            throw new Error(`Could not find collection ${label} in database`);
        }
        this.flush();
    }

    updateInCollection(label, id, attributes) {
        if (this._hasCollection(label)) {
            if (this._hasId(label, id)) {
                this.inMemoryCopy[label][id] = Object.assign(
                    this.inMemoryCopy[label][id],
                    attributes
                );
            } else {
                throw new Error(`Object with id ${id} in collection ${label} doesn't exist`);
            }
        } else {
            throw new Error(`Could not find collection ${label} in database`);
        }
        this.flush();
    }

    getFromCollection(label, id) {
        if (this._hasCollection(label)) {
            if (this._hasId(label, id)) {
                return this.inMemoryCopy[label][id];
            } else {
                throw new Error(`Object with id ${id} in collection ${label} doesn't exist`);
            }
        } else {
            throw new Error(`Could not find collection ${label} in database`);
        }
    }

}

const db = new JSONStorage(config.DATABASE);

class StoredObject {

    constructor(attributes = {}) {
        this._saved = false;

        this.id = attributes.id || shortid.generate();
        this.attributes = Object.assign(
            this.constructor.defaults,
            attributes,
            {id: this.id}
        );
    }

    static get label() {
        throw new Error('This method should be overridden in child classes!');
    }

    static get schema() {
        throw new Error('This method should be overridden in child classes!');
    }

    static get writable() {
        return Object.keys(this.schema);
    }

    static all() {
        return db.getCollection(this.label).map(obj => new this(obj));
    }

    static find(id) {
        if (db.has(this.label, id)) {
            return new this(db.getFromCollection(this.label, id));
        } else {
            return undefined;
        }
    }

    static where(attributes) {
        const properties = Object.entries(attributes);
        const objList = db.getCollection(this.label).reduce((acc, obj) => {
            for (const [prop, val] of properties) {
                if (obj[prop] !== val) {
                    return acc;
                }
            }
            acc.push(obj);
            return acc;
        }, []);
        return objList.map(obj => new this(obj));
    }

    toJSON() {
        return {
            id: this.id,
            ...this.attributes,
        };
    }

    delete() {
        if (db.has(this.constructor.label, this.id)) {
            db.deleteFromCollection(this.constructor.label, this.id);
        }
        this._saved = true;
    }

    set(attr, value) {
        if (!(attr in this.constructor.writable)) {
            this.attributes[attr] = value;
            this._saved = false;
        }
    }

    get(attr) {
        return this.attributes[attr];
    }

    setAttributes(attrs = {}) {
        for (const [attr, value] of Object.entries(attrs)) {
            this.set(attr, value);
        }
    }

    save() {
        if (!this._saved) {
            if (db.has(this.constructor.label, this.id)) {
                db.updateInCollection(
                    this.constructor.label,
                    this.id,
                    this.attributes
                );
            } else {
                db.createInCollection(
                    this.constructor.label,
                    this.id,
                    this.attributes
                );
            }
            this._saved = true;
        }
    }

}

class Submission extends StoredObject {

    static get label() {
        return 'submission';
    }

    static get schema() {
        return {
            number: Number,
            timestamp: String,
            email: String,
            full_name: String,
            grade_level: String,
            major: String,
            resume_url: String,
            ref_links: String,

            has_attended_before: Boolean,

            attended_roles: String,
            attended_question_1: String,
            attended_question_2: String,
            attended_interested_roles: String,
            attended_extras: String,

            not_attended_question_1: String,
            not_attended_question_2: String,
            not_attended_interested_roles: String,
            not_attended_extras: String,

            rejected: Boolean,
        }
    }

    static get defaults() {
        return {}
    }

    static get writable() {
        return []; // submissions are read-only
    }

    getGeneralizedAnswerParts() {
        if (this.get('has_attended_before')) {
            return {
                question_1: this.get('attended_question_1'),
                question_2: this.get('attended_question_2'),
                interested_roles: this.get('attended_interested_roles'),
                extras: this.get('attended_extras'),
            }
        } else {
            return {
                question_1: this.get('not_attended_question_1'),
                question_2: this.get('not_attended_question_2'),
                interested_roles: this.get('not_attended_interested_roles'),
                extras: this.get('not_attended_extras'),
            }
        }
    }

    toJSON() {
        return {
            ...super.toJSON(),
            ...this.getGeneralizedAnswerParts(),
            maxNumber: this.constructor.all().length,
        }
    }

    getGrades() {
        return Grade.where({submission_id: this.id});
    }

    getGraderGrade(grader) {
        const graderGrade = Grade.where({
            submission_id: this.id,
            graded_by: grader,
        })[0];
        
        return graderGrade ? graderGrade.getWeighted() : NaN;
    }

    getNormalizedOverallGrade() {
        const normalizedGrades = this.getGrades().map(g => g.normalize());
        if (normalizedGrades.length) {
            return normalizedGrades.reduce((a, b) => a + b, 0) / normalizedGrades.length;
        } else {
            return NaN;
        }
    }

}
db.createCollection(Submission.label);

class Grade extends StoredObject {

    static get label() {
        return 'grade';
    }

    static get schema() {
        return {
            timestamp: Number,
            submission_id: String, // shortid
            graded_by: String, // cal hacks email
            q1_grade: Number,
            q2_grade: Number,
            overall_grade: Number,
        }
    }

    static get defaults() {
        return {
            timestamp: now(),
            q1_grade: null,
            q2_grade: null,
            overall_grade: null,
        }
    }

    getWeighted() {
        return this.get('q1_grade')
            + this.get('q2_grade')
            + this.get('overall_grade');
    }

    static getMinScoreForGrader(grader) {
        const gradesFromGrader = this.where({
            graded_by: grader,
        });
        return Math.min(...gradesFromGrader.map(g => g.getWeighted()));
    }

    static getMaxScoreForGrader(grader) {
        const gradesFromGrader = this.where({
            graded_by: grader,
        });
        return Math.max(...gradesFromGrader.map(g => g.getWeighted()));
    }

    normalize() {
        const grader = this.get('graded_by');

        const min = this.constructor.getMinScoreForGrader(grader);
        const max = this.constructor.getMaxScoreForGrader(grader);

        if (min === max) {
            return this.getWeighted();
        }

        return (((this.getWeighted() - min) / (max - min)) * 7) + 2;
    }

}
db.createCollection(Grade.label);

module.exports = {
    Submission,
    Grade,
    flush: () => db.flush(),
};
