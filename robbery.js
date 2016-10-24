'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
var MILLISECOND_IN_MINUTE = 60000;
var MILLISECOND_IN_HOUR = MILLISECOND_IN_MINUTE * 60;
var FINISH_TIME;

var days = ['ПН', 'ВТ', 'СР'];
var daysInNum = {
    'ПН': 1,
    'ВТ': 2,
    'СР': 3,
    'ЧТ': 4,
    'ПТ': 5,
    'СБ': 6,
    'ВС': 7
};

function toTimestamp(str) {
    var region = getRegion(str);
    var hours = parseInt(str.slice(2, 5), 10);
    var minutes = parseInt(str.slice(6, 8), 10);
    var day = daysInNum[str.slice(0, 2)];

    return Date.UTC(2016, 7, day, hours, minutes) - region * MILLISECOND_IN_HOUR;
}

function makeList(schedule) {
    var timeList = [];
    Object.keys(schedule).forEach(function (man) {
        for (var i = 0; i < schedule[man].length; i++) {
            timeList.push({ from: toTimestamp(schedule[man][i].from),
                to: toTimestamp(schedule[man][i].to) });
        }
    });

    return timeList;
}

function checkEnoughTime(start, duration, time) {
    return (start + duration * MILLISECOND_IN_MINUTE) <= time;
}

function addBankHours(timeList, bankRegion, bankDays) {
    for (var i = 1; i <= bankDays.length; i++) {
        var start = Date.UTC(2016, 7, i, 0, 0) - bankRegion * MILLISECOND_IN_HOUR;
        var end = Date.UTC(2016, 7, i, 23, 59) - bankRegion * MILLISECOND_IN_HOUR;
        timeList.push({ from: start,
            to: bankDays[i - 1].from });
        timeList.push({ from: bankDays[i - 1].to,
            to: end });
    }

    return timeList;
}

function sortTimeList(timeList) {
    return timeList.sort(function (first, second) {
        if (first.from > second.from) {
            return 1;
        } else if (first.from === second.from) {
            return 0;
        }

        return -1;
    });
}


function makeBankDays(workingHours) {
    var bankDays = [];
    for (var i = 0; i < days.length; i++) {
        var from = toTimestamp(days[i] + ' ' + workingHours.from);
        var to = toTimestamp(days[i] + ' ' + workingHours.to);
        bankDays.push({ from: from,
            to: to });
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
        } else if (startTime < interval.to) {
            startTime = interval.to;
        }
    }

    return null;
}

function getRegion(timeInBank) {

    return parseInt(timeInBank.slice(timeInBank.indexOf(':') + 3), 10);
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
    timeList = addBankHours(timeList, bankRegion, bankDays);
    timeList = sortTimeList(timeList);
    var startTime = Date.UTC(2016, 7, 1, 0, 0) - bankRegion * MILLISECOND_IN_HOUR;
    FINISH_TIME = Date.UTC(2016, 7, 3, 23, 59) - bankRegion * MILLISECOND_IN_HOUR;
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
            var finalDate = parseInt(this.timeForDeal, 10) + (bankRegion) * MILLISECOND_IN_HOUR;
            var date = new Date(finalDate);
            var hours = date.getUTCHours().toString();
            var minutes = date.getUTCMinutes().toString();
            if (hours.length !== 2) {
                hours = '0' + hours;
            }
            if (minutes.length !== 2) {
                minutes = '0' + minutes;
            }
            if (this.timeForDeal !== null) {

                return template
                    .replace('%HH', hours)
                    .replace('%MM', minutes)
                    .replace('%DD', days[date.getUTCDate() - 1]);
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
            if (!this.exists()) {
                return false;
            }
            this.finish = Date.UTC(2016, 7, 3, 23, 59) - bankRegion * MILLISECOND_IN_HOUR;
            var start2 = chooseIntervals((this.timeForDeal + 30 * MILLISECOND_IN_MINUTE),
                this.duration, this.timeList);
            if (!start2) {
                return false;
            }
            this.timeForDeal = start2;

            return true;
        }
    };
};
