import * as Express from 'express';
import * as serverless from 'serverless-http';
import * as Cors from 'cors';
import * as Helmet from 'helmet';
import { check, validationResult } from 'express-validator';

import Constant from './constant';
import talks from './dynamodb/table/talks';
import boards from './dynamodb/table/boards';
import sequences from './dynamodb/table/sequences';

const app = Express();

// サーバ情報隠蔽
app.disable('x-powered-by');

// セキュリティ対策
app.use(Helmet());

// cors
app.use(
  Cors({
    origin:
      Constant.origin[process.env.NODE_ENV as 'development' | 'production'],
  })
);

// postリクエスト使えるようにする
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

// Bearerチェック
app.use(
  (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    req.headers.authorization === Constant.bearer
      ? next()
      : res.sendStatus(401);
  }
);

// ミドルウエア　エラーハンドリング
app.use(
  async (
    err: Error,
    req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction
  ) => {
    console.log(err);
    res.sendStatus(500);
  }
);

app.get(
  '/genre/:id/:num',
  async (req: Express.Request, res: Express.Response) => {
    try {
      const _list = await boards.pagingGenre(
        Number(req.params.num),
        Number(req.params.id)
      );

      res.send({
        list: _list.Items,
        count: await sequences.getNum(`gid${req.params.id}`),
      });
    } catch (error) {
      res.sendStatus(500);
    }
  }
);

app.get('/info/:num', async (req: Express.Request, res: Express.Response) => {
  try {
    const _list = await boards.pagingInfo(Number(req.params.num));

    res.send({
      list: _list.Items,
      count: await sequences.getNum(`bid`),
    });
  } catch (error) {
    res.sendStatus(500);
  }
});
app.get(
  '/talks/:id/:num',
  async (req: Express.Request, res: Express.Response) => {
    try {
      const _list = await talks.paging(
        Number(req.params.num),
        Number(req.params.id)
      );

      res.send({
        list: _list.Items,
        count: await sequences.getNum(`bid${req.params.id}`),
      });
    } catch (error) {
      res.sendStatus(500);
    }
  }
);

app.post(
  '/board',
  [
    check(Constant.dynamodb.attribute.boards.bname)
      .not()
      .isEmpty()
      .isLength({ max: Constant.dynamodb.validation.boards.bname }),
    check(Constant.dynamodb.attribute.boards.gid)
      .not()
      .isEmpty()
      .isInt({ min: 0, max: Constant.dynamodb.genreNum }),
  ],
  async (req: Express.Request, res: Express.Response) => {
    try {
      if (!validationResult(req).isEmpty()) {
        res.sendStatus(500);
        return;
      }

      const _params: {
        bname: string;
        gid: number;
      } = req.body;

      res.send({
        id: await boards.create({
          gid: Number(_params.gid),
          bname: _params.bname,
        }),
      });
    } catch (error) {
      res.sendStatus(500);
    }
  }
);
app.post(
  '/talk',
  [
    check(Constant.dynamodb.attribute.talks.bid)
      .not()
      .isEmpty()
      .isInt({ min: 1 }),
    check(Constant.dynamodb.attribute.talks.uname)
      .not()
      .isEmpty()
      .isLength({ max: Constant.dynamodb.validation.talks.uname }),
    check(Constant.dynamodb.attribute.talks.message)
      .not()
      .isEmpty()
      .isLength({ max: Constant.dynamodb.validation.talks.message }),
  ],
  async (req: Express.Request, res: Express.Response) => {
    try {
      if (!validationResult(req).isEmpty()) {
        res.sendStatus(500);
        return;
      }

      const _params: {
        bid: number;
        uname: string;
        message: string;
      } = req.body;

      if ((await sequences.getNum(`bid`)) < Number(_params.bid)) {
        res.sendStatus(500);
        return;
      }

      await talks.create({
        bid: Number(_params.bid),
        uname: _params.uname,
        message: _params.message,
      });

      res.sendStatus(200);
    } catch (error) {
      res.sendStatus(500);
    }
  }
);

export const handler = serverless(app);
