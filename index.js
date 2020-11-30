if (process.env.NODE_ENV !== "production") require("dotenv").config();
const puppeteer = require("puppeteer");
const $ = require("cheerio");
const cronJob = require("cron").CronJob;
const nodemailer = require("nodemailer");

const url =
    "https://www.makro.co.za/electronics-computers/computers-tablets/laptops-notebooks/gaming/gigabyte-39-cm-15-6-aorus-5-intel-core-i5-gaming-laptop-gtx-1650-ti-/p/000000000000398860_EA";

async function configureBrowser() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    return page;
}

async function checkPrice(page) {
    await page.reload();
    let html = await page.evaluate(() => document.body.innerHTML);
    //console.log(html);
    $(".price", html).each(function() {
        let zarPrice = $(this).text();
        let currentPrice = Number(zarPrice.replace(/[^0-9.-]+/g, ""));
        currentPrice = currentPrice.toString();
        currentPrice = currentPrice.slice(0, -2);
        currentPrice = parseInt(currentPrice);
        console.log(currentPrice);
        if (currentPrice < 24999) {
            console.log("BUY!!!! " + currentPrice);
            sendNotification(currentPrice);
        }
    });
}

async function startTracking() {
    const page = await configureBrowser();

    let job = new CronJob(
        "* */30 * * * *",
        function() {
            //runs every 30 minutes in this config
            checkPrice(page);
        },
        null,
        true,
        null,
        null,
        true
    );
    job.start();
}

async function sendNotification(price) {
    let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SMTP_HOST,
        port: process.env.EMAIL_SMTP_PORT,

        auth: {
            user: process.env.EMAIL_SMTP_USERNAME,
            pass: process.env.EMAIL_SMTP_PASSWORD,
        },
    });

    let textToSend = "Price dropped to " + price;
    let htmlText = `<a href=\"${url}\">Link</a>`;

    let info = await transporter.sendMail({
        from: '"Price Tracker" <hello@khabubundivhu.co.za>',
        to: "khabubundivhu@gmail.com",
        subject: "Price dropped to " + "R" + price,
        text: textToSend,
        html: htmlText,
    });

    console.log("Message sent: %s", info.messageId);
}

async function monitor() {
    let page = await configureBrowser();
    await checkPrice(page);
}

monitor();