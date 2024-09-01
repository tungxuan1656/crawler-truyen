const start = 1
const end = 822
const BOOK_INFO = {
    name: 'Nhân tổ',
    count: 822,
    author: 'Lừa Con',
    start,
    end,
    id: 'nhan-to',
}
const BASE_URL = `https://metruyencv.com/truyen/${BOOK_INFO.id}/chuong-`
const OUTPUT_FOLDER = `./output/${BOOK_INFO.id}`

const COOKIES = [
    {
        domain: 'metruyencv.com',
        expirationDate: 1726496582,
        hostOnly: true,
        httpOnly: false,
        name: 'accessToken',
        path: '/',
        sameSite: 'unspecified',
        secure: false,
        session: false,
        storeId: '0',
        value: '606370|Kp8WFP6XInbonNLA9aDSZaSbm2E9W21WoGW8m2t0',
    },
]

let REQUEST_CONFIG = {
    method: 'get',
    headers: {
        cookie: `accessToken=${COOKIES[0].value}`,
    },
}


module.exports = { BASE_URL, OUTPUT_FOLDER, BOOK_INFO, REQUEST_CONFIG, COOKIES }
