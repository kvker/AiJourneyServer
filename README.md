# AI导游大师

后台管理 + 小程序 + H5 + Web门户 + APP（含鸿蒙） + Serverless + 大模型（ChatGLM） + 天地图 + TypeScript。

希望感兴趣的小伙伴一起开发，一个人实在精力有限。

服务端届时开源会使用 Express，并且核心数据使用环境变量方式供自行导入。

## AI导游大师服务端

本应用为AI导游大师个人项目服务端。

技术栈目前为：Express + LeanCloud(Serverless) + TypeScript。

目前的 Serverless 是测试版，已经处理好权限，请使用 leghair + aa123456 登录系统进行开发。

其中 LeanCloud 有兴趣的可以提供账号给我，我加你开发权限。

## 环境变量配置

BJAPIAddress 这是获取统一的令牌, 如获取智谱AI的token, 避免使用冲突

SeniverseKEY 获取心知天气的key

TencentSDKSecretId 腾讯云的id

TencentSDKSecretKey 腾讯云的key

## 待办

- [x] 支持GLM的SSE
- [ ] 支持将文本转为wav或mp3
- [ ] ?支持将wav或mp3转为文本