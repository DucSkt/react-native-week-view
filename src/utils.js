import { Dimensions } from 'react-native';
import moment from 'moment';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export const CONTENT_OFFSET = 30;
export const CONTAINER_HEIGHT = SCREEN_HEIGHT - 60;
export const CONTAINER_WIDTH = SCREEN_WIDTH - 70;
export const DATE_STR_FORMAT = 'YYYY-MM-DD';
export const availableNumberOfDays = [1, 3, 5, 7];

export const minutesToYDimension = (hoursInDisplay, minutes, timeStep, WIDTH_CELL) => {
  // const minutesInDisplay = 60 * hoursInDisplay;
  return (minutes / timeStep) * WIDTH_CELL ;
};

export const getTimeLabelHeight = (hoursInDisplay, minutesStep) => {
  const timeLabelsInDisplay = Math.ceil(hoursInDisplay * 60 / minutesStep);
  return CONTAINER_HEIGHT / timeLabelsInDisplay;
}

export const getFormattedDate = (date, format) => {
  return moment(date).format(format);
};

export const setLocale = (locale) => {
  if (locale) {
    moment.locale(locale);
  }
};

export const addLocale = (locale, obj) => {
  moment.locale(locale, obj);
};

export const getCurrentMonth = (date) => {
  return moment(date).format('MMMM Y');
};

export const calculateDaysArray = (date, numberOfDays, rightToLeft) => {
  const dates = [];
  for (let i = 0; i < numberOfDays; i += 1) {
    const currentDate = moment(date).add(i, 'd');
    dates.push(currentDate);
  }
  return rightToLeft ? dates.reverse() : dates;
};
