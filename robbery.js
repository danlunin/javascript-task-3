'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
var MILLISECINMIN = 60000;
var FINISHTIME;

var daysInEng = {
    'ПН': 'Mon',
    'ВТ': 'Tue',
    'СР': 'Wed'
};
var daysInNum = {
    'ПН': 1,
    'ВТ': 2,
    'СР': 3
};

var daysFromNum = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР'
};
function toTimestamp(str) {
    var newStr = daysInEng[str.slice(0, 2)] + ' Aug 0' + daysInNum[str.slice(0, 2)] +
        str.slice(2, 8) + ':00 +0' + str.slice(-1) + '00 2016';
    var date = new Date(newStr);

    return date.valueOf();
}

function makeListForAll(schedule) {
    var timeList = [];
    Object.keys(schedule).forEach(function (man) {
        for (var i = 0; i < schedule[man].length; i++) {
            timeList.push({ 'from': toTimestamp(schedule[man][i].from),
                'to': toTimestamp(schedule[man][i].to) });
        }
    });

    return timeList;
}

function checkEnoughTime(start, duration, time) {
    return (start + duration * MILLISECINMIN) <= time;
}

function addBankHours(timeList, bankRegion, bankDays) {
    for (var i = 1; i <= bankDays.length; i++) {
        var start;
        var end;
        if (bankRegion > 9) {
            start = new Date(daysInEng[daysFromNum[i]] + ' Aug 0' + i +
                ' 00:00:00 +' + bankRegion + '00 2016').valueOf();

            // часовой пояс > 9
            end = new Date(daysInEng[daysFromNum[i]] + ' Aug 0' + i +
                ' 23:59:59 +' + bankRegion + '00 2016').valueOf();
        } else {
            start = new Date(daysInEng[daysFromNum[i]] + ' Aug 0' + i +
                ' 00:00:00 +0' + bankRegion + '00 2016').valueOf();
            end = new Date(daysInEng[daysFromNum[i]] + ' Aug 0' + i +
                ' 23:59:59 +0' + bankRegion + '00 2016').valueOf();
        }
        timeList.push({ 'from': start, 'to': bankDays[i - 1].from });
        timeList.push({ 'from': bankDays[i - 1].to, 'to': end });
    }

    return timeList;
}

function sortTimeList(timeList) {
    timeList.sort(function (fst, scnd) {
        if (fst.from > scnd.from) {

            return 1;
        } else if (fst.from === scnd.from) {

            return 0;
        }

        return -1;
    });

    return timeList;
}


function makeBankDays(workingHours) {
    var bankDays = [];
    var days = Object.keys(daysInEng);
    for (var i = 0; i < days.length; i++) {
        bankDays.push({ 'from': toTimestamp(days[i] + ' ' + workingHours.from),
            'to': toTimestamp(days[i] + ' ' + workingHours.to) });
    }

    return bankDays;
}

function chooseIntervals(startTime, duration, timeList) {
    for (var i = 0; i < timeList.length; i++) {
        var interval = timeList[i];
        if (checkEnoughTime(startTime, duration, interval.from)) {
            return startTime;
        } else if (startTime < interval.to) {
            startTime = interval.to;

        }
        if (startTime >= FINISHTIME) {
            return null;
        }
    }

    return null;
}

function getRegion(timeInBank) {

    return parseInt(timeInBank.slice(timeInBank.indexOf(':') + 3));
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var timeList = makeListForAll(schedule);
    var bankRegion = getRegion(workingHours.from);
    var bankDays = makeBankDays(workingHours);
    timeList = addBankHours(timeList, bankRegion, bankDays);
    timeList = sortTimeList(timeList);

    var startTime;
    if (bankRegion < 9) {
        startTime = new Date('Mon Aug 01 2016 00:00:00 GMT+0' + bankRegion.toString() +
            '00').valueOf();
        FINISHTIME = new Date('Wed Aug 03 2016 23:59:59 GMT+0' + bankRegion.toString() +
            '00').valueOf();
    } else {
        startTime = new Date('Mon Aug 01 2016 00:00:00 GMT+' + bankRegion.toString() +
            '00').valueOf();
        FINISHTIME = new Date('Wed Aug 03 2016 23:59:59 GMT+' + bankRegion.toString() +
            '00').valueOf();
    }
    // должен быть часовой пояс банка

    var start = chooseIntervals(startTime, duration, timeList);

    return {

        timeForDeal: start,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            return start !== null;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            var date = new Date(this.timeForDeal);
            var finalDate = parseInt(this.timeForDeal) +
                (bankRegion + date.getTimezoneOffset() / 60) * MILLISECINMIN;
            date = new Date(finalDate);
            var hours = date.getHours().toString();
            var minutes = date.getMinutes().toString();
            if (hours.length !== 2) {
                hours = '0' + hours;
            }
            if (minutes.length !== 2) {
                minutes = '0' + minutes;
            }
            if (this.timeForDeal !== null) {

                return template.replace('%HH', hours)
                    .replace('%MM', minutes)
                    .replace('%DD', daysFromNum[date.getDate()]);
            }

            return '';
        },
        // время может быть до 00, а псоле прибавления после еще и дата

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            start = chooseIntervals((this.timeForDeal + 30 * MILLISECINMIN),
                duration, timeList);
            if (start === null) {
                return false;
            }
            this.timeForDeal = start;

            return true;
        }
    };
};
