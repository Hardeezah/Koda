module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    './tests/setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(expo|@expo|react-native|@react-native|react-navigation|@react-navigation|@tensorflow/tfjs-react-native|@tensorflow/tfjs))',
  ],
};
