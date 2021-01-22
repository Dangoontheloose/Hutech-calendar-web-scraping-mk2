
const puppeteer = require('puppeteer');
const fs = require('fs');
const Student = require('./models/student');


const USERNAME_input_id = '#ctl00_ContentPlaceHolder1_ctl00_ucDangNhap_txtTaiKhoa';
const PASS_input_id = '#ctl00_ContentPlaceHolder1_ctl00_ucDangNhap_txtMatKhau';
const LOGIN_btn_id = '#ctl00_ContentPlaceHolder1_ctl00_ucDangNhap_btnDangNhap';
const ERROR_id = '#ctl00_ContentPlaceHolder1_ctl00_ucDangNhap_lblError'
const TKB_btn_id = '#ctl00_menu_lblThoiKhoaBieu';



const url = "http://daotao.hutech.edu.vn";

//Lay username(mssv) de tim ttin sv trong database, neu khong co: xac thuc, luu tai khoan va tkb vao database
//Return: id cua tk trong database;
exports.getSchedule = async (username, password) => {
    const student = await Student.findOne({ username: username }, (err, doc) => {
        if (err) {
            console.log("something went wrong...");
            return null
        }
        if (doc == null) {
            console.log('Ko tim thay ng dung, tien hanh dang nhap xac thuc');
            return doc;
        }
        console.log(doc);
        return doc;
    });

    if (student != null) {
        return student._id;
    }
    else {
        console.log('Here we go again');
    }

    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    page.on('dialog', async dialog => {
        // console.log("Tat pop-up");
        await dialog.dismiss();
    });

    await page.goto(url);

    await page.type(USERNAME_input_id, username);
    await page.type(PASS_input_id, password);
    await page.click(LOGIN_btn_id);

    try {
        await page.waitForTimeout(1000);
        await page.$eval(ERROR_id, (err) => { console.log(err.textContent) })
        await browser.close();
        return null;
    }
    catch (success) {
        console.log('Dang nhap thanh cong');

    }

    await page.waitForSelector(TKB_btn_id);
    // await page.waitForTimeout(1000);
    await page.click(TKB_btn_id);
    await page.waitForTimeout(1000);

    const results = await page.$$eval('div[class=grid-roll2] > table[class=body-table] > tbody > tr', subjects => {
        let data = [];
        //parent: tuong trung cho row cua 1 mon hoc
        subjects.forEach(subject => {

            function assignTextContent(element, query) {
                let returnedElement = element.querySelector(query);
                if (returnedElement == null) {
                    return null;
                }
                else {
                    return returnedElement.textContent;
                }
            }

            function assignTooltipText(element, query) {
                let returnedElement = element.querySelector(query);
                if (returnedElement == null) {
                    return null;
                }
                else {
                    let tooltip = returnedElement.getAttribute('onmouseover');
                    let arr = tooltip.split("'");
                    return arr[1];
                }
            }

            let subjectFields = {};

            subjectFields["subject"] = subject.querySelector('td:nth-of-type(2)').textContent;
            subjectFields["thu_1"] = assignTextContent(subject, 'td:nth-of-type(7) > div');
            subjectFields["thu_2"] = assignTextContent(subject, 'td:nth-of-type(7) >table > tbody > tr > td');
            subjectFields["tiet_bd"] = assignTextContent(subject, 'td:nth-of-type(8) > div');
            subjectFields["so_tiet"] = assignTextContent(subject, 'td:nth-of-type(9) > div');
            subjectFields["phong"] = assignTextContent(subject, 'td:nth-of-type(10) > div');
            subjectFields["tg_hoc_1"] = assignTextContent(subject, 'td:nth-of-type(12) >table > tbody > tr > td');
            subjectFields["tg_hoc_2"] = assignTextContent(subject, 'td:nth-of-type(12) > div');
            subjectFields["so_tuan_hoc_1"] = assignTooltipText(subject, 'td:nth-of-type(12) > div');
            subjectFields["so_tuan_hoc_2"] = assignTooltipText(subject, 'td:nth-of-type(12) > table > tbody > tr >td');



            data.push(subjectFields);
        });
        return data;
    });
    let newID = '';
    const newStudent = await Student.create(
        {
            username: username,
            password: password,
            // subject: 'someshit',
            schedule: results,
            // {
            //     subject: results['subject'],
            //     thu_1: results['thu_1'],
            //     thu_2: results['thu_2'],
            //     tiet_bd: results['tiet_bd'],
            //     so_tiet: results['so_tiet'],
            //     phong: results['phong'],
            //     tg_hoc_1: results['tg_hoc_1'],
            //     tg_hoc_2: results['tg_hoc_2'],
            //     so_tuan_hoc_1: results['so_tuan_hoc_1'],
            //     so_tuan_hoc_2: results['so_tuan_hoc_2'],
            // }
        }
        // (err, doc) => { 
        //     console.log(doc);
        //     newID = newStudent._id;
        // }
    )

    // fs.writeFileSync('./userSchedule.json', JSON.stringify(results), (err) => { console.log(err); })
    newID = newStudent._id;
    await browser.close();
    return newID;
};
