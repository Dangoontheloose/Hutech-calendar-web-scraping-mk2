const fs = require('fs');

const { google } = require('googleapis');
const jsonHandler = require('./jsonHandler');

const db = require('./dbHandler');

const defaultScope = [
    'https://www.googleapis.com/auth/calendar.events',
    '    https://www.googleapis.com/auth/calendar'

]

const appCredentials = {
    client_id: '446698965884-3rh9g7p66cv34ktid73s91ebqa17bhm2.apps.googleusercontent.com',
    client_secret: 'ShuULz5T3c2ycKmGPqiul-KZ',
    // redirect: 'https://hutechhelper.herokuapp.com/api/redirect',
    redirect: 'http://localhost:5000/api/redirect',
    // redirect: 'https://hutechhelper.glitch.me/api/redirect',
}

const { client_id, client_secret, redirect } = appCredentials;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect);


const createNewCalendar = async (summary) => {
    const CAL = google.calendar({ version: 'v3', auth: oAuth2Client });

    var newCalendar = {
        'resource': {
            'summary': summary,
            'timeZone': 'Asia/Bangkok',
        }
    };
    try {
        const calendar = await CAL.calendars.insert(newCalendar);
        return calendar;
    } catch (err) {
        console.log("[ERROR] Error occurred while creating calendar: " + err);
        throw err;
    }
}
const deleteCurrentCalendar = async (calendarId) => {
    const CAL = google.calendar({ version: 'v3', auth: oAuth2Client });
    try {
        CAL.calendars.delete({ calendarId: calendarId });
    } catch (error) {
        console.log("[ERROR] Error occurred while deleting calendar: " + err);
    }
}

exports.getAuthURL = () => {

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: defaultScope
    });
    return authUrl;
}

exports.acquireToken = async (link) => {
    try {
        const url = new URL(link, 'http://localhost:5000');
        // const url = new URL(link, 'https://hutechhelper.glitch.me');
        // const url = new URL(link, 'http://hutechhelper.herokuapp.com');
        let myToken = {};
        const code = new URLSearchParams(url.search).get('code');
        oAuth2Client.getToken(code, (err, token) => {
            oAuth2Client.setCredentials(token);
            if (err) {
                throw err;
            }
            myToken = token;
        });
        return myToken;
    } catch (error) {
        console.log('[ERROR] Error occurred while acquiring token: ' + error);
        throw err;
    }

}




exports.importEvents = async (studentID) => {
    try {
        //delete current calendar
        await db.getCalendarID(studentID)
            .then(calendarId => {
                console.log('\n\nid cal: ' + calendarId);
                if (calendarId != undefined) {
                    deleteCurrentCalendar(calendarId)
                        .catch(err => { 
                            console.log('Error while deleting' + err);
                            throw err; });
                }
            })
        //recreate calendar
        const newCalendar = await createNewCalendar('Lich hoc[Generated with HUTECH-Helper]')
            .catch(err => { throw err; });
        //save new calendar to db for next delete call
        db.updateCalendarID(studentID, newCalendar.data.id)
            .catch(err => { throw err; })
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
        //generate event list from db
        jsonHandler.generateEventList(studentID)
            .then(eventList => {
                eventList.forEach(event => {
                    calendar.events.insert({
                        calendarId: newCalendar.data.id,
                        resource: event,
                    }, function (err, event_1) {
                        if (err) {
                            console.log('There was an error contacting the Calendar service: ' + err);
                            return;
                        }
                        console.log(`Event created for subject: ${event_1.data.summary}`);
                    });
                });
            });
    } catch (err_1) {
        console.log(err_1);
        console.log('Need to authenticate GG again!');
        throw err_1;
    }

}
