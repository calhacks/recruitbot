const GoogleStrategy = require('passport-google-oauth20').Strategy;

const secrets = require('../config.js');

const auth = passport => {

    passport.use(
        new GoogleStrategy(
            {
                clientID: secrets.CLIENT_ID,
                clientSecret: secrets.CLIENT_SECRET,
                callbackURL: secrets.AUTH_HOST + secrets.AUTH_REDIRECT_URL,
                userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
            },
            (token, refreshToken, profile, done) => {
                const user = {
                    name: profile.displayName,
                    email: profile.emails[0].value,
                }
                return done(null, user);
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(
            null,
            JSON.stringify(user)
        );
    });

    passport.deserializeUser((serialized_user, done) => {
        done(
            null,
            JSON.parse(serialized_user)
        );
    });

};

module.exports = {
    auth,
}
