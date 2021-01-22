const fs = require('fs');
const Student = require('./models/student');


const time = {
    '1': (6 + 3 / 4),
    '4': (9 + 1 / 3),
    '7': (12 + 1 / 2),
    '10': (15),
    '13': (18)
};

const weekday = {
    'Hai': 'MO',
    'Ba': 'TU',
    'Tư': 'WE',
    'Năm': 'TH',
    'Sáu': 'FR',
    'Bảy': 'SA',
    'CN': 'SU',
}
//#region  reccurence functions
const getRecurrence = (wday1, wday2, w1, w2) => {
    const getRepeatTime = (activeWeeks) => {
        if (activeWeeks == null) {
            return 0;
        }
        let repeatTimes = 0;
        for (let i = 0; i < activeWeeks.length; i++) {
            const char = activeWeeks[i];
            if (!isNaN(char)) {
                repeatTimes++;
            }
        }
        return repeatTimes;
    }

    let repeatTimes = getRepeatTime(w1) + getRepeatTime(w2);
    let repeatDay1 = wday1 == null ? '' : weekday[wday1];
    let repeatDay2 = wday2 == null ? '' : weekday[wday2];


    return { rpTimes: repeatTimes, rpDay1: repeatDay1, rpDay2: repeatDay2 };
}
//#endregion

//#region startTime & endTime functions

const convertDate = (date) => {
    const [day, month, year] =
        date
            .split('--')[0]
            .split('/');

    const full = year + '-' + month + '-' + day;
    return full;
}
//convert time from float number to the right format
const convertTime = (time) => {
    //Tach gio phut 
    let hour = Math.floor(time);
    let min = Math.floor((time % hour) * 60);
    //put extra '0' in if smaller than 10. Gotta keep the rigth format
    let newH = hour < 10 ? '0' + hour : hour
    let newM = min < 10 ? '0' + min : min

    // const results = hour + ':' + min + ':00+7:00';
    const results = newH + ':' + newM + ':00+07:00';
    return results;
}

const getStartEndDateTime = (startSess, sessCount, startDate) => {
    const startTime = time[startSess];
    const endTime = startTime + parseInt(sessCount) * 3 / 4;

    const start = convertTime(startTime);
    const end = convertTime(endTime);
    const date = convertDate(startDate);

    return { startTime: date + 'T' + start, endTime: date + 'T' + end }

    // return {startTime: convertTime(startTime), endTime: convertTime(endTime)};
}
//#endregion

//Read from json files containing schedule data scraped from web and create a list of events based on it
exports.generateEventList = async (studentID) => {
    // var data = fs.readFileSync('./userSchedule.json', 'utf-8');
    // var sch = JSON.parse(data);
    
    var sch = [];
    
    await Student.findById(studentID, (err, doc) => {
        if(err) {
            console.log(err);
            return null;
        }
        if(doc == null) {return null}
        let sc = [];
        sc = doc.schedule;
        sch = sc;
    })

    var schedule = [];
    console.log(sch);
    for (const subject of sch) {
        if (subject['tg_hoc_2']) {
            schedule.push(subject);
        }
    }

    // sch.forEach(subject => {
    //     if (subject['Thoi gian hoc 2']) {
    //         schedule.push(subject);
    //     }
    // });
    
    let eventList = [];
    schedule.forEach(subject => {

        const thu1 = subject['thu_1']
        const thu2 = subject['thu_2']
        const w1 = subject['so_tuan_hoc_1'];
        const w2 = subject['so_tuan_hoc_2'];
        const { startTime, endTime } = getStartEndDateTime(
            subject['tiet_bd'],
            subject['so_tiet'],
            subject['tg_hoc_2'])
        // console.log(startTime);
        // console.log(endTime);

        const { rpTimes, rpDay1, rpDay2 } = getRecurrence(thu1, thu2, w1, w2);

        var event = {
            'summary': subject['subject'],
            'start': {
                'dateTime': startTime,
                'timeZone': 'Asia/Bangkok',
            },
            'end': {
                'dateTime': endTime,
                'timeZone': 'Asia/Bangkok',
            },
            'recurrence': [
                `RRULE:FREQ=WEEKLY;COUNT=${rpTimes};WKST=MO;BYDAY=${rpDay1 + ',' + rpDay2}`
            ],
        };
        console.log('\n\n' + event['summary']); 
        eventList.push(event);
    })
    return eventList;
}

