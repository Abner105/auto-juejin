const axios = require('axios')
const serverId = 'SCT192621TQSgwbQtWXOJ26pVYnPUqZZNA'
function send({ pushKey, title, desp }) {
  return new Promise((resolve, reject) => {
    console.log('server酱开始推送...')
    const option = {
      url: `https://sctapi.ftqq.com/${pushKey}.send`,
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        title,
        desp
      }
    }
    axios(option).then(
      res => {
        resolve()
        console.log('发送成功')
      },
      err => {
        reject(err)
      }
    )
  })
}

module.exports = function bot(message) {
  if (serverId) {
    send({
      pushKey: serverId, // 企业 ID
      title: '掘金今日打卡', // title
      desp: message // desp
    }).catch(error => {
      console.log(`发送失败 => ${error}`)
    })
  }
}
