const fs = require('fs');

const { google } = require('googleapis');
const jsonHandler = require('./jsonHandler');

const TOKEN_PATH = 'token.json';

const defaultScope = [
    'https://www.googleapis.com/auth/calendar.events'
]

const appCredentials = {
    client_id: '446698965884-3rh9g7p66cv34ktid73s91ebqa17bhm2.apps.googleusercontent.com',
    client_secret: 'ShuULz5T3c2ycKmGPqiul-KZ',
    // redirect: 'https://hutechhelper.herokuapp.com/api/redirect',
    redirect: 'http://localhost:5000/api/redirect',
}

const { client_id, client_secret, redirect } = appCredentials;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect);


exports.getAuthURL = () => {

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: defaultScope
    });
    return authUrl;
}

exports.acquireToken = async (link) => {


    const url = new URL(link, 'http://localhost:3000');
    // const url = new URL(link, 'http://hutechhelper.herokuapp.com');
    const code = new URLSearchParams(url.search).get('code');
    const { tokens } = await oAuth2Client.getToken(code);
    // console.log(`\n\nTokens: ${tokens}\n\n`);
    oAuth2Client.setCredentials(tokens);

    fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
    })
}


exports.createEvents = (studentID) => {

    //#region event example
    // var event = {
    //     'summary': 'Google I/O 2015',
    //     'location': '800 Howard St., San Francisco, CA 94103',
    //     'description': 'A chance to hear more about Google\'s developer products.',
    //     'start': {
    //         // 'dateTime': '2021-01-21T09:00:00+07:00',
    //         'dateTime': '2021-03-01T06:45:00+07:00',
    //         'timeZone': 'Asia/Bangkok',
    //     },
    //     'end': {
    //         // 'dateTime': '2021-01-21T17:00:00+07:00',
    //         'dateTime': '2021-03-01T09:00:00+07:00',
    //         'timeZone': 'Asia/Bangkok',
    //     },
    //     'recurrence': [
    //         'RRULE:FREQ=WEEKLY;COUNT=2;WKST=MO;BYDAY=MO,'
    //     ],
    //     // 'reminders': {
    //     //   'useDefault': false,
    //     //   'overrides': [
    //     //     {'method': 'email', 'minutes': 24 * 60},
    //     //     {'method': 'popup', 'minutes': 10},
    //     //   ],
    //     // },
    // };
    //#endregion


    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    jsonHandler.generateEventList(studentID)
        .then(eventList => {
            eventList.forEach(event => {

                calendar.events.insert({
                    calendarId: 'primary',
                    resource: event,
                }, function (err, event) {
                    if (err) {
                        console.log('There was an error contacting the Calendar service: ' + err);
                        return;
                    }
                    console.log(`Event created for subject: ${event.summary}`);
                })
            })
        });
}