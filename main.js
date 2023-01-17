const JuejinHelper = require('juejin-helper')
const serverNotify = require('./utils/serverNotify')
const cookie =
  '_ga=GA1.2.730280958.1656556399; __tea_cookie_tokens_2608=%257B%2522web_id%2522%253A%25227114855517739566624%2522%252C%2522user_unique_id%2522%253A%25227114855517739566624%2522%252C%2522timestamp%2522%253A1656556399863%257D; sid_guard=65f314ebadbe192c8853c5509f5f455e%7C1658113301%7C31536000%7CTue%2C+18-Jul-2023+03%3A01%3A41+GMT; uid_tt=231a52d80c42585e50590428e2dfe5f8; uid_tt_ss=231a52d80c42585e50590428e2dfe5f8; sid_tt=65f314ebadbe192c8853c5509f5f455e; sessionid=65f314ebadbe192c8853c5509f5f455e; sessionid_ss=65f314ebadbe192c8853c5509f5f455e; sid_ucp_v1=1.0.0-KGZkOWM3ODg5Y2MyZGMyNGJlN2UxMzkzNTU5ZWMzODJhYmMwYzdmMmMKFwiX99Dmx4zFBRCVmtOWBhiwFDgCQPEHGgJsZiIgNjVmMzE0ZWJhZGJlMTkyYzg4NTNjNTUwOWY1ZjQ1NWU; ssid_ucp_v1=1.0.0-KGZkOWM3ODg5Y2MyZGMyNGJlN2UxMzkzNTU5ZWMzODJhYmMwYzdmMmMKFwiX99Dmx4zFBRCVmtOWBhiwFDgCQPEHGgJsZiIgNjVmMzE0ZWJhZGJlMTkyYzg4NTNjNTUwOWY1ZjQ1NWU; _tea_utm_cache_2608={%22utm_source%22:%22bdpcjjqd02408%22%2C%22utm_medium%22:%22sem_baidu_jj_pc_dc01%22%2C%22utm_campaign%22:%22sembaidu%22}; MONITOR_WEB_ID=ece54b99-b40f-4b09-8e86-c81402409ac6; _gid=GA1.2.1354107422.1673855249'
async function run() {
  let msg = ''
  try {
    const juejin = new JuejinHelper()
    await juejin.login(cookie)
    const growth = juejin.growth()

    // 获取今日签到状态
    const state = await growth.getTodayStatus()
    if (!state) {
      // 签到
      await growth.checkIn()
      msg = '签到成功。\n'
    }
    // 获取统计签到天数
    const count = await growth.getCounts()
    msg += `连续签到${count.cont_count}天,累计签到${count.sum_count}天。\n`

    // 抽奖
    await growth.drawLottery()
    msg += '完成抽奖。\n'

    // 获取抽奖幸运用户
    const lotteries = await growth.getLotteriesLuckyUsers({
      page_no: 1,
      page_size: 5
    }) // => { lotteries: [{ lottery_history_id }, ...] }
    const lottery_history_id = lotteries.lotteries[0].history_id
    // 沾喜气
    await growth.dipLucky(lottery_history_id) // => { has_dip, dip_value, total_value, dip_action }
    // 获取我的幸运值
    const luck = await growth.getMyLucky()
    msg += `完成沾喜气，当前幸运值${luck.total_value}。\n`

    // 海底掘金
    const seagold = juejin.seagold()
    await seagold.gameLogin() // 登陆游戏
    let gameInfo = null
    let todayDiamond = 0
    let todayLimitDiamond = 1500
    while (todayDiamond < todayLimitDiamond) {
      const info = await seagold.gameInfo() // 游戏状态
      if (info.gameStatus === 1) {
        gameInfo = info.gameInfo // 继续游戏
      } else {
        gameInfo = await seagold.gameStart() // 开始游戏
      }
      const command = ['U', 'L']
      await seagold.gameCommand(gameInfo.gameId, command) // 执行命令
      const result = await seagold.gameOver() // 游戏结束
      todayDiamond = result.todayDiamond
      todayLimitDiamond = result.todayLimitDiamond
    }
    msg += '完成海底掘金。\n'

    // 获取当前矿石数
    const mine = await growth.getCurrentPoint()
    msg += `剩余矿石数量${mine}。`

    // 收集bug
    const bugfix = juejin.bugfix()
    const notCollectBugList = await bugfix.getNotCollectBugList()
    await bugfix.collectBugBatch(notCollectBugList)
    msg += `收集Bug ${notCollectBugList.length}。\n`
    const competition = await bugfix.getCompetition()
    const bugfixInfo = await bugfix.getUser(competition)
    msg += `现存Bug数量 ${bugfixInfo.user_own_bug}。\n`
    await juejin.logout()
  } catch (error) {
    msg += error
  }
  serverNotify(msg)
}

run()
