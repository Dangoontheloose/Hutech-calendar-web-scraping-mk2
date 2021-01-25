const fs = require('fs');
const Student = require('./models/student');
const db = require('./dbHandler');

const time = {
    '1': (6 + 3 / 4),
    '4': (9 + 1 / 3),
    '7': (12 + 1 / 2),
    '10': (15),
    '13': (18)
};

const weekday = {
    'Hai': {
        'wdCode': 'MO',
        'daysFromStart': 0,
    },
    'Ba': {
        'wdCode': 'TU',
        'daysFromStart': 1,
    },
    'Tư': {
        'wdCode': 'WE',
        'daysFromStart': 2,
    },
    'Năm': {
        'wdCode': 'TH',
        'daysFromStart': 3,
    },
    'Sáu': {
        'wdCode': 'FR',
        'daysFromStart': 4,
    },
    'Bảy': {
        'wdCode': 'SA',
        'daysFromStart': 5,
    },
    'CN': {
        'wdCode': 'SU',
        'daysFromStart': 6,
    },

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
    let repeatDay1 = wday1 == null ? '' : weekday[wday1].wdCode;
    let repeatDay2 = wday2 == null ? '' : weekday[wday2].wdCode;


    return { rpTimes: repeatTimes, rpDay1: repeatDay1, rpDay2: repeatDay2 };
}
//#endregion

//#region startTime & endTime functions

const convertDate = (date, daysFromStart1, daysFromStart2 = null) => {
    let [day, month, year] =
        date
            .split('--')[0]
            .split('/');
    if (daysFromStart2 == null) {
        day = parseInt(day) + parseInt(daysFromStart1);
    }
    else {
        day = (parseInt(day) + parseInt(daysFromStart1)) < (parseInt(day) + parseInt(daysFromStart2))
            ? (parseInt(day) + parseInt(daysFromStart1))
            : (parseInt(day) + parseInt(daysFromStart2));
    }

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

    const results = newH + ':' + newM + ':00+07:00';
    return results;
}

const getStartEndDateTime = (startSess, sessCount, startDate, firstWeekday1, firstWeekday2) => {
    const startTime = time[startSess];
    const endTime = startTime + parseInt(sessCount) * 3 / 4;

    const start = convertTime(startTime);
    const end = convertTime(endTime);
    let date = '';
    if (firstWeekday2 == null) {
        date = convertDate(startDate, weekday[firstWeekday1].daysFromStart);
    }
    else {
        date = convertDate(startDate, weekday[firstWeekday1].daysFromStart, weekday[firstWeekday2].daysFromStart);
    }

    return { startTime: date + 'T' + start, endTime: date + 'T' + end }

}
//#endregion
const convertSubjectToEvent = (subject) => {
    const thu1 = subject['thu_1'];
    const thu2 = subject['thu_2'];
    const w1 = subject['so_tuan_hoc_1'];
    const w2 = subject['so_tuan_hoc_2'];
    const { startTime, endTime } = getStartEndDateTime(
        subject['tiet_bd'],
        subject['so_tiet'],
        subject['tg_hoc_2'],
        subject['thu_1'],
        subject['thu_2'])
    
        const { rpTimes, rpDay1, rpDay2 } = getRecurrence(thu1, thu2, w1, w2);
    const location = getLocationFromClassroom(subject['phong']);
    const event = {
        'summary': subject['subject'],
        'start': {
            'dateTime': startTime,
            'timeZone': 'Asia/Bangkok',
        },
        'end': {
            'dateTime': endTime,
            'timeZone': 'Asia/Bangkok',
        },
        'location': location,
        'recurrence': [
            `RRULE:FREQ=WEEKLY;COUNT=${rpTimes};WKST=MO;BYDAY=${rpDay1 + ',' + rpDay2}`
        ],
    };
    console.log('\n\n' + event['start'].dateTime);
    return event;
}

const getLocationFromClassroom = (room) => {
    let location = room.charAt(0);

    switch (location) {
        case 'A':
        case 'B':
            return 'Trường Đại Học Công Nghệ TP.HCM - HUTECH, 475A Điện Biên Phủ, Phường 25, Bình Thạnh, Thành phố Hồ Chí Minh, Việt Nam';
        case 'U':
            return 'Hutech, 31, 36 Ung Văn Khiêm, Phường 25, Bình Thạnh, Thành phố Hồ Chí Minh, Việt Nam';
        case 'D':
            return 'Hutech - Đại học Công Nghệ Tp HCM - Khu D, 276 Điện Biên Phủ, Phường 17, Bình Thạnh, Thành phố Hồ Chí Minh, Việt Nam';
        case 'E':
            return 'HUTECH University - E Campus (SHTP)'
        default:
            return '';
    }


}

//Read from json files containing schedule's data scraped from web and create a list of events based on it
exports.generateEventList = async (studentID) => {
    return db.getStudent(studentID)
        .then(student => {
            let scheduleForSbjWithTime = [];

            console.log(student.schedule);
            for (const subject of student.schedule) {
                if (subject['tg_hoc_2']) {
                    scheduleForSbjWithTime.push(subject);
                }
            }

            let eventList = [];
            scheduleForSbjWithTime.forEach(subject => {

                const event = convertSubjectToEvent(subject);
                eventList.push(event);
            })
            return eventList;
        })
}



