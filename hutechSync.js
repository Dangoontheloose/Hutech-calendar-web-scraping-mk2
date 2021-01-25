
const puppeteer = require('puppeteer');
const fs = require('fs');
const Student = require('./models/student');
const db = require('./dbHandler');

const USERNAME_input_id = '#ctl00_ContentPlaceHolder1_ctl00_ucDangNhap_txtTaiKhoa';
const PASS_input_id = '#ctl00_ContentPlaceHolder1_ctl00_ucDangNhap_txtMatKhau';
const LOGIN_btn_id = '#ctl00_ContentPlaceHolder1_ctl00_ucDangNhap_btnDangNhap';
const ERROR_id = '#ctl00_ContentPlaceHolder1_ctl00_ucDangNhap_lblError'
const TKB_btn_id = '#ctl00_menu_lblThoiKhoaBieu';
const TKB_indicator_id = '#ctl00_ContentPlaceHolder1_ctl00_lblTT';


const url = "http://daotao.hutech.edu.vn";

//Lay username(mssv) de tim ttin sv trong database, neu khong co: xac thuc, luu tai khoan va tkb vao database
//Return: id cua tk trong database;
exports.getSchedule = async (username, password) => {
    try {


        // const browser = await puppeteer.launch({ args: ['--no-sandbox'] });  
        const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: false });
        const page = await browser.newPage();

        page.on('dialog', async dialog => {
            // console.log("Tat pop-up");
            await dialog.dismiss();
        });

        await page.goto(url);

        await page.type(USERNAME_input_id, username);
        await page.type(PASS_input_id, password);
        await page.click(LOGIN_btn_id);
        await page.screenshot('scr1.png');
        try {
            await page.waitForTimeout(1000);
            await page.$eval(ERROR_id, (err) => { console.log(err.textContent) })
            await browser.close();
            return null;
        }
        catch (success) {
            console.log('Dang nhap thanh cong');
            console.log('Tien hanh kiem tra tk trong db...');
            const student = await db.getStudent(username)
                .then(student => {
                    return student;
                })
                .catch(err => {
                    console.log('[ERROR]Gap phai loi trong qua trinh kiem tra tk trong db!');
                    return null;
                })
            if (student != null) {
                return student.username;
            }
            else {
                console.log('Tien hanh luu tk vao db...');
                await page.waitForSelector(TKB_btn_id);
                await page.click(TKB_btn_id);
                await page.waitForSelector(TKB_indicator_id);
                page.$$eval('div[class=grid-roll2] > table[class=body-table] > tbody > tr', subjects => {
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
                })
                    .then((results) => {
                        const newStudent = Student.create(
                            {
                                username: username,
                                schedule: results,
                            })
                            .then(() => {
                                browser.close();
                                console.log('Tao tk thanh cong!!!');
                            })
                    })
                return username;
            }
        }
    } catch (error) {
        console.log('[ERROR] Error occurred while trying to validate student account: ' + err);
        throw error;
    }
};
