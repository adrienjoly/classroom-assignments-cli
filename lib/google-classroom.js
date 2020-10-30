var dotenv = require('dotenv').config();
var { google } = require('googleapis');
var googleAuth = require('google-auth-library');

var SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly', // for listCourses
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.profile.emails', // for listStudents
];
// If modifying these scopes, delete your previously saved credentials
var GCLA_CLIENT_ID = process.env.GCLA_CLIENT_ID.substr();
var GCLA_CLIENT_SECRET = process.env.GCLA_CLIENT_SECRET.substr();
var GCLA_REDIRECT_URL = process.env.GCLA_REDIRECT_URL || 'urn:ietf:wg:oauth:2.0:oob';

var authClients = {}; // sesId -> auth.OAuth2 instance, logged with user token

function getClient(sesId) {
  return authClients[sesId || 0];
}

function setClient(sesId, client) {
  authClients[sesId || 0] = client;
}

function addClient(client) {
  setClient(null, client);
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 */
exports.generateAuthUrl = function generateAuthUrl() {
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(GCLA_CLIENT_ID, GCLA_CLIENT_SECRET, GCLA_REDIRECT_URL);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  // the user will have to visit that URL, select google account, accept,
  // and the resulting code must be transmitted to authorizeFromCode()
}

exports.getSessionFromCode = function getSessionFromCode(code, callback) {
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(GCLA_CLIENT_ID, GCLA_CLIENT_SECRET, GCLA_REDIRECT_URL);
  console.warn('getSessionFromCode, code:', code);
  oauth2Client.getToken(code, function(err, token) {
    if (err) {
      console.error('Error while trying to retrieve access token:', err);
      callback(err);
    } else {
      oauth2Client.credentials = token;
      var sesId = addClient(oauth2Client);
      console.warn('getSessionFromCode =>', sesId);
      callback(null, sesId);
    }
  });
}

exports.getSessionToken = function() {
  return getClient().credentials
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 */
exports.getSessionFromToken = function(jsonUserToken) {
  const oauth2Client = new google.auth.OAuth2(GCLA_CLIENT_ID, GCLA_CLIENT_SECRET, GCLA_REDIRECT_URL);
  // TODO: if !jsonUserToken => getNewToken(callback.bind(null, null));
  oauth2Client.setCredentials(jsonUserToken);
  google.options({ auth: oauth2Client });
}

async function listCourses() {
  return (await google.classroom('v1').courses.list()).data;
}

async function listCourseWorks(courseId) {
  return (await google.classroom('v1').courses.courseWork.list({
    courseId: courseId,
  })).data;
}

async function listSubmissions(courseId, courseWorkId) {
  return (await google.classroom('v1').courses.courseWork.studentSubmissions.list({
    courseId: courseId,
    courseWorkId: courseWorkId,
  })).data;
}

exports.listStudents = async function(courseId) {
  return (await google.classroom('v1').courses.students.list({
    courseId: courseId,
  })).data;
}

exports.listCourses = listCourses;
exports.listCourseWorks = listCourseWorks;
exports.listSubmissions = listSubmissions;
