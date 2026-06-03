import '@testing-library/jest-native/extend-expect';

// Stable AsyncStorage mock so AuthContext init doesn't blow up under jsdom.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
