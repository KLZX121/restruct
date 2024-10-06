// todo:
// * global data import/export
// * add some colour
// * scheduler


// ===============
// DATA MANAGEMENT
// ===============

let globalData = {
    reminders: [],
    remindersN: 0
}

globalData = parseGlobalData('{"reminders":[{"id":7,"name":"ages ago","date":"2023-12-31T13:00:00.000Z","isFullDay":true},{"id":3,"name":"yesterday","date":"2024-10-05T14:00:00.000Z","isFullDay":true},{"id":1,"name":"today full","date":"2024-10-06T13:00:00.000Z","isFullDay":true},{"id":2,"name":"today timed","date":"2024-10-07T09:06:38.563Z","isFullDay":false},{"id":0,"name":"long 1","date":null,"isFullDay":false},{"id":4,"name":"tomorrow","date":"2024-10-07T13:00:00.000Z","isFullDay":true},{"id":5,"name":"wednesday timed","date":"2024-10-09T09:07:00.000Z","isFullDay":false},{"id":6,"name":"long way away timed","date":"2024-10-24T23:07:00.000Z","isFullDay":false}],"remindersN":8}');
refreshReminders();

// parse globalData from stringified JSON
function parseGlobalData(stringData) {
    data = JSON.parse(stringData);

    // parse reminder dates
    data.reminders.forEach((reminder, index) => {
        if (reminder.date && !(reminder.date instanceof Date)) {
            data.reminders[index].date = new Date(reminder.date);
        }
    });

    return data;
}

// return a piece of data from globalData
function retrieveData(dataType, dataId) {
    switch (dataType) {
        case 'reminder':
            let output = null;
            for (let i = 0; i < globalData.reminders.length; i++) {
                const reminder = globalData.reminders[i];
                if (reminder.id == dataId) {
                    output = reminder;
                    break;
                }
            }
            return output;
    }
}
// delete a piece of data from globalData
function deleteData(dataType, dataId) {
    switch (dataType) {
        case 'reminder':
            for (let i = 0; i < globalData.reminders.length; i++) {
                const reminder = globalData.reminders[i];
                if (reminder.id == dataId) {
                    globalData.reminders.splice(i, 1);
                    break;
                }
            }
    }
}
// generate a reminder data object from the form
function generateReminderData(id) {
    let date;
    let isFullDay = false;
    if (enableDateInput.checked) {
        date = new Date(dateInput.value);
    }  else {
        date = new Date();
    }
    if (enableTimeInput.checked) {
        date.setHours(timeInput.value.split(':')[0], timeInput.value.split(':')[1])
    } else if (enableDateInput.checked) {
        isFullDay = true;
        date.setHours(0, 0);
    } else {
        date = null;
    }

    let data = {
        id,
        name: nameInput.value,
        date,
        isFullDay
    }
    return data;
}

// ===============
// LIVE TIME
// ===============

!function updateTime() {
    timeDisp.textContent = formatTime(new Date());

    setTimeout(updateTime, (60 - (new Date()).getSeconds()) * 1000);
}();
!function updateDate() {
    const currentTime = new Date();

    let day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentTime.getDay()];
    dayDisp.textContent = day;

    date.textContent = formatDate(currentTime, 'dd/mm/yyyy');

    let msToNextDay = (((24 - currentTime.getHours()) * 60) - currentTime.getMinutes()) * 1000 * 60;
    setTimeout(updateDate, msToNextDay);
}();
function formatTime(date) {
    let hours = date.getHours();
    hours = (hours < 10 ? '0' : '') + hours;
    let minutes = date.getMinutes();
    minutes = (minutes < 10 ? '0' : '') + minutes;

    return `${hours}:${minutes}`;
}
function formatDate(date, format) {
    let day = date.getDate();
    day = (day < 10 ? '0' : '') + day;
    let month = date.getMonth() + 1;
    month = (month < 10 ? '0' : '') + month;
    let year = date.getFullYear();

    dateString = format.replace('dd', day).replace('mm', month).replace('yyyy', year);
    return dateString;
}
function formatSmartDateTime(date, isFullDay) {
    let dateStr = ''
    const currentTime = new Date();
    if (date) {
        let dayDiff = date.getDate() - currentTime.getDate();
        let monthDiff = Math.abs(date.getMonth() - currentTime.getMonth());
        let yearDiff = Math.abs(date.getFullYear() - currentTime.getFullYear());

        // generate day
        if (!yearDiff && !monthDiff && !dayDiff) {
            dateStr = 'Today';
        } else if (!yearDiff && !monthDiff && dayDiff == 1) {
            dateStr = 'Tomorrow';
        } else if (!yearDiff && !monthDiff && dayDiff < 7 && dayDiff > 0) {
            dateStr =  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        } else {
            dateStr = formatDate(date, 'dd/mm/yyyy');
        }

        // generate time
        if (!isFullDay && !dateStr.includes('/')) {
            dateStr += ' ' + formatTime(date);
        }
    }

    return dateStr;
}
// ===============
// KEYBINDS
// ===============

document.addEventListener('keyup', event => {
    if (document.activeElement != document.body) return;
    switch (event.key) {
        case 'r':
            newReminderBtn.click();
            break;
        case 'q':
            quickNotesInput.focus();
            break;
    }
});
popupSec.addEventListener('keyup', event => {
    if (popupSec.style.display == 'none') return;
    switch (event.key) {
        case 'Enter':
            submitPopupBtn.click();
            break;
        case 'Escape':
            togglePopup(false);
            break;
    }
});
quickNotesInput.addEventListener('keyup', event => {
    if (event.key == 'Escape') {
        quickNotesInput.blur();
    }
});

// ===============
// REMINDERS
// ===============

newReminderBtn.addEventListener('click', () => togglePopup(true, 0));

function editReminder(data) {
    document.getElementById(`reminder${data.id}`).remove();
    addNewReminder(data);
    refreshReminders();
}
// sorts reminders by date from closest to furthest
// also fully updates reminders in dom
function refreshReminders() {

    globalData.reminders.sort((a, b) => {
        let dateOne = a.date || new Date((new Date()).setHours(23, 59));
        let dateTwo = b.date || new Date((new Date()).setHours(23, 59));
        
        return dateOne.getTime() - dateTwo.getTime();
    });

    // remove reminders from dom
    reminderInputCon.textContent = '';
    // re-add reminders to dom
    globalData.reminders.forEach(reminder => {
        addNewReminder(reminder);
    });
}
// adds a reminder to the dom (does not change global data)
function addNewReminder(reminderData) {
    let dateStr = formatSmartDateTime(reminderData.date, reminderData.isFullDay);

    let dateColor = '';
    const timeDifference = reminderData.date?.getTime() - (new Date()).getTime();
    const isToday = dateStr.includes('Today');

    if (timeDifference < 0) {
        dateColor = (isToday && reminderData.isFullDay) ? 'dodgerblue' : 'crimson';
    } else if (isToday) {
        dateColor = 'dodgerblue';
    }

    let infinitySymbol = dateStr ? '' : 'infinity';

    let reminderTimeHTML = `<span class="reminderTime ${dateColor} ${infinitySymbol}">${dateStr}</span>`;
    let reminderTitleHTML = `<span class="reminderTitle">${reminderData.name}</span>`;
    let reminderMenuHTML = `<span class="menuIcon" id="menuR${reminderData.id}"><div></div><div></div><div></div></span>`;
    
    let reminderHTML = document.createElement('div');
    reminderHTML.className = 'reminderCon';
    reminderHTML.id = `reminder${reminderData.id}`;
    reminderHTML.innerHTML = `
        ${reminderTimeHTML}
        ${reminderTitleHTML}
        ${reminderMenuHTML}
    `;

    reminderInputCon.appendChild(reminderHTML);

    document.getElementById(`menuR${reminderData.id}`).addEventListener('click', event => {
        menuClick(event, reminderData.id);
    });
}
// deletes a reminder from the dom and global data
function deleteReminder(reminderId) {
    // delete from dom
    document.getElementById(`reminder${reminderId}`).remove();

    // delete from global data
    deleteData('reminder', reminderId);
}

// ===============
// MENU
// ===============

document.addEventListener('contextmenu', event => {
    if ([event.target.className, event.target.parentElement.className].includes('reminderCon')) {
        event.preventDefault();

        // extract id
        let targetId = event.target.id || event.target.parentElement.id;
        let id = '';
        
        for (let i = 1; i <= targetId.length; i++) {
            if (isNaN(targetId.slice(-i))) {
                id = targetId.slice(targetId.length - i + 1);
                break;
            } 
        }
        id = parseInt(id);
        
        menuClick(event, id);
    }
});

function menuClick(event, reminderId) {
    // show menu
    itemMenu.style.left = event.clientX + 10;
    itemMenu.style.top = event.clientY + 10;
    itemMenu.style.display = 'flex';
    
    document.addEventListener('mousedown', event => {
        itemMenu.style.display = 'none';

        if (event.target == menuOptionEdit) {
            itemId.textContent = reminderId;
            togglePopup(true, 1, retrieveData('reminder', reminderId));
        } else if (event.target == menuOptionDelete) {
            deleteReminder(reminderId);
        }
    }, { once: true });
}

// ===============
// SETTINGS POPUP
// ===============

popupSec.addEventListener('click', event => {
    if (event.target == popupSec && !window.getSelection().toString()) togglePopup(false);
});
submitPopupBtn.addEventListener('click', () => submitPopup());
clearPopupBtn.addEventListener('click', () => resetPopup());

enableDateInput.addEventListener('change', () => {
    dateInput.disabled = !enableDateInput.checked;
});
enableTimeInput.addEventListener('change', () => {
    timeInput.disabled = !enableTimeInput.checked;
});

// data validation and submission
function checkInputs() {
    let validInputs = true;

    if (nameInput.value.length > 50) {
        popupError.textContent = 'Name too long';
        validInputs = false;
    } else if (!nameInput.value) {
        popupError.textContent = 'Please enter a name';
        validInputs = false;
    } else if (enableDateInput.checked && !dateInput.value) {
        popupError.textContent = 'Please enter a date';
        validInputs = false;
    } else if (enableTimeInput.checked && !timeInput.value) {
        popupError.textContent = 'Please enter a time';
        validInputs = false;
    }
    
    return validInputs;
}
function togglePopup(show, settingType, data) {
    resetPopup(true);

    popupSec.style.display = show ? 'flex' : 'none';

    if (!show) return;

    // settingType variable is an index of this array
    const settingsTypes = ['New Reminder', 'Edit Reminder'];

    popupTitle.textContent = settingsTypes[settingType];

    // input data to form if exists
    if (data) {
        nameInput.value = data.name;
        if (data.date) {
            enableDateInput.checked = true;
            dateInput.disabled = false;
            dateInput.value = formatDate(data.date, 'yyyy-mm-dd');
        }
        if (data.date && !data.isFullDay) {
            enableTimeInput.checked = true;
            timeInput.disabled = false;
            timeInput.value = formatTime(data.date);
        }
    }
    setTimeout(() => nameInput.focus(), 50);
}
function submitPopup() {
    popupError.textContent = '';

    switch(popupTitle.textContent) {
        case 'New Reminder':
            if (!checkInputs()) break;

            // get data from form
            let reminderData = generateReminderData(globalData.remindersN);
            
            // update global data
            globalData.remindersN++;
            globalData.reminders.push(reminderData);
            
            // add to dom
            addNewReminder(reminderData);

            refreshReminders();
            
            togglePopup(false);
            break;

        case 'Edit Reminder':
            // retrieve reminder id
            let id = parseInt(itemId.textContent);

            if (!checkInputs()) break;

            // get data from form
            let data = generateReminderData(id);

            // update global data
            for (let i = 0; i < globalData.reminders.length; i++) {
                const reminder = globalData.reminders[i];
                if ((reminder.id) == id) {
                    globalData.reminders[i] = data;
                    break;
                }
            }

            // edit dom
            editReminder(data);

            refreshReminders();

            togglePopup(false);
            break;
    }
}
function resetPopup(clearTitle = false) {
    if (clearTitle) popupTitle.textContent = '';
    // clear inputs
    nameInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    // clear errors
    popupError.textContent = '';
    // disable stuff
    enableDateInput.checked = false;
    dateInput.disabled = true;
    enableTimeInput.checked = false;
    timeInput.disabled = true;
}