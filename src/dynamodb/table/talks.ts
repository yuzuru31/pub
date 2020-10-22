import Constant from '../../constant';
import dynamodb from '../';
import sequences from './sequences';

const pagingLatest = async (bid: number) => {
  const params = {
    TableName: Constant.dynamodb.table.talks,
    KeyConditionExpression: '#bid = :bid',
    ExpressionAttributeNames: {
      [`#${Constant.dynamodb.attribute.talks.bid}`]: Constant.dynamodb.attribute
        .talks.bid,
    },
    ExpressionAttributeValues: {
      [`:${Constant.dynamodb.attribute.talks.bid}`]: bid,
    },
    Limit: 10,
  };

  const data = await dynamodb.query(params).promise();
  return data;
};

const func = {
  create: async (params: { bid: number; uname: string; message: string }) => {
    const num = await sequences.getNum(
      `${Constant.dynamodb.attribute.talks.bid}${params.bid}`
    );

    await dynamodb
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: Constant.dynamodb.table.sequences,
              Key: {
                [Constant.dynamodb.attribute.sequences
                  .sname]: `bid${params.bid}`,
              },
              ExpressionAttributeNames: {
                [`#${Constant.dynamodb.attribute.sequences.num}`]: Constant
                  .dynamodb.attribute.sequences.num,
              },
              ExpressionAttributeValues: {
                ':numBefore': num,
                ':numAfter': num + 1,
              },
              UpdateExpression: 'SET #num=:numAfter',
              ConditionExpression: '#num=:numBefore',
            },
          },
          {
            Update: {
              TableName: Constant.dynamodb.table.boards,
              Key: {
                [Constant.dynamodb.attribute.boards.dummy]: '0',
                [Constant.dynamodb.attribute.boards.bid]: params.bid,
              },
              ExpressionAttributeNames: {
                [`#${Constant.dynamodb.attribute.boards.bidNum}`]: Constant
                  .dynamodb.attribute.boards.bidNum,
              },
              ExpressionAttributeValues: {
                ':numBefore': num,
                ':numAfter': num + 1,
              },
              UpdateExpression: 'SET #bidNum=:numAfter',
              ConditionExpression: '#bidNum=:numBefore',
            },
          },
          {
            Put: {
              TableName: Constant.dynamodb.table.talks,
              Item: {
                [Constant.dynamodb.attribute.talks.bid]: params.bid,
                [Constant.dynamodb.attribute.talks.num]: num + 1,
                [Constant.dynamodb.attribute.talks.uname]: params.uname,
                [Constant.dynamodb.attribute.talks.message]: params.message,
                [Constant.dynamodb.attribute.talks.date]: new Date().getTime(),
              },
            },
          },
        ],
      })
      .promise();
  },
  paging: async (num: number, bid: number) => {
    if (num === 0) {
      return { Items: [], Count: 0, ScannedCount: 0 };
    }

    if (num === 1) {
      return await pagingLatest(bid);
    }

    const data = await dynamodb
      .query({
        TableName: Constant.dynamodb.table.talks,
        KeyConditionExpression: '#bid = :bid AND #num > :val',
        ExpressionAttributeNames: {
          [`#${Constant.dynamodb.attribute.talks.bid}`]: Constant.dynamodb
            .attribute.talks.bid,
          [`#${Constant.dynamodb.attribute.talks.num}`]: Constant.dynamodb
            .attribute.talks.num,
        },
        ExpressionAttributeValues: {
          [`:${Constant.dynamodb.attribute.talks.bid}`]: bid,
          [':val']: (num - 1) * Constant.dynamodb.pagingNum,
        },
        Limit: 10,
      })
      .promise();
    return data;
  },
};

export default func;
