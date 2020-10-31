# `gclass` – Google Classroom Assignments CLI

Fetches courses, students, assignments and student-submitted URLs from Google Classroom API.

![](./docs/1-download-classroom-submissions.png)

Forked from [adrienjoly/classroom-submissions-to-pdf](https://github.com/adrienjoly/classroom-submissions-to-pdf).

## Usage

```sh
$ npx gclass list-courses # will list course_ids
$ npx gclass get-course <course_id> # will display metadata about the course
$ npx gclass list-students <course_id>
$ npx gclass list-assignments <course_id> # will list assignment_ids
$ npx gclass list-submissions <course_id> <assignment_id>
$ npx gclass list-submitted-urls <course_id> <assignment_id>
$ npx gclass generate-test-script <course_id> <assignment_id>
```

## Setup

Before running, don't forget to:

1. create an app and web client auth on [Google Developer Console](https://console.developers.google.com/);   
2. and set the corresponding environment variables: `GCLA_CLIENT_ID`, `GCLA_CLIENT_SECRET` and `GCLA_REDIRECT_URL` (note: you can store them in a `.env` file)

All `npm` scripts that can be used are listed in the `package.json` file.

## Run tests

```sh
$ git clone https://github.com/adrienjoly/classroom-assignments-cli.git
$ cd classroom-assignments-cli
$ npm install
$ npm test        # => tests the Google API
```
