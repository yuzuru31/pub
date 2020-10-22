import * as AWS from 'aws-sdk';
require('dotenv').config();

import Constant from '../constant';

AWS.config.update({
  ...{
    region: 'ap-northeast-1',
  },
  ...(process.env.NODE_ENV !== 'production'
    ? { endpoint: process.env.AWS_ENDPOINT,
        credentials: new AWS.Credentials('dummy', 'dummy'),
      }
    : {}),
} as any);

const client = new AWS.DynamoDB.DocumentClient();
export default client;

const dynamodb = new AWS.DynamoDB();

const createTable = {
  sequences: async () => {
    await dynamodb
      .createTable({
        TableName: Constant.dynamodb.table.sequences,
        AttributeDefinitions: [
          {
            AttributeName: Constant.dynamodb.attribute.sequences.sname,
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: Constant.dynamodb.attribute.sequences.sname,
            KeyType: 'HASH',
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 6,
          WriteCapacityUnits: 6,
        },
      })
      .promise();
  },
  boards: async () => {
    await dynamodb
      .createTable({
        TableName: Constant.dynamodb.table.boards,
        AttributeDefinitions: [
          {
            AttributeName: Constant.dynamodb.attribute.boards.dummy,
            AttributeType: 'S',
          },
          {
            AttributeName: Constant.dynamodb.attribute.boards.bid,
            AttributeType: 'N',
          },
          {
            AttributeName: Constant.dynamodb.attribute.boards.gid,
            AttributeType: 'N',
          },
          {
            AttributeName: Constant.dynamodb.attribute.boards.gidNum,
            AttributeType: 'N',
          },
        ],
        KeySchema: [
          {
            AttributeName: Constant.dynamodb.attribute.boards.dummy,
            KeyType: 'HASH',
          },
          {
            AttributeName: Constant.dynamodb.attribute.boards.bid,
            KeyType: 'RANGE',
          },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: Constant.dynamodb.index.boards.gsi1,
            Projection: {
              ProjectionType: 'ALL',
            },
            KeySchema: [
              {
                AttributeName: Constant.dynamodb.attribute.boards.gid,
                KeyType: 'HASH',
              },
              {
                AttributeName: Constant.dynamodb.attribute.boards.gidNum,
                KeyType: 'RANGE',
              },
            ],
            ProvisionedThroughput: {
              ReadCapacityUnits: 6,
              WriteCapacityUnits: 6,
            },
          },
        ],

        ProvisionedThroughput: {
          ReadCapacityUnits: 6,
          WriteCapacityUnits: 6,
        },
      })
      .promise();
  },
  talks: async () => {
    await dynamodb
      .createTable({
        TableName: Constant.dynamodb.table.talks,
        AttributeDefinitions: [
          {
            AttributeName: Constant.dynamodb.attribute.talks.bid,
            AttributeType: 'N',
          },
          {
            AttributeName: Constant.dynamodb.attribute.talks.num,
            AttributeType: 'N',
          },
        ],
        KeySchema: [
          {
            AttributeName: Constant.dynamodb.attribute.talks.bid,
            KeyType: 'HASH',
          },
          {
            AttributeName: Constant.dynamodb.attribute.talks.num,
            KeyType: 'RANGE',
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 6,
          WriteCapacityUnits: 6,
        },
      })
      .promise();
  },
};

const put = () => {
  client.put(
    {
      TableName: Constant.dynamodb.table.sequences,
      Item: {
        [Constant.dynamodb.attribute.sequences.sname]: 'bid',
        [Constant.dynamodb.attribute.sequences.num]: 0,
      },
    },
    err => {
      if (err) console.log(err);
    }
  );

  for (let i = 0; i <= 17; i++) {
    client.put(
      {
        TableName: Constant.dynamodb.table.sequences,
        Item: {
          [Constant.dynamodb.attribute.sequences.sname]: `gid${i}`,
          [Constant.dynamodb.attribute.sequences.num]: 0,
        },
      },
      err => {
        if (err) console.log(err);
      }
    );
  }
};

export const init = async () => {
  await createTable.boards();
  await createTable.sequences();
  await createTable.talks();

  put();
};
