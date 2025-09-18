import dayjs from 'dayjs';

export class DayUtils {

    /**
     * Создает массив дат с интервалом в один день между двумя датами
     * @param startDate - начальная дата (dayjs объект)
     * @param endDate - конечная дата (dayjs объект)
     * @returns массив dayjs объектов
     */
    static createDateRange(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): dayjs.Dayjs[] {
        const dates: dayjs.Dayjs[] = [];
        let currentDate = startDate.startOf('day');
        const end = endDate.endOf('day');

        while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
            dates.push(currentDate);
            currentDate = currentDate.add(1, 'day');
        }

        return dates;
    }
}
