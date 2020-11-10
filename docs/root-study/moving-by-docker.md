# 使用 Docker 来迁移 CentOS 系统

最近，着手将服务器从腾讯云切换到阿里云，但是，部署在腾讯云服务器上的项目内容过于繁杂，如果在阿里云手动从头部署的话，在环境搭建和项目部署中会耗费大量的时间。

在百般思筹下突然想到了 Docker，Docker 是一个容器管理的工具，详细介绍如下：[Docker 官网](https://www.docker.com/resources/what-container)

基于 Docker 的容器机制，即可以运行不同系统环境下的容器并且相互隔离，我有了一个想法，**使用 Docker 将我在腾讯云的服务器系统整体打包，然后使用打包后的文件在阿里云生成一个 Docker 镜像，从而将我原来的系统包括部署好的项目作为一个容器运行在阿里云的服务器。**

有了基本的思路，于是着手去实施，首先是将系统打包为 Docker 可以识别的 tar 归档文件：
```shell
tar -cvpf /tmp/system.tar --directory=/ --exclude=proc --exclude=sys --exclude=dev --exclude=run --exclude=boot .
```
通过上述 tar 命令将系统内除了 /proc /sys /dev /run /boot 这几个根目录文件夹外的内容打包（这几个文件夹是系统启动时自动生成的，可以不用打包，其依赖于系统于内核），在进行 tar 打包时候，注意打包过程中的错误信息，如果有错误出现，要重新打包，不然在通过 docker 构建进行时，会给出找不到命令行或其他类型的错误。

打包完成后将 /tmp/ststem.tar 下载到阿里云服务器里，紧接着准备使用 Docker 生成镜像，在生成镜像前，首先要安装 Docker，由于使用的是 CentOS 的系统，这里使用 Yum 进行安装，安装流程参考 Docker 官方文档：[Install Docker Engine on CentOS](https://docs.docker.com/engine/install/centos/)，需要注意的是，官方提供的方法中由于 yum 的源是国外的所以速度很慢，需要的可以更换为国内的源。

在安装并运行好 Docker 后，在阿里云服务器执行以下内容：
```shell
cat system.tar | docker import - OriginSystem:1.0
```
该命令可以通过 tar 文件生成名为 OriginSystem:1.0 的镜像，当镜像生成完成时可以通过以下命令查看生成好的镜像：
```shell
docker images
```
确定镜像生成完毕后需要通过该镜像生成一个容器，并运行在服务器内部：
```shell
docker run --net=host -d --name origin-system-v1 --privileged=true -p 80:80 OriginSystem:1.0 /usr/sbin/init
```
以上命令中 --net=host 参数可以使生成的容器能改联网，--name 参数表示其容器名，-d 表示容器后台运行，-p 参数表示端口映射规则，后面跟 80:80 就表示将容器的 80 端口映射到主机的 80端口，**--privileged=true 参数（很重要，必须设置）能够让生成的容器能够使用 systemctl 等命令**, 最后的 /usr/sbin/init 是配合上一个参数所必须的。在容器生成完成后可以通过 docker container ls 查看容器信息以及其容器 id，通过该 id，我们可以通过以下命令进入到容器：
```shell
docker exec -it [id] bash
```
成功进入容器后，发现和原来腾讯云上的系统一模一样，Nice！
不过很快便发现了问题，后台服务并不能成功启动，比如启动 nginx：
```shell
systemctl start nginx
```
结果却得到了报错信息：
```message
Authorization not abailable. Check if polkit service is running or see debug message for more infomation.
```
去网上查了很久都说是 polkit 这个工具包没有正常运行，由于网上大多不是在 Docker 容器中遇到的该问题，所以并没有得到比较满意的解决方案。最后，在网上发现了一个 docker 容器中的类似情况，其解决方案如下：
```shell
mv -f /var/run /var/run.runremove~
ln -sfn /run /var/run
mv -f /var/lock /var/lock.lockmove~
ln -sfn /run/lock /var/lock
docker stop [容器id]
docker start [容器id]
docker exec -it [容器id] bash
```
执行命令后重新进入容器，发现问题已经解决～
完美！


> 原文转自 [使用 Docker 来迁移 CentOS 系统 | 苍石居](https://palerock.cn/articles/001fsUWCJDr) 未经允许禁止转载