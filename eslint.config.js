import pluginVue from 'eslint-plugin-vue'

export default [
  {
    // showcase/ 是独立的展示站子工程（自带 package.json 与构建），不归主应用的 lint 管；
    // 它的构建由 CI 的 showcase 任务单独检查。
    ignores: ['dist/**', 'node_modules/**', 'showcase/**'],
  },
  ...pluginVue.configs['flat/recommended'],
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },
]
