const gcla = require('./lib/google-classroom')
const googleClient = require('./lib/google-api-client')

const renderTimeDate = time => time.split('T')[0]

const renderDate = date => `${date.year}-${date.month}-${date.day}`

const extractLatestUrlsFromSubmission = ({ assignmentSubmission }) =>
  ((assignmentSubmission || {}).attachments || [])
    .map((a) => (a.link || {}).url)
    .filter((url) => !!url) // only keep URL attachments
    .reverse() // start with most recent attachment

const makeStudentGetter = ({ students }) => {
  const studentSet = {}
  students.forEach(({ profile }) => {
    studentSet[profile.id] = profile
  })
  return id => studentSet[id]
}

const args = process.argv.slice(2)
const USAGE = `$ npx gclass <command> <parameter>`
const COMMANDS = {
  'list-courses': async () => {
    const { courses } = await gcla.listCourses()
    console.log(`=> found ${courses.length} courses:`)
    courses.forEach(course =>
      console.log(`- ${course.id}: [${renderTimeDate(course.creationTime)}] ${course.name} ${course.section || ''}`)
    )
  },
  'list-students': async (courseId) => {
    const { students } = await gcla.listStudents(courseId)
    console.log(`=> found ${students.length} students:`)
    students.forEach(({ profile }) =>
      console.log(`- ${profile.id}: [${profile.emailAddress}] ${profile.name.fullName}`)
    )
  },
  'list-assignments': async (courseId) => {
    const { courseWork } = await gcla.listCourseWorks(courseId)
    console.log(`=> found ${(courseWork || []).length} assignments:`)
    courseWork.forEach(work => {
      const date = work.dueDate
        ? `due ${renderDate(work.dueDate)}`
        : `created ${renderTimeDate(work.creationTime)}`
      console.log(`- ${work.id}: [${date}] ${work.title}`)
    })
  },
  'list-submissions': async (courseId, courseWorkId) => {
    const { studentSubmissions } = await gcla.listSubmissions(courseId, courseWorkId)
    console.log(`=> found ${(studentSubmissions || []).length} submissions:`)
    studentSubmissions.forEach(subm =>
      console.log(`- student ${subm.userId} ${subm.state} on ${subm.updateTime} with grade ${subm.draftGrade}`)
    )
  },
  'list-submitted-urls': async (courseId, courseWorkId) => {
    const { studentSubmissions } = await gcla.listSubmissions(courseId, courseWorkId)
    console.log(`=> found ${(studentSubmissions || []).length} submissions:`)
    studentSubmissions.forEach(subm => {
      const lastUrlSubmitted = extractLatestUrlsFromSubmission(subm)[0] || '(no URL)'
      console.log(`- URL submitted by student ${subm.userId} on ${subm.updateTime}: ${lastUrlSubmitted}`)
    })
  },
  'generate-test-script': async (courseId, courseWorkId) => {
    const getStudentById = makeStudentGetter(await gcla.listStudents(courseId))
    const { studentSubmissions } = await gcla.listSubmissions(courseId, courseWorkId)
    console.log(`# For use with https://github.com/adrienjoly/cours-nodejs-exercise-testers`)
    studentSubmissions.forEach(subm => {
      const student = getStudentById(subm.userId)
      const submittedUrls = extractLatestUrlsFromSubmission(subm)
      const gitlabUrls = submittedUrls.filter(url => url.includes('gitlab'))
      const otherUrls = submittedUrls.filter(url => !url.includes('gitlab'))
      console.log(`\n# Student ${student.emailAddress} submitted ${gitlabUrls.length} Gitlab URLs + ${otherUrls.length} other URLs: ${otherUrls.join(', ')}`)
      gitlabUrls.forEach((url, index) => {
        console.log(`git clone -q ${url} --depth 1 ./student-repos/${student.emailAddress}${index > 0 ? `--${index}` : ''}`)
      })
    })
    console.log(`\n# Now, let's run the exercise evaluator on each downloaded repo:`)
    console.log(`TESTER=test-ex-1-5.js ./eval-student-submissions.sh ./student-repos/*`)
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
