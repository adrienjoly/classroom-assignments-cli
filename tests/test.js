const util = require('util')
const gcla = require('../lib/google-classroom')
const googleClient = require('../lib/google-api-client')

const listCourses = (gcla.listCourses)
const listCourseWorks = (gcla.listCourseWorks)
const listSubmissions = (gcla.listSubmissions)

googleClient
  .auth() // auth using user_token.json or oauth
  .catch(err => {
    console.error('Error: ', err)
    process.exit(1)
  })
  .then(async () => {
    console.warn('fetching courses ...')
    const { courses } = await listCourses()
    let oneCourseWork
    console.warn(`=> found ${courses.length} courses`)
    if (courses.length === 0) {
      process.exit(2)
    }
    await Promise.all(courses.map(async course => {
      const { courseWork } = await listCourseWorks(course.id)
      console.log(`- ${(courseWork || []).length} assignments in "${course.name}"`)
      if (courseWork) {
        oneCourseWork = courseWork[0]
      }
    }))
    if (!oneCourseWork || !oneCourseWork.title) {
      console.error("could not fetch metadata for first assignment of first course")
      process.exit(3)
    }
    console.warn(`fetching submissions for "${oneCourseWork.title}"...`)
    const { studentSubmissions } = await listSubmissions(oneCourseWork.courseId, oneCourseWork.id)
    console.warn(`=> found ${studentSubmissions.length} submissions`)
    studentSubmissions.forEach(subm => {
      console.log(`- student ${subm.userId} ${subm.state} on ${subm.updateTime} with grade ${subm.draftGrade}`)
    })
    console.warn('✅ Done.')
  })
