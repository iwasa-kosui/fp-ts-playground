import {decompressFromEncodedURIComponent} from 'lz-string'

const fromHash = () => {
  const hash = window.location.hash.replace('#code/', '')
  if (hash == null || hash === '') {
    return
  }
  try {
    return decompressFromEncodedURIComponent(hash)
  } catch (error) {
    console.error(error)
    return
  }
}

export const files = {
  'index.ts': {
    file: {
      contents: fromHash() || localStorage.getItem('code') || `import * as AP from 'fp-ts/Apply';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

// ユーザー情報の型定義
export type User = {
  username: string;
  age: number;
};

// バリデーション関数の型定義
type ValidationFunction<A> = (a: A) => E.Either<Array<string>, A>;

const validateUsername: ValidationFunction<string> = (username) =>
  username.length >= 3
    ? E.right(username)
    : E.left(['Username must be at least 3 characters']);

const validateAge: ValidationFunction<number> = (age) =>
  age >= 18 ? E.right(age) : E.left(['Age must be 18 or older']);

// バリデーションを合成する
const validateUser: ValidationFunction<User> = (user: User) =>
  pipe(
    {
      username: validateUsername(user.username),
      age: validateAge(user.age),
    },
    AP.sequenceS(E.getApplicativeValidation(A.getSemigroup<string>())),
  );

// テスト用のユーザーデータ
const validUser = {
  username: 'john_doe',
  age: 25,
};

const invalidUser = {
  username: 'jo',
  age: 15,
};

// テスト
console.log(validateUser(validUser)); // E.Right(validUser)
console.log(validateUser(invalidUser));
`,
    },
  },
  'package.json': {
    file: {
      contents: `
{
  "name": "example-app",
  "devDependencies": {
    "nodemon": "latest",
    "ts-node": "latest",
    "glob": "10.3.10"
  },
  "dependencies": {
    "fp-ts": "2.16.0"
  },
  "scripts": {
    "clear": "node -e \\"process.stdout.write('\\u001B[2J\\u001B[0;0f')\\"",
    "start": "npx nodemon -q --watch '*.ts' -x 'npm run clear && ts-node' ./index.ts"
  }
}`,
    },
  },
};