const util = require('util')
const gcla = require('../lib/google-classroom')
const googleClient = require('../lib/google-api-client')

const listCourses = util.promisify(gcla.listCourses)
const listStudents = util.promisify(gcla.listStudents)
const listCourseWorks = util.promisify(gcla.listCourseWorks)
const listSubmissions = util.promisify(gcla.listSubmissions)

const renderTimeDate = time => time.split('T')[0]

const renderDate = date => `${date.year}-${date.month}-${date.day}`

const extractLatestUrlsFromSubmission = ({ assignmentSubmission }) =>
  ((assignmentSubmission || {}).attachments || [])
    .map((a) => (a.link || {}).url)
    .filter((url) => !!url) // only keep URL attachments
    .reverse() // start with most recent attachment

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
  'list-students': async (courseId) => {
    const { students } = await listStudents(courseId)
    console.log(`=> found ${students.length} students:`)
    students.forEach(({ profile }) =>
      console.log(`- ${profile.id}: [${profile.emailAddress}] ${profile.name.fullName}`)
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
  },
  'list-submitted-urls': async (courseId, courseWorkId) => {
    const { studentSubmissions } = await listSubmissions(courseId, courseWorkId)
    console.log(`=> found ${(studentSubmissions || []).length} submissions:`)
    studentSubmissions.forEach(subm => {
      const lastUrlSubmitted = extractLatestUrlsFromSubmission(subm)[0] || '(no URL)'
      console.log(`- URL submitted by student ${subm.userId} on ${subm.updateTime}: ${lastUrlSubmitted}`)
    })
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
