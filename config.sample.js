module.exports = {
    PORT: 9012,
    DATABASE: 'db/db.json',
    SESSION_DATABASE: 'db/sessions',

    CLIENT_ID: '<your client id>.apps.googleusercontent.com',
    CLIENT_SECRET: '<your client secret>',

    AUTH_HOST: 'http://localhost:9012', // use the hostname you want Google to know
    AUTH_REDIRECT_URL: '/auth/google/redirect',

    COOKIE_KEY: '<choose a random string here>',
}

