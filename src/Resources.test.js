require('mock-local-storage');

const axios = require('axios');

jest.mock('axios');

const Resources = require('./Resources');

// 'Mon, 01 Jan 4000 00:00:59 GMT', in POSIX time
const MOCKED_LAST_MODIFIED = 64060588859000;
const VALID_LAST_MODIF_HTTP_RESOURCE = {
  headers: {
    // This date should alway be more recent than the considered artifacts (unless you are running this test
    // 2000 years in the future and are trying to figure out what stopped working)
    'last-modified': 'Mon, 01 Jan 4000 00:00:59 GMT',
  },
};

const INVALID_LAST_MODIF_HTTP_RESOURCE = {
  headers: {
    'last-modified': 'This is not a date',
  },
};

describe('Resources', () => {
  it('should get the resource last modification for online resources', async () => {
    axios.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(VALID_LAST_MODIF_HTTP_RESOURCE))
    );

    const lastmodif = await Resources.getResourceLastModificationTime('http://whatever.org');
    expect(lastmodif).toEqual(MOCKED_LAST_MODIFIED);
  });

  it('should throw when the resource last modification for online resources is invalid', async () => {
    axios.mockImplementation(
      jest.fn().mockReturnValue(Promise.resolve(INVALID_LAST_MODIF_HTTP_RESOURCE))
    );
    expect(Resources.getResourceLastModificationTime('http://whatever.org')).rejects.toThrow(
      'Cannot get last modification time'
    );
  });
});
