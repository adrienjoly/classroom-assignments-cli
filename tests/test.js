const util = require('util')
const gcla = require('../lib/google-classroom')
const googleClient = require('../lib/google-api-client')

const listCourses = util.promisify(gcla.listCourses)
const listCourseWorks = util.promisify(gcla.listCourseWorks)
const listSubmissions = util.promisify(gcla.listSubmissions)

googleClient
  .auth() // auth using user_token.json or oauth
  .catch(err => {
    console.error('Error: ', err)
  })
  .then(async () => {
    console.log('fetching courses ...')
    const { courses } = await listCourses()
    console.log(`=> found ${courses.length} courses:`)
    let oneCourseWork
    await Promise.all(courses.map(async course => {
      const { courseWork } = await listCourseWorks(course.id)
      console.log(`- ${(courseWork || []).length} assignments in "${course.name}"`)
      if (courseWork) {
        oneCourseWork = courseWork[0]
      }
    }))
    console.log(`fetching submissions for "${oneCourseWork.title}"...`)
    const { studentSubmissions } = await listSubmissions(oneCourseWork.courseId, oneCourseWork.id)
    console.log(`=> submissions:`)
    studentSubmissions.forEach(subm => {
      console.log(`- student ${subm.userId} ${subm.state} on ${subm.updateTime} with grade ${subm.draftGrade}`)
    })
    console.warn('✅ Done.')
  })
