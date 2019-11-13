require('mock-local-storage');

const FileGenerator = require('./FileGenerator');

describe('File Generator', () => {
  it('should throw if packaging unsupported language', () => {
    expect(() =>
      FileGenerator.createPackagingFiles(
        { outputDirectory: 'generated' },
        { programminglanguage: 'C#' },
        null
      )
    ).toThrow('Unsupported programming language', '[C#]');
  });

  it('should escape all characters in Javascript', () => {
    expect(
      FileGenerator.escapeStringForJavascript('There are ` lots ` of backticks in ` here!')
    ).toEqual('There are \\` lots \\` of backticks in \\` here!');
  });

  it('should escape all characters in Java', () => {
    expect(FileGenerator.escapeStringForJava('There are\nlots\nof\n new lines in \nhere!'))
      .toEqual(`There are\\n" +
"lots\\n" +
"of\\n" +
" new lines in \\n" +
"here!`);
  });
});
