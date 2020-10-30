var fs = require('fs')
var readline = require('readline')
var gcla = require('./google-classroom')

const TOKEN_FILE = 'user_token.json'

const saveJSON = (file, json) => {
  fs.writeFileSync(file, JSON.stringify(json, null, 2))
  console.warn('Saved JSON to', file)
}

const authorize = () => new Promise((resolve, reject) => {
  var authUrl = gcla.generateAuthUrl()
  console.warn('Authorize this app by visiting this url: ', authUrl)
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.question('Enter the code from that page here: ', async function(code) {
    rl.close()
    try {
      const token = await gcla.authFromCode(code)
      // console.warn('=> token:', token)
      saveJSON(TOKEN_FILE, token)
      console.warn('(i) saved session to token file:', TOKEN_FILE)
      resolve()
    } catch (err) {
      console.warn('(i) did not save session token')
      reject(err)
    }
  })
})
  
exports.auth = async function() {
  console.warn('trying to read session token from ' + TOKEN_FILE + '...')
  try {
    const token = require('../' + TOKEN_FILE)
    //console.warn('=> token:', token)
    await gcla.authFromToken(token)
  } catch(e) {
    console.error(e.message)
    console.warn('failed => trying manual auth...')
    await authorize()
  }
}