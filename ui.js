!function updateTime() {
    const currentTime = new Date();

    let hours = currentTime.getHours();
    hours = (hours < 10 ? '0' : '') + hours;
    let minutes = currentTime.getMinutes();
    minutes = (minutes < 10 ? '0' : '') + minutes;
    let seconds = currentTime.getSeconds();

    timeDisp.textContent = `${hours}:${minutes}`;

    setTimeout(updateTime, (60 - seconds) * 1000);
}()

!function updateDate() {
    const currentTime = new Date();

    let day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentTime.getDay()];
    dayDisp.textContent = day;

    let dateDay = currentTime.getDate();
    dateDay = (dateDay < 10 ? '0' : '') + dateDay;
    let dateMonth = currentTime.getMonth() + 1;
    dateMonth = (dateMonth < 10 ? '0' : '') + dateMonth;
    let dateYear = currentTime.getFullYear();

    date.textContent = `${dateDay}/${dateMonth}/${dateYear}`;

    let msToNextDay = (((24 - currentTime.getHours()) * 60) - currentTime.getMinutes()) * 1000 * 60;
    console.log(msToNextDay);
    

    setTimeout(updateDate, msToNextDay);
}()
