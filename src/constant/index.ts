export default class {
  static readonly bearer = 'Bearer abc';

  static readonly origin = {
    development: `http://localhost:8080`,
    production: [`https://serverless.itsumen.com`],
  };

  static dynamodb = {
    pagingNum: 10,

    genreNum: 17,

    validation: {
      boards: {
        bname: 100,
      },

      talks: {
        uname: 15,
        message: 150,
      },
    },

    index: {
      boards: {
        gsi1: 'gsi1',
      },
    },

    table: {
      sequences: 'sequences',
      boards: 'boards',
      talks: 'talks',
    },
    attribute: {
      sequences: {
        sname: 'sname',
        num: 'num',
      },
      boards: {
        dummy: 'dummy',
        bid: 'bid',
        bidNum: 'bidNum',
        gid: 'gid',
        gidNum: 'gidNum',
        bname: 'bname',
        date: 'date',
      },
      talks: {
        bid: 'bid',
        num: 'num',
        uname: 'uname',
        message: 'message',
        date: 'date',
      },
    },
  };

  constructor() {
    throw new Error('new禁止');
  }
}
