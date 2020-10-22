import Constant from '../../constant';
import dynamodb from '../';

const func = {
  getNum: async (sname: string) => {
    const _ret: {
      Item: { num: number };
    } = (await dynamodb
      .get({
        TableName: Constant.dynamodb.table.sequences,
        Key: {
          [Constant.dynamodb.attribute.sequences.sname]: sname,
        },
      })
      .promise()) as any;
    return _ret['Item']['num'];
  },
};

export default func;
