const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const puppeteer = require('puppeteer')
const { BASE_URL, BOOK_INFO, COOKIES, OUTPUT_FOLDER, REQUEST_CONFIG } = require('./config')

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
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
        pageHTML = await axios.request({ ...REQUEST_CONFIG, url: link })
        $ = cheerio.load(pageHTML.data)
        $('canvas').remove()
        chapterContent = $('div[data-x-bind=ChapterContent]').html()
        chapterLoadmore = $('div#load-more').html()
        await sleep(100)
    }

    const chapterTitle = $('main[data-x-bind=ChapterAuto] div div h2.text-center').html()
    const chapterFull = `<div><h2>${chapterTitle}</h2><div>${chapterContent}${chapterLoadmore}</div></div>`

    fs.writeFileSync(output + '/chapters' + `/${name}.html`, chapterFull)

    return chapterTitle ?? ''
}

const crawl_li = async (output, link, name) => {
    console.log('crawl', link)

    const RETRY = 5

    let chapterContent = ''
    let chapterLoadmore = '#'
    let chapterTitle = ''
    let chapterFull = ''
    let count = 0

    while (chapterLoadmore.length > 0 && count < RETRY) {
        const browser = await puppeteer.launch({
            devtools: false,
            args: ['--disable-web-security'],
        })
        const page = await browser.newPage()
        for (let i = 0; i < COOKIES.length; i++) {
            await page.setCookie(COOKIES[i])
        }
        await page.setExtraHTTPHeaders({
            ...REQUEST_CONFIG.headers,
        })
        await page.goto(link)
        await page.setViewport({ width: 720, height: 720 })
        await page.evaluate(async () => {
            await new Promise(function (resolve) {
                setTimeout(resolve, 2000)
            })
        })
        const data = await page.evaluate(() => document.querySelector('*').outerHTML)

        let $ = cheerio.load(data)
        chapterContent = $('div[data-x-bind=ChapterContent]').html()
        chapterLoadmore = $('div#load-more').html()
        chapterTitle = $('main[data-x-bind=ChapterAuto] div div h2.text-center').html()
        chapterFull = `<div><h2>${chapterTitle}</h2><div>${chapterContent}${chapterLoadmore}</div></div>`

        if (chapterLoadmore.length > 0) {
            console.log('Has load more !!!! => Re-crawl', name)
        }
        count += 1
        if (count === RETRY) {
            // let imgCapture = await page.screenshot({ encoding: 'base64', fullPage: true })
            // chapterFull = `<img src="data:image/png;base64, ${imgCapture}" />`
            chapterFull = `<a href="${link}">Link</a>`
        }

        await browser.close()
        await sleep(1000)
    }

    fs.writeFileSync(output + '/chapters' + `/${name}.html`, chapterFull)
}

const create_book_folder = () => {
    try {
        if (!fs.existsSync(OUTPUT_FOLDER)) {
            fs.mkdirSync(OUTPUT_FOLDER)
        }
        if (!fs.existsSync(OUTPUT_FOLDER + '/chapters')) {
            fs.mkdirSync(OUTPUT_FOLDER + '/chapters')
        }
    } catch (err) {
        console.error(err)
    }
}

const crawl = async () => {
    create_book_folder()
    const chapter_length = BOOK_INFO.end
    const references = []
    for (let index = BOOK_INFO.start; index <= chapter_length; index++) {
        console.log(`crawl: `, index)
        const chapter_name = await crawl_link(
            OUTPUT_FOLDER,
            `${BASE_URL}${index}`,
            `chapter-${index}`,
        )

        if (chapter_name === '') {
            console.log('ERROR!!!')
            return
        }

        references.push(chapter_name)
        console.log('name:', chapter_name)
        await sleep(100)
    }

    const book = {
        name: BOOK_INFO.name,
        count: BOOK_INFO.count,
        author: BOOK_INFO.author,
        references,
        id: BOOK_INFO.id,
    }

    fs.writeFileSync(OUTPUT_FOLDER + '/book.json', JSON.stringify(book))
}

const re_check_crawler = () => {
    fs.readdir(OUTPUT_FOLDER + '/chapters', async (err, files) => {
        files.forEach((file) => {
            fs.readFile(OUTPUT_FOLDER + '/chapters/' + file, 'utf8', (err, data) => {
                if (data.length < 1000) console.log(file)
            })
        })

        for (let indexFile = 0; indexFile < files.length; indexFile++) {
            const file = files[indexFile]
            const data = await fs.promises.readFile(OUTPUT_FOLDER + '/chapters/' + file, 'utf8')
            if (data.length < 1000) {
                const index = file.split('.')[0].split('-')[1]
                await crawl_li(OUTPUT_FOLDER, `${BASE_URL}${index}`, `chapter-${index}`)
                console.log('puppeteer-crawl:', file)
            }
        }
    })
}

module.exports = { crawl, re_check_crawler, crawl_li, sleep }

