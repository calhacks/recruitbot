# Recruitbot

Used for grading Cal Hacks recruiting applications since Spring 2019.

## Usage

To start, first clone the repository, install Node.js dependencies, and then:

1. Create a directory `fixtures/` in the project directory. Export the CSV of the application Google Form, and add it as `applications.csv` under `fixtures/`.
2. Run `npm run generatedb` or `yarn generatedb` (equivalent) to generate a brand new grading database based on the new applications. Note that if there are any existing applications already in the database, you'll get a warning and nothing in the database will be altered.
3. To run the app with Google OAuth for `calhacks.io` users, you'll need to set up Google Developer Credentials through their console. Cal Hacks already has credentials for RecruitBot -- please refer to the maintainer of this repository to get the credentials we use.
4. You'll need to create a valid `config.js` before you can start the server -- there's a sample in `config.sample.js`, but with some parts missing. If you ask the maintainer of the repo (Linus @thesephist), you might be able to get the credentials.

