import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';

export const timeToDate = (value: number) => {
  return new Date(value).toISOString().substr(0, 10);
};
export const timeToTime = (value: number) => {
  return dayjs(value).format('HH:mm:ss');
};

export function setAttr (currentValue: number | string, type: 'time' | 'date', value: any) {
  if (typeof currentValue === 'string') {
    currentValue = new Date(currentValue).getTime();
  }

  if (type === 'date') {
    currentValue = Date.parse(`${value} ${timeToTime(currentValue ?? 0)}`);
    const time = timeToTime(currentValue ?? Date.now());
    if (time.startsWith('00:')) {
      // we need to +1 day as day is setting back
      const dateToUpdate = new Date(Date.parse(value));
      dateToUpdate.setDate(dateToUpdate.getDate() + 1);
      value = timeToDate(dateToUpdate.getTime());
    }
    console.log(`${value} ${time}`);
    return Date.parse(`${value} ${time}`);
  } else if (type === 'time') {
    currentValue = currentValue === 0 ? Date.now() : currentValue;
    let date = timeToDate(currentValue);
    if (value.startsWith('00:')) {
      // we need to +1 day as day is setting back
      const dateToUpdate = new Date(Date.parse(date));
      dateToUpdate.setDate(dateToUpdate.getDate() + 1);
      date = timeToDate(dateToUpdate.getTime());
    }
    return Date.parse(`${date} ${value}`);
  }
}
