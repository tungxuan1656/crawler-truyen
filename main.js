const { crawl, re_check_crawler, sleep } = require('./utils')

const main = async () => {
    console.log('CRAWL')
    crawl()
    await sleep(3000)
    console.log('RE-CRAWL')
    re_check_crawler()
}

main()

