const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const puppeteer = require('puppeteer')

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://metruyencv.com/truyen/do-thi-ta-tro-thanh-phu-nhi-dai-phan-phai/chuong-4',
    headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'vi,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
        'cache-control': 'max-age=0',
        cookie: 'metruyenchucom_session=eyJpdiI6InlkVDI2Yk1mek14MG80QUZiSE5qMlE9PSIsInZhbHVlIjoiQ2dqNVAycE9Ba1dub1g0am9rdWxxQ2x4b0xCS0dcL2dVeFJINFZMWnNrOE9ldWFQZFpIV3piM2dqcm5sbmVcL0hhIiwibWFjIjoiM2FjYzRkMzZlNGUwYTEzMWIzMWY0MGU1MDllNzQxYjBlMWIzODg0OTUyYjFhNzc2YzI5YTY0ZDVmNjg2MjVlMCJ9; accessToken=678141|ksbxMK7ChR2hWrloryECpa6DVYVvmsJrAX6WINlJ',
        priority: 'u=0, i',
        'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    },
}

const cookies = JSON.parse(`[
    {
        "domain": "metruyencv.com",
        "expirationDate": 1726912590,
        "hostOnly": true,
        "httpOnly": false,
        "name": "accessToken",
        "path": "/",
        "sameSite": "null",
        "secure": false,
        "session": false,
        "storeId": null,
        "value": "678141|ksbxMK7ChR2hWrloryECpa6DVYVvmsJrAX6WINlJ"
    },
    {
        "domain": "metruyencv.com",
        "expirationDate": 1740458569.11095,
        "hostOnly": true,
        "httpOnly": true,
        "name": "metruyenchucom_session",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "eyJpdiI6InlkVDI2Yk1mek14MG80QUZiSE5qMlE9PSIsInZhbHVlIjoiQ2dqNVAycE9Ba1dub1g0am9rdWxxQ2x4b0xCS0dcL2dVeFJINFZMWnNrOE9ldWFQZFpIV3piM2dqcm5sbmVcL0hhIiwibWFjIjoiM2FjYzRkMzZlNGUwYTEzMWIzMWY0MGU1MDllNzQxYjBlMWIzODg0OTUyYjFhNzc2YzI5YTY0ZDVmNjg2MjVlMCJ9"
    }
]`)

const crawl_li = async (output, link, name) => {
    console.log('crawl', link)
    const browser = await puppeteer.launch({ devtools: false, args: ['--disable-web-security'] })
    const page = await browser.newPage()
    for (let i = 0; i < cookies.length; i++) {
        await page.setCookie(cookies[i])
    }
    await page.setExtraHTTPHeaders({
        ...config.headers,
    })
    await page.goto(link)
    await page.setViewport({ width: 1920, height: 1920 })
    await page.evaluate(async () => {
        await new Promise(function (resolve) {
            setTimeout(resolve, 2000)
        })
    })
    const data = await page.evaluate(() => document.querySelector('*').outerHTML)

    // await browser.close()

    let $ = cheerio.load(data)
    $('canvas').remove()
    let chapterContent = $('div[data-x-bind=ChapterContent]').html()
    let chapterLoadmore = $('div#load-more').html()

    const chapterTitle = $('main[data-x-bind=ChapterAuto] div div h2.text-center').html()
    const chapterFull = `<div><h2>${chapterTitle}</h2><div>${chapterContent}${chapterLoadmore}</div></div>`

    fs.writeFileSync(output + '/chapters' + `/${name}.html`, chapterFull)
}

const crawl_link = async (output, link, name) => {
    let pageHTML = await axios.request({ url: link })
    let $ = cheerio.load(pageHTML.data)
    $('canvas').remove()
    let chapterContent = $('div[data-x-bind=ChapterContent]').html()
    let chapterLoadmore = $('div#load-more').html()

    let count = 0

    while (chapterContent.length < 1000 && count < 5) {
        count += 1
        console.log('Re-crawl:', link)
        pageHTML = await axios.request({ ...config, url: link })
        $ = cheerio.load(pageHTML.data)
        $('canvas').remove()
        chapterContent = $('div[data-x-bind=ChapterContent]').html()
        chapterLoadmore = $('div#load-more').html()
        await sleep(300)
    }

    if (count >= 5) {
        await crawl_li(output, link, name)
        return
    }

    const chapterTitle = $('main[data-x-bind=ChapterAuto] div div h2.text-center').html()
    const chapterFull = `<div><h2>${chapterTitle}</h2><div>${chapterContent}${chapterLoadmore}</div></div>`

    fs.writeFileSync(output + '/chapters' + `/${name}.html`, chapterFull)

    return chapterTitle ?? ''
}

const base_url = `https://metruyencv.com/truyen/hao-huu-tu-vong-ta-tu-vi-lai-tang-len/chuong-`
const output = './output/hao-huu-tu-vong-ta-tu-vi-lai-tang-len'

fs.readdir(output + '/chapters', async (err, files) => {
    files.forEach((file) => {
        fs.readFile(output + '/chapters/' + file, 'utf8', (err, data) => {
            if (data.length < 1000) console.log(file)
        })
    })

    for (let indexFile = 0; indexFile < files.length; indexFile++) {
        const file = files[indexFile]
        const data = await fs.promises.readFile(output + '/chapters/' + file, 'utf8')
        if (data.length < 1000) {
            const index = file.split('.')[0].split('-')[1]
            await crawl_link(output, `${base_url}${index}`, `chapter-${index}`)
            console.log('Done', file)
        }
    }
})

