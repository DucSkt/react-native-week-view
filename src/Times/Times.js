import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import styles from './Times.styles';
import { getTimeLabelHeight } from '../utils';

const Times = ({ times, hoursInDisplay, timeStep, textStyle }) => {
  const height = getTimeLabelHeight(8, timeStep);
  return (
    <View style={styles.columnContainer}>
      {times.map((time, index) => (
        <View key={time} style={[styles.label, { height }]}>
          <Text style={[styles.text, textStyle, {marginLeft: -20}]}>{time}</Text>
        </View>
      ))}
    </View>
  );
};

Times.propTypes = {
  times: PropTypes.arrayOf(PropTypes.string).isRequired,
  hoursInDisplay: PropTypes.number.isRequired,
  timeStep: PropTypes.number.isRequired,
  textStyle: Text.propTypes.style,
};

export default React.memo(Times);
