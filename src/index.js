const fs = require('fs');

const config = require('../config.js');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

const api = require('./api.js');
const views = require('./views.js');

const {auth} = require('./auth.js');
const passport = require('passport');
const session = require('express-session');
const fileStore = require('session-file-store')(session);

// AUTHENTICATION
app.use(session({
    secret: config.COOKIE_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 86400 * 1000 * 7, // a week
    },
    store: new fileStore({
        path: config.SESSION_DATABASE,
    }),
}));
auth(passport);
app.use(passport.initialize());
app.use(passport.session());
app.get('/auth', (req, res) => {
    if (req.user) {
        res.redirect(302, '/submissions');
    } else {
        res.redirect(302, '/auth/google');
    }
}
);
app.get('/auth/google', passport.authenticate('google', {
    scope: ['email', 'profile'],
}));
app.get(config.AUTH_REDIRECT_URL,
    passport.authenticate('google', {
        failureRedirect: '/',
    }),
    (req, res) => {
        if (req.session.returnTo) {
            const redirect = req.session.returnTo;
            delete req.session.returnTo;
            res.redirect(redirect);
        } else {
            res.redirect('/submissions');
        }
    }
);
app.get('/logout', (req, res) => {
    req.session.destroy(_ => {
        req.logout();
        req.session = null;
        res.redirect('/');
    });
});
app.get('/api/current_user_email', (req, res) => {
    res.send(req.user.email);
});

// STATIC ASSETS
const STATIC_PATHS = {
    '/': 'index.html',
}
const respondWith = (res, static_path) => {
    fs.readFile(`static/${static_path}`, 'utf8', (err, data) => {
        if (err) {
            throw err;
        }

        res.set('Content-Type', 'text/html');
        res.send(data);
    });
}
for (const [uri, path] of Object.entries(STATIC_PATHS)) {
    app.get(uri, (req, res) => {
        try {
            respondWith(res, path);
        } catch (e) {
            console.error(e);
            // For now, assume it's a not-found error
            respondWith(res, '404.html');
        }
    });
}
app.use('/static', express.static('static'));

console.log('Initialized static paths');

// VIEWS
const VIEW_PATHS = {
    '/submissions': views.dashboardView,
    '/submissions/*': views.dashboardView,
    '/results': views.resultsView,
    '/results/list': views.csvResultsView,
    '/results/:grader': views.graderResultsView,
    '/stats': views.statsView,
}
for (const [uri, renderer] of Object.entries(VIEW_PATHS)) {
    app.get(uri, (req, res) => {
        try {
            if (req.user) {
                res.set('Content-Type', 'text/html');
                const html = renderer(req.params);
                if (html !== false) {
                    res.send(html);
                } else {
                    respondWith(res, '404.html');
                }
            } else {
                req.session.returnTo = req.originalUrl;
                res.redirect(302, '/auth');
            }
        } catch (e) {
            console.error(e);
            respondWith(res, '500.html');
        }
    })
}
console.log('Initialized view paths');


// API
const API_PATHS = {
    'GET /api/submission/:submission_id': api.submission.get,
    'GET /api/submission/:submission_id/grades': api.submission.get_grades,

    'GET /api/grade/:grade_id': api.grade.get,
    'POST /api/grade/': api.grade.post,
    'DELETE /api/grade/:grade_id': api.grade.delete,
}
const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
for (const [spec, handler] of Object.entries(API_PATHS)) {
    const [method, route] = spec.split(' ');
    let appMethod;
    if (METHODS.includes(method)) {
        appMethod = app[method.toLowerCase()].bind(app);
    } else {
        throw new Error(`Method ${method} for route ${route} is not valid`);
    }

    appMethod(route, (req, res) => {
        if (!req.user) {
            res.status = 403;
            res.send(JSON.stringify({
                error: '403 Permission Denied',
            }));
            return;
        }

        try {
            res.set('Content-Type', 'application/json');
            const result = handler(req.params, req.query, req.body);
            res.send(JSON.stringify(result));
        } catch (e) {
            console.error(e);
            res.set('Content-Type', 'application/json');
            res.send(JSON.stringify({
                error: '500 Server Error',
            }));
        }
    });
}
console.log('Initialized api paths');


// 404 last
app.use((req, res) => respondWith(res, '404.html'));

app.listen(
    config.PORT,
    () => console.log(`RecruitBot running on localhost:${config.PORT}`)
);
