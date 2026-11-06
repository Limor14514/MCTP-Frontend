# CI 与 Jenkins 集成

## 当前分工

| 位置 | 用途 | 触发 |
|---|---|---|
| [ci.yml](../.github/workflows/ci.yml) | lint、单测、覆盖率、build、Lighthouse、同仓 PR 预览 | PR、push `develop`/`main`、手动 |
| [preview-fork.yml](../.github/workflows/preview-fork.yml) | 可信 fork PR 预览，复用已成功的 CI artifact | fork PR、手动 |
| [preview.yml](../.github/workflows/preview.yml) | PR 关闭清理、每周兜底清理、月初压缩 Pages 历史 | 关闭 PR、定时、手动 |
| [deploy.yml](../.github/workflows/deploy.yml) | `main` 的 GitHub Pages 前端预览，不是生产部署 | push `main`、手动 |
| [release.yml](../.github/workflows/release.yml) | 当前 `main` CI 成功后请求 Jenkins 生产部署 | CI 完成、手动 |
| Jenkins `MCTP-Deploy` | 生产前端 dist + 后端镜像部署 | release workflow 请求 |
| Jenkins `MCTP-Notify` | AstrBot 通知 | CI 失败、同分支此前失败后的首次成功 |
| Jenkins `MCTP-Cleanup` | 部署工作区磁盘治理 | Jenkins 定时、手动 |

Jenkins 不再运行前后端 CI；旧 `MCTP-FE`、`MCTP-API-CI` 多分支任务不要重新启用。
根目录的 [Jenkinsfile](../Jenkinsfile)、[Jenkinsfile.dependency](../Jenkinsfile.dependency) 是保留的历史脚本，不代表当前启用的任务。
核查时，实际 Jenkins 任务为 `MCTP-Deploy`、`MCTP-Notify`、`MCTP-Cleanup`；没有正在运行的依赖巡检任务。`MCTP-Deploy` 只公开 `BRANCH` 和 `FORCE_DEPLOY` 两个参数；最近检查的部署构建由用户触发，尚不能据此确认 GitHub 自动发布已实际跑通。

## CI 门禁与报告

- 必需检查名称保持 `lint`、`test`、`build`、`lighthouse`，与 `main`/`develop` 的现有分支保护一致。
- Node 24；CI 安装使用 `npm ci --include=dev`，即使 runner 设置生产环境也不会漏装 ESLint/Vite；build 维持 Vite 默认生产模式。
- `lint` 与 `test` 并行；两者通过后 `build` 才运行。
- 单测输出 JUnit 和原生 Node 覆盖率；测试失败后仍规范化已有 JUnit 并检查覆盖率。
- 行覆盖率下限 **70%**。测试失败和覆盖率失败都会让 `test` job 失败。
- 测试报告保留 14 天；`dist` 保留 7 天，供预览复用，不重复安装/构建。
- 同仓 PR 回写 CI 评论，实际通过数为总数减失败数和跳过数；按 GitHub 分页查找并清理重复标记评论。fork 无写权限时不尝试回写。
- Lighthouse 保持 **advisory**：断言失败不阻塞合并，但显示 workflow warning 和汇总。必需 job 成功不代表性能断言通过；如需硬门禁，应单独确认后移除 `continue-on-error`。
- [lighthouserc.cjs](../lighthouserc.cjs) 的 LCP 4000ms、CLS 0.1、无障碍 0.9 等阈值不变。

## PR 预览与 Pages

- [vite.config.js](../vite.config.js) 使用相对 `base: './'`；同一份 `dist` 可放在站点根目录或 `preview/pr-N/`。
- 同仓预览、fork 预览、主站 Pages 部署和清理使用同一 `pages-deploy` 并发组，避免同时写 `gh-pages`。
- GitHub 并发组最多保留一个运行项和一个等待项，不保证 FIFO；密集触发可能替换等待任务。被替换的预览可手动重跑，关闭目录有每周兜底清理。
- 写入前重新核对 PR 仍开放且 head SHA 没有变化；排队时已关闭/更新的 PR 不再发布旧预览。
- fork 仍仅允许既有白名单作者；校验指定 run 的仓库、head SHA、事件、workflow ID 和成功状态，不执行 fork 代码。
- 自动批准仅处理白名单作者当前开放 PR 对应的 `pull_request` CI run，并校验 fork 仓库与 head SHA；不会批准其他 workflow 或失效 revision。
- 手动 Pages 部署只允许从 `main` 运行。
- 清理使用 `pull_request_target: closed`，不 checkout、不执行 PR 代码，因此 fork 关闭也可立即清理。
- 定时清理分页读取所有开放 PR；月初历史压缩用显式 `force-with-lease`，不覆盖未观察到的新提交。
- Pages API 必须配置 HTTPS 的仓库变量 `VITE_API_BASE_URL`；前端 `VITE_` 变量会暴露给浏览器，不能包含密钥。

## 生产发布

1. PR 合入 `main`。
2. `main` 的 `CI` push run 全部完成且成功。
3. `release.yml` 通过 `workflow_run` 启动；仅接受本仓库 `main` push 的成功事件。
4. 验证事件 SHA 仍是当前 `main`；再以只读 GitHub API 确认 FE 与 API 当前 `main` SHA 各自最新的 push CI run 均成功。
5. 请求前再次核对 `main` SHA，调用 Jenkins `MCTP-Deploy`，参数保持 `BRANCH=main`、`FORCE_DEPLOY`。

手动发布必须选择 **main**，也必须已有当前 SHA 的成功 push CI；`force_deploy` 只控制 Jenkins 重部署，不绕过 CI。
`workflow_run` 工作流需要存在于默认分支 `develop`，功能分支上的修改本身不会改变线上自动发布；请走 PR。

需要仓库 Secrets：`JENKINS_URL`、`JENKINS_USER`、`JENKINS_TOKEN`。Token 必须是 Jenkins **API Token**，不是登录密码；API Token 请求不依赖 crumb。
HTTP 请求有连接/总超时，不自动重试部署 POST，以免重复入队。请求成功只代表已接受部署请求，不代表部署完成。
发布后必须查看对应 `MCTP-Deploy` 构建和线上健康检查。

**仍需留意的生产发布边界**：

- Jenkins 已在 `precheck` 读取前后端 `main` SHA、按 SHA 对去重，并通过同任务排队避免并行覆盖。
- 但 Jenkins 随后按 `BRANCH=main` 检出分支，不是按 `precheck` 记录的 commit 检出；若任一 `main` 在检查后、checkout 前移动，仍存在竞态。要消除该竞态，需部署任务使用已记录的 SHA checkout。
- 每个 release workflow 都会验证两个仓库的 CI，并在请求部署前再次确认两边 SHA 没变。可触发器仍分别存在于两仓；Jenkins 的同 SHA 对去重/排队是第二道保护。
- 对跨仓读取使用公开 GitHub Actions API；网络错误、限流或无成功 CI 均 fail closed（不触发部署），之后需要从 `main` 手动重跑 release。
- 手动从 Jenkins 直接启动部署不经过 Actions 双仓 CI 门禁；操作前应确认两仓目标 main SHA 的 CI 都通过。
- Coolify 如仍监听 `main`，应在 Coolify 关闭自动部署，避免双写。此次未改任何线上配置或触发生产部署。

## 通知与仓库配置检查

- `main`/`develop` push 的 CI 成功、失败都会请求 `MCTP-Notify`；同 ref 只保留最新 run 的通知。PR 与手动运行保留失败/恢复通知，不广播每次成功。通知包含失败 job、commit、`ACTOR`（PR 作者或 push/手动运行触发者）；查询历史 run 需要通知 job 的 `actions: read` 权限。Jenkins 任务需声明 `ACTOR` 参数并转成 webhook 的 `actor` 字段，插件才能按作者 @ QQ。
- 当前 release workflow 只确认 `MCTP-Deploy` 已接收请求，不代表部署已开始或完成。实际部署开始/成功/失败/回滚需由活动 `MCTP-Deploy` 任务的 post actions 调用 `MCTP-Notify`，传 `EVENT=deploy` 和真实结果；回滚状态必须由部署任务明确提供，不能从 HTTP 接收成功推断。本仓库不包含该活动 Jenkins 任务配置。
- 通知失败显示 warning 和步骤日志，不用 `|| true` 静默吞掉，不改变原 CI 失败结论。
- PR 评论回写失败同样显示 warning，但不阻断 CI；fork PR 不写评论或发机器人通知，这是避免在执行不可信 PR 代码时授予写权限/Secrets 的限制。
- Jenkins 的 AstrBot 凭证只在 Jenkins 管理，不写入 GitHub 构建产物或仓库。
- 截至 2026-11-05，GitHub Actions 默认 Token 是 read；三个 Jenkins Secret 和 HTTPS API 变量已存在。
- `main`/`develop` 开启严格必需检查与管理员约束，但审批数为 0；前端仓库还允许 merge/rebase，且未自动删除合并分支，与协作规范的 Squash 约定不一致。此次只审查，未修改线上设置。
- Dependabot 每周检查 npm、每月检查 Actions；依赖巡检脚本不是活跃的 Jenkins 定时任务，不能当作已执行的依赖审计。
- 本地等价验证：`npm run lint:check`、`npm test`、`npm run build`；覆盖率门禁需额外运行 CI 的报告命令。
