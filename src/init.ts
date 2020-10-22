import talks from './dynamodb/table/talks';
import boards from './dynamodb/table/boards';

const init = async () => {
  console.log('start');

  const roomSu = 34;
  for (let i = 1; i <= roomSu; i++) {
    await boards.create({
      bname: 'わくわくわく部屋',
      gid: Math.floor(Math.random() * 18),
    });
  }

  for (let i = 1; i <= 1028; i++) {
    await talks.create({
      uname: '名無し',
      message: 'こんにちは',
      bid: Math.floor(Math.random() * roomSu) + 1,
    });
  }

  console.log('fin');
};

init();
