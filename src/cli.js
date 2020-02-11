const util = require('util')
const gcla = require('../lib/google-classroom')
const googleClient = require('../lib/google-api-client')

const listCourses = util.promisify(gcla.listCourses)
const listCourseWorks = util.promisify(gcla.listCourseWorks)
const listSubmissions = util.promisify(gcla.listSubmissions)

const renderTimeDate = time => time.split('T')[0]

const renderDate = date => `${date.year}-${date.month}-${date.day}`

// helper
const flatten = (arrays) => arrays.reduce((acc, arr) => [].concat.apply(acc, arr), [])

// returns [ { fetchedAttachments: [ { err || source,html,css,js } ] } ]
function extractSubmission(submission, callback) {
  var urls = ((submission.assignmentSubmission || {}).attachments || [])
    .map((a) => (a.link || {}).url)
    .filter((url) => !!url) // only keep URL attachments
    .reverse() // start with most recent attachment
  var fetchedOne = false
  // will keep iterating on attachments until one URL is fetched successfully
  async.mapSeries(urls, function(url, next) {
    //console.log('Fetching ' + url + '...')
    if (fetchedOne) {
      next()
    } else {
      fetchers.fetchByUrl(url, (err, res) => {
        fetchedOne = !res.err
          next(err, res)
      })
    }
  }, function(err, fetchedAttachments) {
    callback(err, {
      _gcla_subm: submission, // original submission, as returned by google classroom API
      fetchedAttachments: fetchedAttachments.filter((att) => !!att), // remove null values
    })
  })
}

// returns an array of objects (submission -> [ { fetchedAttachments } ])
function extractSubmissions(turnedIn, callback) {
  async.mapSeries(turnedIn, extractSubmission, callback)
}

// adds student metadata properties to attachments of a submission
function getEnrichedAttachments(subm) {
  const student = students.getStudentById(subm._gcla_subm.userId)
  return subm.fetchedAttachments.map((att) => Object.assign({
    userId: subm._gcla_subm.userId,
    name: student.name.fullName,
    email: student.emailAddress,
    _gcla_subm: subm._gcla_subm,
  }, att))
}

const args = process.argv.slice(2)
const USAGE = `$ ./gclass <command> <parameter>`
const COMMANDS = {
  'list-courses': async () => {
    const { courses } = await listCourses()
    console.log(`=> found ${courses.length} courses:`)
    courses.forEach(course =>
      console.log(`- ${course.id}: [${renderTimeDate(course.creationTime)}] ${course.name} ${course.section || ''}`)
    )
  },
  'list-assignments': async (courseId) => {
    const { courseWork } = await listCourseWorks(courseId)
    console.log(`=> found ${(courseWork || []).length} assignments:`)
    courseWork.forEach(work => {
      const date = work.dueDate
        ? `due ${renderDate(work.dueDate)}`
        : `created ${renderTimeDate(work.creationTime)}`
      console.log(`- ${work.id}: [${date}] ${work.title}`)
    })
  },
  'list-submissions': async (courseId, courseWorkId) => {
    const { studentSubmissions } = await listSubmissions(courseId, courseWorkId)
    console.log(`=> found ${(studentSubmissions || []).length} submissions:`)
    studentSubmissions.forEach(subm =>
      console.log(`- student ${subm.userId} ${subm.state} on ${subm.updateTime} with grade ${subm.draftGrade}`)
    )
  }
}

const command = args[0]
const parameters = args.slice(1)
const method = COMMANDS[command]

if (typeof method !== 'function') {
  console.error(`Usage: ${USAGE}`)
  console.error(`Commands: ${Object.keys(COMMANDS).join(', ')}`)
  process.exit(1)
}

googleClient
  .auth() // auth using user_token.json or oauth
  .catch(err => {
    console.error('Error: ', err)
    process.exit(2)
  })
  .then(async () => {
    await method(...parameters)
  })
