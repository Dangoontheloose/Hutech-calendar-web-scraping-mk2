const Student = require('./models/student');


exports.getStudent = (studentID) => {

    return Student.findOne({ username: studentID })
        .exec()
        .then((student) => {
            return student;
        })
        .catch(err => {
            console.log("Error occurred while searching for student: " + err);
            throw err;
        })
}


exports.updateCalendarID = (studentID, calendarID) => {
    return Student.findOneAndUpdate({ username: studentID }, { calID: calendarID }, (err, doc) => {
        if (err) {
            console.log('[ERROR] Error occured while updating calendar ID: ' + err);
            throw err;
        }
        console.log('Updated calendar ID to db:' + calendarID);
        return doc;
    })
}

exports.getCalendarID = (studentID) => {
    return Student.findOne({username: studentID})
    .exec()
    .then((student) => {
        return student.calID;
    })
    .catch(err => {
        console.log('[ERROR] Error occurred while searching for calendar:' + err);
        throw err;
    })
}
