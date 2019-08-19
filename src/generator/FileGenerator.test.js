require('mock-local-storage');

const FileGenerator = require('./FileGenerator');

describe('File Generator', () => {
  it('should throw if packaging unsupported language', () => {
    expect(() =>
      FileGenerator.createPackagingFiles({ outputDirectory: 'generated' }, 'C#')
    ).toThrow('Unsupported programming language', '[C#]');
  });
});
