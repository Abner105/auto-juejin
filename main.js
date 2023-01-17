const JuejinHelper = require('juejin-helper')
const serverNotify = require('./utils/serverNotify')
const config = require('./utils/config')

async function run(cookie, serverId) {
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

    let command = [
      { times: 10, command: ['D', 'L', '2'] },
      { times: 10, command: ['D', 'R', '2'] },
      { times: 10, command: ['D', 'L', '2'] }
    ]

    while (todayDiamond < todayLimitDiamond) {
      const info = await seagold.gameInfo() // 游戏状态
      if (info.gameStatus === 1) {
        gameInfo = info.gameInfo // 继续游戏
      } else {
        gameInfo = await seagold.gameStart() // 开始游戏
      }
      await seagold.gameCommand(gameInfo.gameId, command) // 执行命令
      const result = await seagold.gameOver() // 游戏结束
      todayDiamond = result.todayDiamond
      todayLimitDiamond = result.todayLimitDiamond
      if (!todayDiamond) break // 矿石不增加，退出循环
    }

    msg += `完成海底掘金,今日获取矿石${todayDiamond},今日矿石上限${todayLimitDiamond}。\n`

    // 获取当前矿石数
    const mine = await growth.getCurrentPoint()
    msg += `矿石数量总计${mine}。\n`

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
  serverNotify(msg, serverId)
}

config.cookies.forEach((cookie, index) => {
  run(cookie, config.serverIds[index])
})
