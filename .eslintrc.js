module.exports = {
  extends: 'erb',
  rules: {
    // 统一缩进2个空格
    'indent': ['error', 2],
    // 强制for循环按照正确的方向前进
    'for-direction': 'error',
    // switch语句必须有default分支
    'default-case': 'error',
    // 不允许使用空函数
    'no-empty-function': 'error',
    // 禁止在没有类型检查的情况下与null比较
    'no-eq-null': 'error',
    // 禁止在变量定义之前使用他
    'no-use-before-define': 'error',
    // 变量的命名一律使用驼峰命名
    'camelcase': 'error',
    // switch 的冒号之后有空格
    'switch-colon-spacing': ['error', { 'after': true, 'before': false }],
    // 箭头函数的箭头前后都有空格
    'arrow-spacing': 'error',
    // 要求非空文件末尾存在一行空行
    'eol-last': 'error',
    // 回调函数中必须有容错处理
    'handle-callback-err': 'error',
    // 禁止行尾空格
    'no-trailing-spaces': 'error',
    // 禁止出现多行空行
    'no-multiple-empty-lines': 'error',
    // 禁止在单行内非缩进情况出现多个空格
    'no-multi-spaces': 'error',
    //  使用'==='来代替'=='
    'eqeqeq': 'error',
    //  遵循大括号约定
    'curly': 'error',
    // 禁止与自身比较 , if (x===x){}
    'no-self-compare': 'error',
    // 禁止重复导入
    'no-duplicate-imports': 'error',
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'error',
    // Since React 17 and typescript 4.1 you can safely disable the rule
    'react/react-in-jsx-scope': 'off',
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./.erb/configs/webpack.config.eslint.ts'),
      },
      typescript: {},
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
