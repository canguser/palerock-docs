
const path = require('path');
const fs = require("fs");

const docsDir = path.join(__dirname, '../');

const getGroupInfo = (pathname, title, origin = '/') => {
    const files = fs.readdirSync(pathname);
    const validFiles = files
        .map(f => {
            const state = fs.statSync(path.join(pathname, f));
            return {
                state,
                filename: f,
                filepath: path.join(pathname, f)
            }
        })
        .filter(({ state, filename }) => (state.isDirectory() || filename.toLowerCase().endsWith('.md')) && !filename.startsWith('.') && filename.toLowerCase() != 'readme.md');
    return {
        title,
        sidebarDepth: 3,
        collapsable: validFiles.length > 5,
        path: origin,
        children: validFiles.map(
            ({ state, filename, filepath }) => {
                let result = origin + filename + '/'
                if (state.isFile()) {
                    let result = origin + filename
                    return result.replace(/\.md/i, '')
                }
                if (state.isDirectory()) {
                    return getGroupInfo(filepath, filename, result);
                }
            }
        ).filter(f => f)
    }
}

// .vuepress/config.js
module.exports = {
    themeConfig: {
        nav: [
            { text: '首页', link: '/' },
            { text: '前端', link: '/fontend/' },
            { text: '网站', link: 'http://doc.itclan.cn' }
        ],
        sidebar: [
            getGroupInfo(docsDir, '苍石居博客')
        ],
        lastUpdated: 'Last Updated', // string | boolean
        // 假定是 GitHub. 同时也可以是一个完整的 GitLab URL
        repo: 'vuejs/vuepress',
        // 自定义仓库链接文字。默认从 `themeConfig.repo` 中自动推断为
        // "GitHub"/"GitLab"/"Bitbucket" 其中之一，或是 "Source"。
        repoLabel: '查看源码',

        // 以下为可选的编辑链接选项

        // 假如你的文档仓库和项目本身不在一个仓库：
        docsRepo: 'vuejs/vuepress',
        // 假如文档不是放在仓库的根目录下：
        docsDir: 'docs',
        // 假如文档放在一个特定的分支下：
        docsBranch: 'master',
        // 默认是 false, 设置为 true 来启用
        editLinks: true,
        // 默认为 "Edit this page"
        editLinkText: '帮助我们改善此页面！'
    }
}