
const path = require('path');
const fs = require("fs");
const labelMapping = require('./label-mapping');

const docsDir = path.join(__dirname, '../');

const getMappedTitle = (title) => {
    if (title in labelMapping) {
        return labelMapping[title];
    }
    return title;
}

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
        .filter(({ state, filename }) => (state.isDirectory() || filename.toLowerCase().endsWith('.md')) && !filename.startsWith('.'));
    return {
        ...validFiles.find(f => f.filename.toLowerCase() === 'readme.md') ? {
            path: origin
        } : {},
        title: getMappedTitle(title),
        sidebarDepth: 2,
        children: validFiles.map(
            ({ state, filename, filepath }) => {
                let result = origin + filename + '/'
                if (state.isFile() && filename.toLowerCase() !== 'readme.md') {
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

const getRootPages = (pathname) => {
    const files = fs.readdirSync(docsDir);
    const validFiles = files
        .map(f => {
            const state = fs.statSync(path.join(pathname, f));
            return {
                state,
                filename: f,
                filepath: path.join(pathname, f)
            }
        })
        .filter(
            ({ state, filename }) => state.isDirectory() && !filename.startsWith('.')
        );

    const result = validFiles
        .map(({ filename, filepath }) => [
            '/' + filename + '/', getGroupInfo(filepath, filename, '/' + filename + '/')
        ])
        .reduce((result = {}, [key, value]) => Object.assign(result, { [key]: [value] }), {});

    result[''] = [getGroupInfo(pathname, '苍石居博客')];
    return result;
}

// .vuepress/config.js
module.exports = {
    themeConfig: {
        nav: [
            { text: '首页', link: '/' },
        ],
        sidebar: getRootPages(docsDir),
        lastUpdated: '最近更新', // string | boolean
        logo: './image/logo-1.png',
        smoothScroll: true,
    },
    port: '4044'
}