const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const crawl_link = async (output, link, name) => {
    let pageHTML = await axios.request({ url: link })
    let $ = cheerio.load(pageHTML.data)
    let chapterContent = $('div[data-x-bind=ChapterContent]').html()

    const chapterTitle = $('main[data-x-bind=ChapterAuto] div div h2.text-center').html()
    const chapterFull = `<div><h2>${chapterTitle}</h2><div>${chapterContent}</div></div>`

    fs.writeFileSync(output + '/chapters' + `/${name}.html`, chapterFull)

    return chapterTitle ?? ''
}

const main = async (info, base_url, output) => {
    const chapter_length = info.end
    const references = []
    for (let index = info.start; index <= chapter_length; index++) {
        console.log(`crawl: `, index)
        const chapter_name = await crawl_link(output, `${base_url}${index}`, `chapter-${index}`)

        if (chapter_name === '') {
            console.log('ERROR!!!')
            return
        }

        references.push(chapter_name)
        console.log('name:', chapter_name)
        await sleep(200)
    }

    const book = {
        name: info.name,
        count: info.count,
        author: info.author,
        references,
        id: info.id,
    }

    fs.writeFileSync(output + '/book.json', JSON.stringify(book))
}

const start = 1
const end = 1396
const base_url = `https://metruyencv.com/truyen/hao-huu-tu-vong-ta-tu-vi-lai-tang-len/chuong-`
const output = './output/hao-huu-tu-vong-ta-tu-vi-lai-tang-len'
const info = {
    name: 'Hảo hữu tử vong ta tu vi lại tăng lên',
    count: 1396,
    author: 'Lão Bà Đại ĐạiTam Tam Đắc Cửu',
    start,
    end,
    id: 'hao-huu-tu-vong-ta-tu-vi-lai-tang-len',
}

main(info, base_url, output)

