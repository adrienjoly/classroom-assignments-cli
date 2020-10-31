const dotenv = require('dotenv').config();
const { google } = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly', // for listCourses
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.profile.emails', // for listStudents
];
// If modifying these scopes, delete your previously saved credentials
const GCLA_CLIENT_ID = process.env.GCLA_CLIENT_ID;
const GCLA_CLIENT_SECRET = process.env.GCLA_CLIENT_SECRET;
const GCLA_REDIRECT_URL = process.env.GCLA_REDIRECT_URL || 'urn:ietf:wg:oauth:2.0:oob';

if (!GCLA_CLIENT_ID) {
  console.error("Please set the GCLA_CLIENT_ID environment variable, cf README.md");
  process.exit(1);
}

if (!GCLA_CLIENT_SECRET) {
  console.error("Please set the GCLA_CLIENT_SECRET environment variable, cf README.md");
  process.exit(1);
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 */
exports.generateAuthUrl = () => {
  var oauth2Client = new google.auth.OAuth2(GCLA_CLIENT_ID, GCLA_CLIENT_SECRET, GCLA_REDIRECT_URL);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  // the user will have to visit that URL, select google account, accept,
  // and the resulting code must be transmitted to authorizeFromCode()
};

exports.authFromCode = async (code) => {
  const oauth2Client = new google.auth.OAuth2(GCLA_CLIENT_ID, GCLA_CLIENT_SECRET, GCLA_REDIRECT_URL);
  // console.warn('authFromCode, code:', code);
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens);
  google.options({ auth: oauth2Client });
  return tokens;
};

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 */
exports.authFromToken = (jsonUserToken) => {
  const oauth2Client = new google.auth.OAuth2(GCLA_CLIENT_ID, GCLA_CLIENT_SECRET, GCLA_REDIRECT_URL);
  // TODO: if !jsonUserToken => getNewToken(callback.bind(null, null));
  oauth2Client.setCredentials(jsonUserToken);
  google.options({ auth: oauth2Client });
}

exports.listCourses = async () => {
  return (await google.classroom('v1').courses.list()).data;
};

exports.listCourseWorks = async (courseId) => {
  return (await google.classroom('v1').courses.courseWork.list({
    courseId: courseId,
  })).data;
};

exports.listSubmissions = async (courseId, courseWorkId) => {
  return (await google.classroom('v1').courses.courseWork.studentSubmissions.list({
    courseId: courseId,
    courseWorkId: courseWorkId,
  })).data;
};

exports.listStudents = async function(courseId) {
  return (await google.classroom('v1').courses.students.list({
    courseId: courseId,
  })).data;
};
