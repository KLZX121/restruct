// todo:
// * global data import/export
// * add some colour
// * scheduler


// ===============
// DATA MANAGEMENT
// ===============

openDb(() => {
    refreshReminders()
    loadQuickNotes()
    loadPlannerData()
});

// generate a reminder data object from the form
function generateReminderData(id = 0) {
    // retrieve selected date (infinite/date/datetime) from selected button
    let dateType;
    document.querySelectorAll('.dateTimeInputOpt').forEach(el => {
        if (el.className.includes('optBtnSelected')) {
            dateType = el.value;
        }
    })

    // data object
    let data = {
        name: nameInput.value,
        dateType,
        dateTime: fp.selectedDates[0]
    }

    // enter id if edit operation
    if (id) {
        data.id = id;
    }

    addEditData('reminders', data);
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

    date.textContent = formatDate(currentTime, 'd/m/y');

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
// formats a date using the given format (replace y with year, m with month number, n with month string, and d with day)
function formatDate(date, format, doLeadingZeroes = true) {
    let day = date.getDate();
    if (doLeadingZeroes) day = (day < 10 ? '0' : '') + day;
    let monthNum = date.getMonth() + 1;
    let monthStr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthNum - 1];
    if (doLeadingZeroes) monthNum = (monthNum < 10 ? '0' : '') + monthNum;
    let year = date.getFullYear();

    dateString = format.replace('d', day).replace('m', monthNum).replace('n', monthStr).replace('y', year);
    return dateString;
}
function formatSmartDateTime(date, isFullDay, isMerged) {
    let dateStr = ''
    const currentTime = new Date();

    let dateDay = date.getDate();
    let dayDiff = dateDay - currentTime.getDate();
    let monthDiff = Math.abs(date.getMonth() - currentTime.getMonth());
    let yearDiff = Math.abs(date.getFullYear() - currentTime.getFullYear());

    // generate day
    if (!isMerged) {
        if (!yearDiff && !monthDiff && !dayDiff) {
            dateStr = 'Today';
        } else if (!yearDiff && !monthDiff && dayDiff == -1) {
            dateStr = 'Yesterday';
        } else if (!yearDiff && !monthDiff && dayDiff == 1) {
            dateStr = 'Tomorrow';
        } else if (!yearDiff && !monthDiff && dayDiff < 7 && dayDiff > 0) {
            dateStr =  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        } else {
            daySuff = [1, 21, 31].includes(dateDay) ? 'st' : [2, 22].includes(dateDay) ? 'nd' : [3, 23].includes(dateDay) ? 'rd' : 'th';
            dateStr = formatDate(date, `d${daySuff} n${yearDiff ? ' y' : ''}`, false);                
        }
    }

    // generate time
    if (!isFullDay && !dateStr.includes('/')) {
        dateStr += '-';
        dateStr += formatTime(date);
    }

    return dateStr;
}
// ===============
// KEYBINDS
// ===============

document.addEventListener('keyup', event => {
    if (document.activeElement != document.body || event.ctrlKey) return;
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

clrRemBtn.addEventListener('click', () => {
    if (confirm('Delete all reminders?')) {
        deleteAllData('reminders');
        refreshReminders();
    }
});

newReminderBtn.addEventListener('click', () => togglePopup(true, 0));

function delReminderDom(id) {
    document.querySelector(`.reminderCon[data-id="${id}"]`).remove();
}
// sorts reminders by date from closest to furthest
// also fully updates reminders in dom
async function refreshReminders() {
    let remindersData = await getAllData('reminders');

    // if no reminders then display placeholder
    if (!remindersData.length) {
        reminderInputCon.innerHTML = `<span class="placeholder">No reminders yet...</span>`;

        return;
    }

    // sort reminders
    remindersData.sort((a, b) => {
        let dateOne = a.dateTime;
        let dateTwo = b.dateTime;

        if (!dateOne && !dateTwo) {
            return 0
        } else if (!dateOne) {
            return -1
        } else if (!dateTwo) {
            return 1
        }
        
        return dateOne.getTime() - dateTwo.getTime();
    });

    // clear dom
    reminderInputCon.textContent = '';

    // re-add reminders to dom
    for (const reminder of remindersData) {
        await addNewReminderDom(reminder);
    }
}
// adds a reminder to the dom (does not change global data)
async function addNewReminderDom(reminderData) {
    // generate parent html
    let reminderHTML = document.createElement('div');

    let conClassList = 'reminderCon';
    
    // merge reminders on same day
    let isMerged = false;
    if (reminderInputCon.lastChild) {
        const prevReminderData = await getData('reminders', parseInt(reminderInputCon.lastChild.getAttribute('data-id')));
        if (
            (prevReminderData.dateType == 'infinite' && reminderData.dateType == 'infinite') ||
            (prevReminderData.dateType != 'infinite' && reminderData.dateType != 'infinite' && (formatDate(prevReminderData.dateTime, 'ymd') == formatDate(reminderData.dateTime, 'ymd')))
        ) {
            conClassList += ' mergedReminder';
            isMerged = true;
        }
    }
    
    reminderHTML.className = conClassList;
    reminderHTML.setAttribute('data-id', reminderData.id);


    // generate children html


    const timeDifference = reminderData.dateTime.getTime() - (new Date()).getTime();
    const isToday = formatDate(reminderData.dateTime, 'ymd') == formatDate(new Date(), 'ymd');
    
    let dateClassList = '';
    let timeClassList = '';

    // add past/present/future colouring to date and time
    // timeDifference < 0 means dateTime is older than current time
    if (timeDifference < 0) {
        dateClassList += isToday ? ' dodgerblue' : ' crimson'
        timeClassList += ' crimson';
    } else if (isToday) { // later on in the day
        dateClassList += ' dodgerblue';
        timeClassList += ' dodgerblue';
    }
    
    // format datetime into human readable
    let dateStr = formatSmartDateTime(reminderData.dateTime, reminderData.dateType == 'date', isMerged);

    let timedClass = '';
    if (reminderData.dateType == 'infinite') {
        timedClass = ' timeless'
    } else {
        timedClass = ' timed'
    }

    // split into day/time
    let dateTimeArr = dateStr.split('-');
        
    let dateSpan = document.createElement('span');
    dateSpan.className = 'reminderDate' + dateClassList + timedClass;
    
    let timeSpan = document.createElement('span');
    timeSpan.className = 'reminderTime' + timeClassList + timedClass;

    // if dateType is infinite
    if (reminderData.dateType == 'infinite') {
        dateSpan.innerHTML = '&nbsp;';
        timeSpan.innerHTML = '&nbsp;';
    } else if (dateTimeArr.length > 1){
        if (dateTimeArr[0]) {
            dateSpan.textContent = dateTimeArr[0]
        } else {
            dateSpan.innerHTML = '&nbsp;';
        }
        timeSpan.textContent = dateTimeArr[1];
    } else {
        dateSpan.textContent = dateTimeArr[0];
        timeSpan.innerHTML = '&nbsp;';
    }

    reminderHTML.appendChild(dateSpan);
    reminderHTML.appendChild(timeSpan);
    
    let titleSpan = document.createElement('span');
    titleSpan.className = 'reminderTitle';
    titleSpan.textContent = reminderData.name;
    reminderHTML.appendChild(titleSpan);

    let menuSpan = document.createElement('span');
    menuSpan.className = 'menuIcon';
    menuSpan.setAttribute('data-id', reminderData.id);
    menuSpan.innerHTML = `<div></div><div></div><div></div>`;
    reminderHTML.appendChild(menuSpan);

    reminderHTML.addEventListener('click', e => {
        console.log(e.target);
        
    });

    reminderInputCon.appendChild(reminderHTML);

    document.querySelector(`.menuIcon[data-id="${reminderData.id}"]`).addEventListener('click', event => {
        menuClick(event, reminderData.id);
    });
}
// deletes a reminder from the dom and global data
function deleteReminder(reminderId) {
    // delete from global data
    deleteData('reminders', reminderId);

    refreshReminders();
}

// ===============
// QUICK NOTES
// ===============

// auto save timer (3 seconds after last change)
let autoSaveID = -1;

quickNotesInput.addEventListener('input', () => {
    quickNotesSavedSpan.style.display = 'none';
    clearTimeout(autoSaveID);
    autoSaveID = setTimeout(() => {
        saveQuickNotes(quickNotesInput.value);

        quickNotesSavedSpan.style.display = 'inline';
        console.log('saved quick notes');
    }, 3000)
})

// gets data from database
function loadQuickNotes() {
    getData('quicknotes', 'singleton').then(data => quickNotesInput.value = data || '');
}

function saveQuickNotes(data) {
    addEditData('quicknotes', data, true);
}

// ===============
// PLANNER (temporary cmd line until ui is developed)
// ===============

document.addEventListener('keyup', event => {
    if (document.activeElement != document.body || event.ctrlKey) return;
    switch (event.key) {
        case 'p':
            plannerCmd.focus();
            break;
    }
});

plannerCmd.addEventListener('keyup', event => {
    if (event.key == 'Escape') {
        plannerCmd.blur();
    }
});

plannerCmd.addEventListener('keyup', e => {
    if (e.key == 'Enter') {
        submitPlannerCmd(plannerCmd.value);
        plannerCmd.blur();
    }
})

plannerCmd.addEventListener('focus', () => plannerCmdHelp.style.display = 'block');
plannerCmd.addEventListener('blur', () => plannerCmdHelp.style.display = 'none');

function submitPlannerCmd(value) {
    
    try {
        eventParams = value.split('.');
        
        switch (eventParams[0]) {
            case 'add':
                if (eventParams.length != 5) throw 'invalid cmd'
        
                plannerCmd.value = '';
        
                eventObject = {
                    startTime: eventParams[1],
                    endTime: eventParams[2],
                    name: eventParams[3],
                    description: eventParams[4]
                }
        
                addEditData('planner', eventObject);
                break;

            case 'edit':
                if (eventParams.length != 6) throw 'invalid cmd'

                plannerCmd.value = '';

                eventObject = {
                    id: parseInt(eventParams[1]),
                    startTime: eventParams[2],
                    endTime: eventParams[3],
                    name: eventParams[4],
                    description: eventParams[5]
                }

                addEditData('planner', eventObject);
                break;

            case 'del':
                if (eventParams.length != 2) throw 'invalid cmd'

                plannerCmd.value = '';

                deleteData('planner', parseInt(eventParams[1]));
                break;
        }

        loadPlannerData();
       
    } catch(error) {
        alert(error)
    }
}

function loadPlannerData() {
    plannerData.innerHTML = '';
    getAllData('planner')
    .then(events => {
        events.forEach(event => {
            let eventHTML = 
            `<div style="font-family: monospace;">
            <span style="color: dodgerblue; border-right: 1px solid; padding-right: 1em;">${event.id}</span> <span style="color: grey;">${event.startTime} ${event.endTime == 'null' ? '' : `- ${event.endTime}`}</span><br>
            <span style="font-size: 1.1em ">&nbsp;&nbsp;&nbsp;${event.name}</span><br>
            <span style="color: grey;">&nbsp;&nbsp;&nbsp;${event.description == 'null' ? '' : event.description + '<br>'}</span><br>
            </div>`

            plannerData.innerHTML += eventHTML;
        })
    })
}

// ===============
// MENU
// ===============

document.addEventListener('contextmenu', event => {
    let target;
    if (event.target.className.includes('reminderCon')) {
        target = event.target;
    } else if (event.target.parentElement.className.includes('reminderCon')) {
        target = event.target.parentElement;
    } else {
        return;
    }
    event.preventDefault();

    let id = parseInt(target.getAttribute('data-id'));

    menuClick(event, id);
});

function menuClick(event, id) {
    // show menu
    itemMenu.style.left = event.clientX + 10;
    itemMenu.style.top = event.clientY + 10;
    itemMenu.style.display = 'flex';
    
    document.addEventListener('mousedown', async event => {
        itemMenu.style.display = 'none';

        if (event.target == menuOptionEdit) {
            itemId.textContent = id;
            togglePopup(true, 1, await getData('reminders', id));
        } else if (event.target == menuOptionDelete) {
            deleteReminder(id);
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

infDTOpt.addEventListener('click', selectInfOpt);
dateDTOpt.addEventListener('click', selectDateOpt);
dateTimeDTOpt.addEventListener('click', selectDateTimeOpt);
let fp;
function selectInfOpt() {
    infDTOpt.classList.add('optBtnSelected');
    dateDTOpt.classList.remove('optBtnSelected');
    dateTimeDTOpt.classList.remove('optBtnSelected');

    fp?.destroy();
    dateTimeInput.style.display = 'none';

    dateTimeInput.dateType = 'infinity';
}
function selectDateOpt() {
    dateDTOpt.classList.add('optBtnSelected');
    infDTOpt.classList.remove('optBtnSelected');
    dateTimeDTOpt.classList.remove('optBtnSelected');

    fp = flatpickr(
        "#dateTimeInput", 
        {
            defaultDate: new Date(),
            dateFormat: "J F Y"
        }
    );
    dateTimeInput.style.display = 'inline';

    dateTimeInput.dateType = 'date';
}
function selectDateTimeOpt() {
    dateTimeDTOpt.classList.add('optBtnSelected');
    dateDTOpt.classList.remove('optBtnSelected');
    infDTOpt.classList.remove('optBtnSelected');

    fp = flatpickr(
        "#dateTimeInput", 
        {
            defaultDate: new Date(),
            dateFormat: "H:i J F Y",
            enableTime: true,
            time_24hr: true
        }
    );
    dateTimeInput.style.display = 'inline';

    dateTimeInput.dateType = 'datetime';
}

// data validation and submission
function checkInputs() {
    let validInputs = true;

    // check name field is less than 50 characters long
    if (nameInput.value.length > 50) {
        popupError.textContent = 'Name too long';
        validInputs = false;
    } else if (!nameInput.value) { // make sure a name actually exists
        popupError.textContent = 'Please enter a name';
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

    // input data to form if exists (edit operation)
    if (data) {
        nameInput.value = data.name;

        switch (data.dateType) {
            case 'infinite':
                infDTOpt.click();
                break;
            case 'date':
                dateDTOpt.click();
                fp.setDate(data.dateTime);
                break;
            case 'datetime':
                dateTimeDTOpt.click();
                fp.setDate(data.dateTime);
                break;
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
            generateReminderData();

            refreshReminders();
            
            togglePopup(false);
            break;

        case 'Edit Reminder':
            // retrieve reminder id
            let id = parseInt(itemId.textContent);

            if (!checkInputs()) break;

            // delete reminder from dom
            delReminderDom(id);

            // submit form data
            generateReminderData(id);

            refreshReminders();

            togglePopup(false);
            break;
    }
}
function resetPopup(clearTitle = false) {
// review

    if (clearTitle) popupTitle.textContent = '';
    // clear inputs
    nameInput.value = '';
    infDTOpt.click();
    // clear errors
    popupError.textContent = '';
}