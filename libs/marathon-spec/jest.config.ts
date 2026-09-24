module.exports = {
  displayName: 'marathon-spec',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  testTimeout: 30000,
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/marathon-spec',
};
