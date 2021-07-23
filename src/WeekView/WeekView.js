

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  ScrollView,
  Animated,
  VirtualizedList,
  FlatList,
  InteractionManager,
} from 'react-native';
import moment from 'moment';
import memoizeOne from 'memoize-one';

import Event from '../Event/Event';
import Events from '../Events/Events';
import Header from '../Header/Header';
import Title from '../Title/Title';
import Times from '../Times/Times';
import styles from './WeekView.styles';
import {
  CONTAINER_HEIGHT,
  DATE_STR_FORMAT,
  availableNumberOfDays,
  setLocale,
  CONTAINER_WIDTH,
} from '../utils';

const MINUTES_IN_DAY = 60 * 24;
export const HOURS_START = 480; // 8 AM

export default class WeekView extends Component {
  constructor(props) {
    super(props);
    this.eventsGrid = null;
    this.verticalAgenda = null;
    this.header = null;
    this.pageOffset = 2;
    this.currentPageIndex = this.pageOffset;
    this.eventsGridScrollX = new Animated.Value(0);

    const initialDates = [moment(props.selectedDate).format(DATE_STR_FORMAT)];

    this.state = {
      // currentMoment should always be the first date of the current page
      currentMoment: moment(initialDates[this.currentPageIndex]).toDate(),
      initialDates,
    };

    setLocale(props.locale);
  }

  componentDidMount() {
    requestAnimationFrame(() => {
      this.scrollToVerticalStart();
    });
    this.eventsGridScrollX.addListener((position) => {
      this.header.scrollToOffset({ offset: position.value, animated: false });
    });
  }

  componentDidUpdate(prevprops) {
    if (this.props.locale !== prevprops.locale) {
      setLocale(this.props.locale);
    }
  }

  componentWillUnmount() {
    this.eventsGridScrollX.removeAllListeners();
  }

  calculateTimes = memoizeOne((minutesStep) => {
    const times = [];
    let timeString = '';
    for (let timer = HOURS_START; timer < MINUTES_IN_DAY; timer += minutesStep) {
      let minutes = timer % 60;
      if (minutes < 10) minutes = `0${minutes}`;
      const hour = Math.floor(timer / 60);
      timeString = `${hour}:${minutes}`;
      if(hour < 10) {
        timeString = `0${hour}:${minutes}`;
      }

      times.push(timeString);
    }
    return times;
  });

  scrollToVerticalStart = () => {
    if (this.verticalAgenda) {
      const { startHour, hoursInDisplay } = this.props;
      const startHeight = (startHour * CONTAINER_HEIGHT) / hoursInDisplay;
      this.verticalAgenda.scrollTo({ y: startHeight, x: 0, animated: false });
    }
  };

  getSignToTheFuture = () => {
    const { prependMostRecent } = this.props;

    const daySignToTheFuture = prependMostRecent ? -1 : 1;
    return daySignToTheFuture;
  };

  prependPagesInPlace = (initialDates, nPages) => {
    const { numberOfDays } = this.props;
    const daySignToTheFuture = this.getSignToTheFuture();

    const first = initialDates[0];
    const daySignToThePast = daySignToTheFuture * -1;
    const addDays = numberOfDays * daySignToThePast;
    for (let i = 1; i <= nPages; i += 1) {
      const initialDate = moment(first).add(addDays * i, 'd');
      initialDates.unshift(initialDate.format(DATE_STR_FORMAT));
    }
  };

  appendPagesInPlace = (initialDates, nPages) => {
    const { numberOfDays } = this.props;
    const daySignToTheFuture = this.getSignToTheFuture();

    const latest = initialDates[initialDates.length - 1];
    const addDays = numberOfDays * daySignToTheFuture;
    for (let i = 1; i <= nPages; i += 1) {
      const initialDate = moment(latest).add(addDays * i, 'd');
      initialDates.push(initialDate.format(DATE_STR_FORMAT));
    }
  };

  goToDate = (targetDate, animated = true) => {
    const { initialDates } = this.state;
    const { numberOfDays } = this.props;

    const currentDate = moment(initialDates[this.currentPageIndex]).startOf('day');
    const deltaDay = moment(targetDate).startOf('day').diff(currentDate, 'day');
    const deltaIndex = Math.floor(deltaDay / numberOfDays);
    const signToTheFuture = this.getSignToTheFuture();
    let targetIndex = this.currentPageIndex + deltaIndex * signToTheFuture;

    this.goToPageIndex(targetIndex, animated);
  };

  goToNextPage = (animated = true) => {
    const signToTheFuture = this.getSignToTheFuture();
    this.goToPageIndex(this.currentPageIndex + 1 * signToTheFuture, animated);
  }

  goToPrevPage = (animated = true) => {
    const signToTheFuture = this.getSignToTheFuture();
    this.goToPageIndex(this.currentPageIndex - 1 * signToTheFuture, animated);
  }

  goToPageIndex = (targetIndex, animated = true) => {
    if (targetIndex === this.currentPageIndex) {
      return;
    }

    const { initialDates } = this.state;

    const scrollTo = (moveToIndex) => {
      this.eventsGrid.scrollToIndex({
        index: moveToIndex,
        animated,
      });
      this.currentPageIndex = moveToIndex;
    };

    const newState = {};
    let newStateCallback = () => {};

    const lastViewablePage = initialDates.length - this.pageOffset;
    if (targetIndex < this.pageOffset) {
      const nPages = this.pageOffset - targetIndex;
      this.prependPagesInPlace(initialDates, nPages);

      targetIndex = this.pageOffset;

      newState.initialDates = [...initialDates];
      newStateCallback = () => setTimeout(() => scrollTo(targetIndex), 0);
    } else if (targetIndex > lastViewablePage) {
      const nPages = targetIndex - lastViewablePage;
      this.appendPagesInPlace(initialDates, nPages);

      targetIndex = initialDates.length - this.pageOffset;

      newState.initialDates = [...initialDates];
      newStateCallback = () => setTimeout(() => scrollTo(targetIndex), 0);
    } else {
      scrollTo(targetIndex);
    }

    newState.currentMoment = moment(initialDates[targetIndex]).toDate();
    this.setState(newState, newStateCallback);
  };

  scrollEnded = (event) => {
    const {
      nativeEvent: { contentOffset, contentSize },
    } = event;
    const { x: position } = contentOffset;
    const { width: innerWidth } = contentSize;
    const { onSwipePrev, onSwipeNext } = this.props;
    const { initialDates } = this.state;

    const newPage = Math.round((position / innerWidth) * initialDates.length);
    const movedPages = newPage - this.currentPageIndex;
    this.currentPageIndex = newPage;

    if (movedPages === 0) {
      return;
    }

    InteractionManager.runAfterInteractions(() => {
      const newMoment = moment(initialDates[this.currentPageIndex]).toDate();
      const newState = {
        currentMoment: newMoment,
      };
      let newStateCallback = () => {};

      if (movedPages < 0 && newPage < this.pageOffset) {
        this.prependPagesInPlace(initialDates, 1);
        this.currentPageIndex += 1;

        newState.initialDates = [...initialDates];
        const scrollToCurrentIndex = () =>
            this.eventsGrid.scrollToIndex({
              index: this.currentPageIndex,
              animated: false,
            });
        newStateCallback = () => setTimeout(scrollToCurrentIndex, 0);
      } else if (
          movedPages > 0 &&
          newPage >= this.state.initialDates.length - this.pageOffset
      ) {
        this.appendPagesInPlace(initialDates, 1);

        newState.initialDates = [...initialDates];
      }

      this.setState(newState, newStateCallback);

      if (movedPages < 0) {
        onSwipePrev && onSwipePrev(newMoment);
      } else {
        onSwipeNext && onSwipeNext(newMoment);
      }
    });
  };

  eventsGridRef = (ref) => {
    this.eventsGrid = ref;
  };

  verticalAgendaRef = (ref) => {
    this.verticalAgenda = ref;
  };

  headerRef = (ref) => {
    this.header = ref;
  };

  calculatePagesDates = (currentMoment, numberOfDays, prependMostRecent) => {
    const initialDates = [];
    const centralDate = moment(currentMoment);
    if (numberOfDays === 7) {
      // Start week on monday
      centralDate.startOf('isoWeek');
    }
    for (let i = -this.pageOffset; i <= this.pageOffset; i += 1) {
      const initialDate = moment(centralDate).add(numberOfDays * i, 'd');
      initialDates.push(initialDate.format(DATE_STR_FORMAT));
    }
    return prependMostRecent ? initialDates.reverse() : initialDates;
  };

  sortEventsByDate = memoizeOne((events) => {
    // Stores the events hashed by their date
    // For example: { "2020-02-03": [event1, event2, ...] }
    // If an event spans through multiple days, adds the event multiple times
    const sortedEvents = {};
    events.forEach((event) => {
      const startDate = moment(event.startDate);
      const endDate = moment(event.endDate);

      for (
          let date = moment(startDate);
          date.isSameOrBefore(endDate, 'days');
          date.add(1, 'days')
      ) {
        // Calculate actual start and end dates
        const startOfDay = moment(date).startOf('day');
        const endOfDay = moment(date).endOf('day');
        const actualStartDate = moment.max(startDate, startOfDay);
        const actualEndDate = moment.min(endDate, endOfDay);

        // Add to object
        const dateStr = date.format(DATE_STR_FORMAT);
        if (!sortedEvents[dateStr]) {
          sortedEvents[dateStr] = [];
        }
        sortedEvents[dateStr].push({
          ...event,
          startDate: actualStartDate.toDate(),
          endDate: actualEndDate.toDate(),
        });
      }
    });
    // For each day, sort the events by the minute (in-place)
    Object.keys(sortedEvents).forEach((date) => {
      sortedEvents[date].sort((a, b) => {
        return moment(a.startDate).diff(b.startDate, 'minutes');
      });
    });
    return sortedEvents;
  });

  getListItemLayout = (index) => ({
    length: CONTAINER_WIDTH,
    offset: CONTAINER_WIDTH * index,
    index,
  });

  render() {
    const {
      showTitle,
      numberOfDays,
      headerStyle,
      headerTextStyle,
      hourTextStyle,
      eventContainerStyle,
      formatDateHeader,
      onEventPress,
      events,
      hoursInDisplay,
      techs,
      timeStep,
      onGridClick,
      EventComponent,
      prependMostRecent,
      rightToLeft,
      showNowLine,
      nowLineColor,
    } = this.props;
    const { currentMoment, initialDates } = this.state;
    const times = this.calculateTimes(timeStep);
    const eventsByDate = this.sortEventsByDate(events);
    const horizontalInverted =
        (prependMostRecent && !rightToLeft) ||
        (!prependMostRecent && rightToLeft);

    return (
        <View style={styles.container}>
          <View style={styles.headerContainer}>
          </View>
          <ScrollView ref={this.verticalAgendaRef} horizontal bounces={false} >
            <View style={{paddingLeft: 50}} >
              {/*  giờ  */}
              <Times
                  times={times}
                  textStyle={hourTextStyle}
                  hoursInDisplay={hoursInDisplay}
                  timeStep={timeStep}
              />
              <FlatList
                  data={initialDates}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => {
                    return (
                        <Events
                            times={times}
                            techs={techs}
                            eventsByDate={eventsByDate}
                            initialDate={item}
                            numberOfDays={numberOfDays}
                            onEventPress={onEventPress}
                            onGridClick={onGridClick}
                            hoursInDisplay={hoursInDisplay}
                            timeStep={timeStep}
                            EventComponent={EventComponent}
                            eventContainerStyle={eventContainerStyle}
                            rightToLeft={rightToLeft}
                            showNowLine={showNowLine}
                            nowLineColor={nowLineColor}
                        />
                    )
                  }}

              />

            </View>
          </ScrollView>
        </View>
    );
  }
}

WeekView.propTypes = {
  events: PropTypes.arrayOf(Event.propTypes.event),
  formatDateHeader: PropTypes.string,
  numberOfDays: PropTypes.oneOf(availableNumberOfDays).isRequired,
  onSwipeNext: PropTypes.func,
  onSwipePrev: PropTypes.func,
  onEventPress: PropTypes.func,
  onGridClick: PropTypes.func,
  headerStyle: PropTypes.object,
  headerTextStyle: PropTypes.object,
  hourTextStyle: PropTypes.object,
  eventContainerStyle: PropTypes.object,
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  locale: PropTypes.string,
  hoursInDisplay: PropTypes.number,
  techs: PropTypes.object,
  timeStep: PropTypes.number,
  startHour: PropTypes.number,
  EventComponent: PropTypes.elementType,
  showTitle: PropTypes.bool,
  rightToLeft: PropTypes.bool,
  prependMostRecent: PropTypes.bool,
  showNowLine: PropTypes.bool,
  nowLineColor: PropTypes.string,
};

WeekView.defaultProps = {
  events: [],
  locale: 'en',
  hoursInDisplay: 6,
  techs: [],
  timeStep: 60,
  startHour: 0,
  showTitle: true,
  rightToLeft: false,
  prependMostRecent: false,
};

