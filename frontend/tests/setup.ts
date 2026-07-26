import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children);
});

jest.mock('@tensorflow/tfjs-react-native', () => ({
  bundleResourceIO: jest.fn(),
  decodeJpeg: jest.fn(),
}));

jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn(),
  loadLayersModel: jest.fn(),
}));
