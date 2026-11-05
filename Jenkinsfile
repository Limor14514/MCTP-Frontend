def notifyAstrBot(String status, String title) {
    try {
        def elapsed = ((System.currentTimeMillis() - currentBuild.startTimeInMillis) / 1000).toInteger()
        withCredentials([
            string(credentialsId: 'astrbot-base-url', variable: 'ASTRBOT_BASE_URL'),
            string(credentialsId: 'astrbot-api-key', variable: 'ASTRBOT_API_KEY'),
            string(credentialsId: 'astrbot-webhook-token', variable: 'ASTRBOT_WEBHOOK_TOKEN')
        ]) {
            withEnv([
                "NOTIFY_STATUS=${status}",
                "NOTIFY_TITLE=${title}",
                "NOTIFY_REPO=MCTP-FE",
                "NOTIFY_EVENT=ci",
                "NOTIFY_BRANCH=${env.CHANGE_BRANCH ?: env.BRANCH_NAME ?: ''}",
                "NOTIFY_SUBTITLE=${env.CHANGE_ID ? 'PR #' + env.CHANGE_ID : ''}",
                "NOTIFY_PR=${env.CHANGE_ID ?: ''}",
                "NOTIFY_URL=${env.BUILD_URL ?: ''}",
                "NOTIFY_DURATION=${elapsed}s",
                "NOTIFY_ACTOR=${env.BUILD_USER_ID ?: ''}",
                "NOTIFY_DETAILS=构建 #${env.BUILD_NUMBER} | ${env.JOB_NAME.replaceAll('%2F', '/')}"
            ]) {
                sh 'node scripts/notify-astrbot.mjs || true'
            }
        }
    } catch (Exception exc) {
        echo "AstrBot 通知跳过（凭证未配置或发送失败）：${exc.message}"
    }
}

pipeline {
    agent any

    tools {
        nodejs 'Nodejs24'
    }

    options {
        timestamps()
        timeout(time: 25, unit: 'MINUTES')
        disableConcurrentBuilds(abortPrevious: true)
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '2'))
        // 显式 checkout，便于先清理 PR 工作区并加一次重试
        skipDefaultCheckout()
    }

    parameters {
        booleanParam(name: 'SKIP_LIGHTHOUSE', defaultValue: false, description: '跳过 Lighthouse 性能与无障碍检测')
        booleanParam(name: 'FORCE_LIGHTHOUSE', defaultValue: false, description: '在非 develop/main 或纯文档 PR 上强制运行 Lighthouse')
        booleanParam(name: 'LIGHTHOUSE_STRICT', defaultValue: false, description: 'Lighthouse 有 warning 时把构建标记为 UNSTABLE（默认只写描述/评论）')
    }

    environment {
        NODE_ENV = 'development'
    }

    stages {
        stage('checkout') {
            steps {
                script {
                    // PR 工作区先清空，避免旧工作区导致的空目录/脏文件问题
                    if (env.CHANGE_ID) {
                        deleteDir()
                    }
                }
                retry(2) {
                    checkout scm
                }
            }
        }

        stage('变更检测') {
            steps {
                script {
                    if (env.CHANGE_ID) {
                        def target = env.CHANGE_TARGET ?: 'develop'
                        sh "git fetch --no-tags origin +refs/heads/${target}:refs/remotes/origin/${target}"
                        def files = sh(
                            script: "git diff --name-only origin/${target}...HEAD",
                            returnStdout: true
                        ).trim()
                        def list = files ? files.split('\n') : []
                        def relevant = list.any {
                            it ==~ /^(src|public|scripts|docker)\/.*|^package(-lock)?\.json$|^vite\.config\.js$|^lighthouserc\.cjs$|^index\.html$/
                        }
                        env.RUN_LIGHTHOUSE = relevant ? 'true' : 'false'
                        echo "前端相关变更：${relevant}（共 ${list.size()} 个文件）"
                    } else {
                        // 分支构建只在 develop/main 默认跑；功能分支需要 FORCE_LIGHTHOUSE
                        env.RUN_LIGHTHOUSE = (env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'main') ? 'true' : 'false'
                    }
                }
            }
        }

        stage('环境信息') {
            steps {
                sh 'node --version && npm --version'
            }
        }

        stage('安装依赖') {
            steps {
                sh 'npm ci --no-audit --no-fund'
            }
        }

        stage('构建项目') {
            steps {
                sh 'NODE_ENV=production npm run build'
            }
        }

        stage('Lighthouse 性能检测') {
            // 只在 develop/main、或 PR 改动涉及前端代码/配置时运行；纯文档 PR 跳过。
            when {
                allOf {
                    expression { !params.SKIP_LIGHTHOUSE }
                    anyOf {
                        expression { env.RUN_LIGHTHOUSE == 'true' }
                        expression { params.FORCE_LIGHTHOUSE }
                    }
                }
            }
            steps {
                // 注意：Docker Hub 上的 kanti/lighthouse-ci 并不是 GoogleChrome/lighthouse-ci
                // （那是 2019 年另一个同名项目，CLI 叫 lighthouse-ci），镜像里没有 lhci 命令。
                // 这里用 docker/lighthouse-ci.Dockerfile 自建镜像（Chromium + @lhci/cli），
                // 首次构建约 1-2 分钟，之后命中层缓存。
                sh '''
                    set -e
                    IMAGE=mctp/lighthouse-ci:0.15.1

                    if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
                        echo "[lighthouse] 构建镜像 $IMAGE"
                        docker build -t "$IMAGE" -f docker/lighthouse-ci.Dockerfile docker/
                    fi

                    # Jenkins 自身跑在容器里时，$WORKSPACE 只存在于该容器的卷里，
                    # 直接 -v 会挂到宿主机上不存在的路径，因此优先用 --volumes-from。
                    CID="$(hostname)"
                    if ! docker inspect "$CID" >/dev/null 2>&1; then
                        CID="$(grep -oE '[0-9a-f]{64}' /proc/self/cgroup 2>/dev/null | head -1 || true)"
                    fi

                    if [ -n "$CID" ] && docker inspect "$CID" >/dev/null 2>&1; then
                        MOUNT_ARGS="--volumes-from $CID"
                    else
                        MOUNT_ARGS="-v $WORKSPACE:$WORKSPACE"
                    fi

                    docker run --rm $MOUNT_ARGS \
                        -e HOME=/tmp \
                        -e CHROME_PATH=/usr/bin/chromium \
                        -w "$WORKSPACE" \
                        "$IMAGE" \
                        lhci autorun --config=./lighthouserc.cjs
                '''
                script {
                    def summary = sh(
                        script: 'node scripts/lighthouse-summary.mjs 2>/dev/null || true',
                        returnStdout: true
                    ).trim()
                    if (summary) {
                        currentBuild.description = summary
                        echo summary
                    }
                    if (env.CHANGE_ID) {
                        withCredentials([usernamePassword(credentialsId: 'github-MCTP', usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN')]) {
                            withEnv([
                                "REPORT_KIND=lighthouse",
                                "LH_SUMMARY=${summary}",
                                "PR_NUMBER=${env.CHANGE_ID}",
                                "GH_REPO=SelfAbandonment/MCTP-Frontend"
                            ]) {
                                sh 'node scripts/pr-comment.mjs'
                            }
                        }
                    }
                    def warnMatch = summary =~ /([1-9]\d*)\s+warnings/
                    if (warnMatch.find() && params.LIGHTHOUSE_STRICT) {
                        currentBuild.result = 'UNSTABLE'
                        echo 'Lighthouse 有警告，LIGHTHOUSE_STRICT=true，构建标记为 UNSTABLE'
                    } else if (warnMatch.find()) {
                        echo 'Lighthouse 有警告（仅记录，不阻塞；需要阻塞请用 LIGHTHOUSE_STRICT=true）'
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'dist/index.html,dist/assets/**', allowEmptyArchive: true
            archiveArtifacts artifacts: '.lighthouseci/**', allowEmptyArchive: true
        }
        failure {
            script {
                notifyAstrBot('failure', "MCTP-FE 构建失败：${env.CHANGE_BRANCH ?: env.BRANCH_NAME ?: ''}")
            }
        }
        fixed {
            script {
                notifyAstrBot('fixed', "MCTP-FE 构建恢复：${env.CHANGE_BRANCH ?: env.BRANCH_NAME ?: ''}")
            }
        }
        unstable {
            script {
                notifyAstrBot('warning', "MCTP-FE Lighthouse 警告：${env.CHANGE_BRANCH ?: env.BRANCH_NAME ?: ''}")
            }
        }
        cleanup {
            script {
                // 通知需要工作区，清理放到最后
                // 用 env.CHANGE_ID 判断：changeRequest() 在分支构建里也可能返回真值
                if (env.CHANGE_ID) {
                    cleanWs()
                }
            }
        }
        unsuccessful {
            echo '构建未成功：请检查「构建项目」「Lighthouse 性能检测」阶段日志；单元测试/覆盖率/PR 评论由 GitHub Actions 负责。'
        }
    }
}
