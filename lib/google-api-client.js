var fs = require('fs')
var util = require('util')
var readline = require('readline')
var gcla = require('./google-classroom')

const getSessionFromToken = util.promisify(gcla.getSessionFromToken)

const TOKEN_FILE = 'user_token.json'

const saveJSON = (file, json) => {
  fs.writeFileSync(file, JSON.stringify(json, null, 2))
  console.log('Saved JSON to', file)
}

const authorize = () => new Promise((resolve, reject) => {
  var authUrl = gcla.generateAuthUrl()
  console.log('Authorize this app by visiting this url: ', authUrl)
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close()
    gcla.getSessionFromCode(code, function(err, sesId) {
      var token = gcla.getSessionToken()
      //console.log('=> err:', err, 'token:', token, 'sesId:', sesId)
      if (!err && token) {
        saveJSON(TOKEN_FILE, token)
        console.log('(i) saved session to token file:', TOKEN_FILE)
        resolve(sesId)
      } else {
        console.log('(i) did not save session token')
        reject(err)
      }
    })
  })
})
  
exports.auth = async function() {
  let sesId
  console.log('trying to read session token from ' + TOKEN_FILE + '...')
  try {
    const token = require('../' + TOKEN_FILE)
    //console.log('=> token:', token)
    sesId = await getSessionFromToken(token)
  } catch(e) {
    console.error(e.message)
    console.log('failed => trying manual auth...')
    sesId = await authorize()
  }
  return sesId
}