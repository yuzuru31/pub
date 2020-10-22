import Constant from '../../constant';
import dynamodb from '../';
import sequences from './sequences';

const pagingBoardsInfoLatest = async () => {
  const params = {
    TableName: Constant.dynamodb.table.boards,
    KeyConditionExpression: '#dummy = :dummy',
    ExpressionAttributeNames: {
      [`#${Constant.dynamodb.attribute.boards.dummy}`]: Constant.dynamodb
        .attribute.boards.dummy,

      // 予約語なのでプレースホルダーに置き換え
      ['#d']: Constant.dynamodb.attribute.boards.date,
    },
    ExpressionAttributeValues: {
      [`:${Constant.dynamodb.attribute.boards.dummy}`]: '0',
    },
    ProjectionExpression: `${Constant.dynamodb.attribute.boards.bid},${Constant.dynamodb.attribute.boards.bidNum}, ${Constant.dynamodb.attribute.boards.gid}, ${Constant.dynamodb.attribute.boards.bname}, #d`,
    ScanIndexForward: false,
    Limit: 10,
  };

  const data = await dynamodb.query(params).promise();
  return data;
};

const pagingBoardsGenreLatest = async (gid: number) => {
  const params = {
    TableName: Constant.dynamodb.table.boards,
    IndexName: Constant.dynamodb.index.boards.gsi1,
    KeyConditionExpression: '#gid = :gid',
    ExpressionAttributeNames: {
      [`#${Constant.dynamodb.attribute.boards.gid}`]: Constant.dynamodb
        .attribute.boards.gid,
      // 予約語なのでプレースホルダーに置き換え
      ['#d']: Constant.dynamodb.attribute.boards.date,
    },
    ExpressionAttributeValues: {
      [`:${Constant.dynamodb.attribute.boards.gid}`]: gid,
    },
    ProjectionExpression: `${Constant.dynamodb.attribute.boards.bid},${Constant.dynamodb.attribute.boards.bidNum}, ${Constant.dynamodb.attribute.boards.gid}, ${Constant.dynamodb.attribute.boards.bname}, #d`,
    ScanIndexForward: false,
    Limit: 10,
  };

  const data = await dynamodb.query(params).promise();
  return data;
};

const func = {
  pagingGenre: async (num: number, gid: number) => {
    if (num === 0) {
      return { Items: [], Count: 0, ScannedCount: 0 };
    }

    if (num === 1) {
      return await pagingBoardsGenreLatest(gid);
    }

    const sequenceNum = await sequences.getNum(
      `${Constant.dynamodb.attribute.boards.gid}${gid}`
    );

    if (sequenceNum <= Constant.dynamodb.pagingNum * (num - 1)) {
      return { Items: [], Count: 0, ScannedCount: 0 };
    }

    const data = await dynamodb
      .query({
        TableName: Constant.dynamodb.table.boards,
        IndexName: Constant.dynamodb.index.boards.gsi1,
        KeyConditionExpression: '#gid = :gid AND #gidNum <= :maxVal',
        ExpressionAttributeNames: {
          [`#${Constant.dynamodb.attribute.boards.gid}`]: Constant.dynamodb
            .attribute.boards.gid,
          [`#${Constant.dynamodb.attribute.boards.gidNum}`]: Constant.dynamodb
            .attribute.boards.gidNum,

          // 予約語なのでプレースホルダーに置き換え
          ['#d']: 'date',
        },
        ExpressionAttributeValues: {
          [`:${Constant.dynamodb.attribute.boards.gid}`]: gid,
          [':maxVal']: sequenceNum - (num - 1) * Constant.dynamodb.pagingNum,
        },
        ProjectionExpression: `${Constant.dynamodb.attribute.boards.bid},${Constant.dynamodb.attribute.boards.bidNum}, ${Constant.dynamodb.attribute.boards.gid}, ${Constant.dynamodb.attribute.boards.bname}, #d`,
        ScanIndexForward: false,
        Limit: 10,
      })
      .promise();
    return data;
  },

  pagingInfo: async (num: number) => {
    if (num === 0) {
      return { Items: [], Count: 0, ScannedCount: 0 };
    }

    if (num === 1) {
      return await pagingBoardsInfoLatest();
    }

    const sequenceNum = await sequences.getNum(
      Constant.dynamodb.attribute.boards.bid
    );

    if (sequenceNum <= Constant.dynamodb.pagingNum * (num - 1)) {
      return { Items: [], Count: 0, ScannedCount: 0 };
    }

    const data = await dynamodb
      .query({
        TableName: Constant.dynamodb.table.boards,
        KeyConditionExpression: '#dummy = :dummy AND #bid <= :maxVal',
        ExpressionAttributeNames: {
          [`#${Constant.dynamodb.attribute.boards.dummy}`]: Constant.dynamodb
            .attribute.boards.dummy,
          [`#${Constant.dynamodb.attribute.boards.bid}`]: Constant.dynamodb
            .attribute.boards.bid,

          // 予約語なのでプレースホルダーに置き換え
          ['#d']: 'date',
        },
        ExpressionAttributeValues: {
          [`:${Constant.dynamodb.attribute.boards.dummy}`]: '0',
          [':maxVal']: sequenceNum - (num - 1) * Constant.dynamodb.pagingNum,
        },
        ProjectionExpression: `${Constant.dynamodb.attribute.boards.bid},${Constant.dynamodb.attribute.boards.bidNum}, ${Constant.dynamodb.attribute.boards.gid}, ${Constant.dynamodb.attribute.boards.bname}, #d`,
        ScanIndexForward: false,
        Limit: 10,
      })
      .promise();
    return data;
  },

  create: async (params: { gid: number; bname: string }) => {
    const bidNum = await sequences.getNum(
      Constant.dynamodb.attribute.boards.bid
    );

    const gidNum = await sequences.getNum(
      `${Constant.dynamodb.attribute.boards.gid}${params.gid}`
    );

    await dynamodb
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: Constant.dynamodb.table.sequences,
              Key: {
                [Constant.dynamodb.attribute.sequences.sname]: 'bid',
              },
              ExpressionAttributeNames: {
                [`#${Constant.dynamodb.attribute.sequences.num}`]: Constant
                  .dynamodb.attribute.sequences.num,
              },
              ExpressionAttributeValues: {
                ':numBefore': bidNum,
                ':numAfter': bidNum + 1,
              },
              UpdateExpression: 'SET #num=:numAfter',
              ConditionExpression: '#num=:numBefore',
            },
          },
          {
            Update: {
              TableName: Constant.dynamodb.table.sequences,
              Key: {
                [Constant.dynamodb.attribute.sequences
                  .sname]: `${Constant.dynamodb.attribute.boards.gid}${params.gid}`,
              },
              ExpressionAttributeNames: {
                [`#${Constant.dynamodb.attribute.sequences.num}`]: Constant
                  .dynamodb.attribute.sequences.num,
              },
              ExpressionAttributeValues: {
                ':numBefore': gidNum,
                ':numAfter': gidNum + 1,
              },
              UpdateExpression: 'SET #num=:numAfter',
              ConditionExpression: '#num=:numBefore',
            },
          },
          {
            Put: {
              TableName: Constant.dynamodb.table.sequences,
              Item: {
                [Constant.dynamodb.attribute.sequences.sname]: `bid${
                  bidNum + 1
                }`,
                [Constant.dynamodb.attribute.sequences.num]: 0,
              },
            },
          },
          {
            Put: {
              TableName: Constant.dynamodb.table.boards,
              Item: {
                [Constant.dynamodb.attribute.boards.dummy]: '0',
                [Constant.dynamodb.attribute.boards.bid]: bidNum + 1,
                [Constant.dynamodb.attribute.boards.bidNum]: 0,
                [Constant.dynamodb.attribute.boards.gid]: params.gid,
                [Constant.dynamodb.attribute.boards.gidNum]: gidNum + 1,
                [Constant.dynamodb.attribute.boards.bname]: params.bname,
                [Constant.dynamodb.attribute.boards.date]: new Date().getTime(),
              },
            },
          },
        ],
      })
      .promise();

    return bidNum + 1;
  },
};

export default func;
