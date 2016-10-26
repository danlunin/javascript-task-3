'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
var MILLISECOND_IN_MINUTE = 60000;
var MILLISECOND_IN_HOUR = MILLISECOND_IN_MINUTE * 60;
var ROBBERY_YEAR = 2016;
var ROBBERY_MONTH = 7;
var FINISH_TIME;
var START_TIME;
var HALF_AN_HOUR = 30;
//  Август - ближайший к текущей дате месяц, в который первое число - понедельник

var weekDays = ['ПН', 'ВТ', 'СР'];
var daysInNum = {
    'ПН': 1,
    'ВТ': 2,
    'СР': 3,
    'ЧТ': 4,
    'ПТ': 5,
    'СБ': 6,
    'ВС': 7
};

function convertToTimestamp(str) {
    var region = getRegion(str);
    var hours = parseInt(str.slice(3, 5), 10);
    var minutes = parseInt(str.slice(6, 8), 10);
    var day = daysInNum[str.slice(0, 2)];

    return Date.UTC(ROBBERY_YEAR, ROBBERY_MONTH, day, hours, minutes) -
        region * MILLISECOND_IN_HOUR;
}

function makeList(schedule) {
    var timeList = [];
    Object.keys(schedule).forEach(function (man) {
        schedule[man].forEach(function (segment) {
            timeList.push({
                from: convertToTimestamp(segment.from),
                to: convertToTimestamp(segment.to)
            });
        });
    });

    return timeList;
}

function checkEnoughTime(startTime, duration, endTime) {
    return (startTime + duration * MILLISECOND_IN_MINUTE) <= endTime;
}

function addBankClosedHours(timeList, bankRegion, bankDays) {
    for (var i = 1; i <= bankDays.length; i++) {
        var start = Date.UTC(ROBBERY_YEAR, ROBBERY_MONTH, i, 0, 0) -
            bankRegion * MILLISECOND_IN_HOUR;
        var end = Date.UTC(ROBBERY_YEAR, ROBBERY_MONTH, i, 23, 59) -
            bankRegion * MILLISECOND_IN_HOUR;
        timeList.push({
            from: start,
            to: bankDays[i - 1].from
        });
        timeList.push({
            from: bankDays[i - 1].to,
            to: end
        });
    }

    return timeList;
}

function sortTime(firstTime, secondTime) {
    return firstTime.from > secondTime.from ? 1 : -1;
}

function makeBankDays(workingHours) {
    var bankDays = [];
    for (var i = 0; i < weekDays.length; i++) {
        var from = convertToTimestamp(weekDays[i] + ' ' + workingHours.from);
        var to = convertToTimestamp(weekDays[i] + ' ' + workingHours.to);
        bankDays.push({
            from: from,
            to: to
        });
    }

    return bankDays;
}

function chooseIntervals(startTime, duration, timeList) {
    for (var i = 0; i < timeList.length; i++) {
        if (startTime >= FINISH_TIME) {
            return null;
        }

        var interval = timeList[i];
        if (checkEnoughTime(startTime, duration, interval.from)) {
            return startTime;
        }
        if (startTime < interval.to) {
            startTime = interval.to;
        }
    }

    return null;
}

function getRegion(timeInBank) {
    return parseInt(timeInBank.slice(timeInBank.indexOf('+')), 10);
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
    var timeList = makeList(schedule);
    var bankRegion = getRegion(workingHours.from);
    var bankDays = makeBankDays(workingHours);
    timeList = addBankClosedHours(timeList, bankRegion, bankDays);
    timeList.sort(sortTime);
    START_TIME = Date.UTC(ROBBERY_YEAR, ROBBERY_MONTH, 1, 0, 0) -
        bankRegion * MILLISECOND_IN_HOUR;
    var startTime = START_TIME;
    FINISH_TIME = Date.UTC(ROBBERY_YEAR, ROBBERY_MONTH, 3, 23, 59) -
        bankRegion * MILLISECOND_IN_HOUR;
    // должен быть часовой пояс банка
    var start = chooseIntervals(startTime, duration, timeList);

    return {

        timeForDeal: start,
        timeList: timeList,
        duration: duration,
        finish: FINISH_TIME,


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
            if (this.timeForDeal === null) {
                return '';
            }
            var dateOfRobbery = new Date(parseInt(this.timeForDeal, 10) +
                (bankRegion) * MILLISECOND_IN_HOUR);
            var hours = dateOfRobbery.getUTCHours().toString();
            var minutes = dateOfRobbery.getUTCMinutes().toString();
            if (hours.length !== 2) {
                hours = '0' + hours;
            }
            if (minutes.length !== 2) {
                minutes = '0' + minutes;
            }

            return template
                .replace('%HH', hours)
                .replace('%MM', minutes)
                .replace('%DD', weekDays[dateOfRobbery.getUTCDate() - 1]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }
            var start2 = chooseIntervals((this.timeForDeal + HALF_AN_HOUR * MILLISECOND_IN_MINUTE),
                this.duration, this.timeList);
            if (!start2) {
                return false;
            }
            this.timeForDeal = start2;

            return true;
        }
    };
};
