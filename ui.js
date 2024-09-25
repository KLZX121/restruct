// todo:
// * dynamic reminder dates/times
// * edit/delete reminders
// * global data loading

let globalData = {
    reminders: [],
    remindersN: 0
}

// ===============
// LIVE TIME
// ===============

!function updateTime() {
    let time = formatTime(new Date());

    timeDisp.textContent = `${time.hours}:${time.minutes}`;

    setTimeout(updateTime, (60 - time.seconds) * 1000);
}();
!function updateDate() {
    const currentTime = new Date();

    let day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentTime.getDay()];
    dayDisp.textContent = day;

    let dateFormat = formatDate(currentTime);
    date.textContent = `${dateFormat.day}/${dateFormat.month}/${dateFormat.year}`;

    let msToNextDay = (((24 - currentTime.getHours()) * 60) - currentTime.getMinutes()) * 1000 * 60;
    setTimeout(updateDate, msToNextDay);
}();
function formatTime(date) {
    let hours = date.getHours();
    hours = (hours < 10 ? '0' : '') + hours;
    let minutes = date.getMinutes();
    minutes = (minutes < 10 ? '0' : '') + minutes;
    let seconds = date.getSeconds();

    // String hours, String minutes, Number seconds
    return {hours, minutes, seconds};
}
function formatDate(date) {
    let day = date.getDate();
    day = (day < 10 ? '0' : '') + day;
    let month = date.getMonth() + 1;
    month = (month < 10 ? '0' : '') + month;
    let year = date.getFullYear();

    // String day, String month, Number year
    return {day, month, year};
}

// ===============
// REMINDERS
// ===============

newReminderBtn.addEventListener('click', () => togglePopup(true, 0));

function addNewReminder(reminderData) {
    let dateStr = '&#8734;'
    if (reminderData.date) {
        let dateDiff = Math.floor((reminderData.date - new Date()) / 86400000);

        if (dateDiff == 0) {
            dateStr = 'Today ' + (reminderData.time || '');
            
        } else if (dateDiff == 1) {
            dateStr = 'Tomorrow ' + (reminderData.time || '');

        } else {
            let date = formatDate(reminderData.date);
            dateStr = `${date.day}/${date.month}/${date.year}`;
        }
    } else if (reminderData.time) {
        dateStr = 'Today ' + reminderData.time;
    }
    let reminderTimeHTML = `<span class="reminderTime">${dateStr}</span>`;

    let reminderTitleHTML = `<span class="reminderTitle">${reminderData.name}</span>`;
    
    let reminderHTML = `
        <div class="reminderCon" id="reminder${reminderData.id}">
            ${reminderTimeHTML}
            ${reminderTitleHTML}
            <span class="menuIcon"><div></div><div></div><div></div></span>
        </div>
    `;

    reminderInputCon.innerHTML += reminderHTML;
}

// ===============
// SETTINGS POPUP
// ===============

popupSec.addEventListener('click', event => {
    if (event.target == popupSec) togglePopup(false);
});
submitPopupBtn.addEventListener('click', () => submitPopup());
clearPopupBtn.addEventListener('click', () => resetPopup());

enableDateInput.addEventListener('change', () => {
    if (enableDateInput.checked) {
        dateInput.removeAttribute('disabled');
    } else {
        dateInput.setAttribute('disabled', '');
    }
});
enableTimeInput.addEventListener('change', () => {
    if (enableTimeInput.checked) {
        timeInput.removeAttribute('disabled');
    } else {
        timeInput.setAttribute('disabled', '');
    }
});

// data validation and submission
function submitPopup() {
    popupError.textContent = '';
    switch(popupTitle.textContent) {
        case 'New Reminder':
            if (nameInput.value.length > 50) {
                popupError.textContent = 'Name too long';
                break;
            }
            if (!nameInput.value) {
                popupError.textContent = 'Please enter a name';
                break;
            }
            if (enableDateInput.checked && !dateInput.value) {
                popupError.textContent = 'Please enter a date';
                break;
            }
            if (enableTimeInput.checked && !timeInput.value) {
                popupError.textContent = 'Please enter a time';
                break;
            }

            let reminderData = {
                id: globalData.remindersN,
                name: nameInput.value,
                date: enableDateInput.checked? new Date(dateInput.value) : null,
                time: timeInput.value || null
            }
            console.log(reminderData);
            
            globalData.remindersN++;
            globalData.reminders.push(reminderData);
            
            addNewReminder(reminderData);

            togglePopup(false, null);
            resetPopup(true);
            
            break;
    }
}
function togglePopup(show, settingType) {
    popupSec.style.display = show ? 'flex' : 'none';

    if (show) {
        // settingType variable is an index of this array
        const settingsTypes = ['New Reminder'];
    
        popupTitle.textContent = settingsTypes[settingType];

        nameInput.focus();
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