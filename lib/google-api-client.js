var fs = require('fs')
var util = require('util')
var readline = require('readline')
var gcla = require('./google-classroom')

const getSessionFromToken = util.promisify(gcla.getSessionFromToken)

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
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close()
    gcla.getSessionFromCode(code, function(err, sesId) {
      var token = gcla.getSessionToken()
      //console.warn('=> err:', err, 'token:', token, 'sesId:', sesId)
      if (!err && token) {
        saveJSON(TOKEN_FILE, token)
        console.warn('(i) saved session to token file:', TOKEN_FILE)
        resolve(sesId)
      } else {
        console.warn('(i) did not save session token')
        reject(err)
      }
    })
  })
})
  
exports.auth = async function() {
  let sesId
  console.warn('trying to read session token from ' + TOKEN_FILE + '...')
  try {
    const token = require('../' + TOKEN_FILE)
    //console.warn('=> token:', token)
    sesId = await getSessionFromToken(token)
  } catch(e) {
    console.error(e.message)
    console.warn('failed => trying manual auth...')
    sesId = await authorize()
  }
  return sesId
}