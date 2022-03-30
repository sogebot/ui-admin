import { DAY, HOUR, MINUTE, SECOND } from '@sogebot/ui-helpers/constants';
import Vue from 'vue';

Vue.filter('time', function (value: number) {
  const days = Math.floor(value / DAY);
  const hours = Math.floor((value - days * DAY) / HOUR);
  const minutes = Math.floor((value - (days * DAY) - (hours * HOUR)) / MINUTE);
  const seconds = Math.floor((value - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
})