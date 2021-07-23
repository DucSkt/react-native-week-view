import { StyleSheet } from 'react-native';
import { CONTAINER_WIDTH, CONTENT_OFFSET } from '../utils';

const GREY_COLOR = '#E9EDF0';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timeRow: {
    flex: 0,
    zIndex: 999
  },
  timeLabelLine: {
    height: 1,
    backgroundColor: GREY_COLOR,
    position: 'absolute',
    right: 0,
    left: 0,
  },
  timeLabelLineColumn: {
    width: 1,
    backgroundColor: GREY_COLOR,
    position: 'absolute',
    right: 0,
    left: 0,
  },
  event: {
    flex: 1,
  },
  events: {
    position: 'absolute',
    flexDirection: 'row',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'transparent',
  },
});

export default styles;
