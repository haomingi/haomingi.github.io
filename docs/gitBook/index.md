## Gitbook常见命令

```bash
# 需要安装nodejs + yarn/npm

node -v

yarn -v/npm -v

# 安装全局命令
yarn global add gitbook/npm install gitbook -g
yarn global add gitbook-cli/npm install gitbook-cli -g

# 查看是否安装成功
gitbook -V

# 安装Gitbook依赖
gitbook install 此处依赖内容在package.json中的可以使用yarn/npm安装，安装速度更快

# 创建Gitbook项目
gitbook init 创建

# 本地启动预览
gitbook serve 本地启动

# 构建静态页面
gitbook build 打包
```

## Gitbook上传github

在develop开发，build完成之后把_book目录拷贝到master分支，全部覆盖
