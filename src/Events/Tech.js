import React, { PureComponent } from 'react';
import {View, FlatList, Text} from 'react-native';
import {Log} from "../../../../src/shared/processing";

class Tech extends PureComponent {
  render() {
    const {
      techs,
    } = this.props;
    Log('333333', techs)
    return (
      <View style={styles.container}>
        <Text>AAAA</Text>
      </View>
    );
  }
}

export default Tech;
