# 添加AI摘要
本文介绍一种基本通用的方法,为文章添加一个酷炫的 AI 摘要功能 [demo](http://cql46525g6h28thiiu8g.app.memfiredb.cn/)

# 准备工作
注册[MemFire](https://cloud.memfiredb.com/auth/login?from=1HdvKv)创建应用后建表
![table](https://img.itrunner.cn/file/461e4d0cc8f6f050c201b.png)
summary表主要用途：
  * 存储文章对应的ai摘要，当内容不发生变更时，不需要调用ai接口生成摘要
  * 做简单的判断，避免api接口被盗刷

# 后端
https://github.com/TiannV/ai-summary/blob/main/function/index.js

主要逻辑是判断summary表里是否有文章对应的摘要，没有的话使用ai接口生成摘要
```
  const { data, error } = await supabase
    .from('summary')
    .select('hash, summary')
    .eq('hash', hash).single();

  if (error) {
    resp.setStatusCode(403)
    resp.setHeader('Content-Type', 'application/json')
    resp.send(JSON.stringify(error));
    return;
  }

    if (data.summary) {
      resp.send(JSON.stringify(data));
      return;
    }

    const init = {
      body: JSON.stringify({
        "model": process.env.model,
        "messages": [
          {
            "role": "system",
            "content": "你是一个摘要生成工具,你需要解释我发送给你的内容,不要换行,不要超过200字,不要包含链接,只需要简单介绍文章的内容,不需要提出建议和缺少的东西,不要提及用户.请用中文回答,这篇文章讲述了什么?"
          },
          {
            "role": "user",
            "content": body.content
          }
        ],
        "safe_mode": false
      }),
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "Authorization": process.env.apiKey,
      },
    };
```
使用[MemFireCloud](https://cloud.memfiredb.com/auth/login?from=1HdvKv)云函数作为后端地址。
上传index.zip 至 云函数 获得后端地址
![云函数](https://img.itrunner.cn/file/7e891db5c2ddc6f4c4ecb.png)

环境变量
* apiKey: ai的apikey
* apiUrl: ai接口地址
* appKey: MemFireCloud 应用key
* appUrl: MemFireCloud 应用地址
* model: ai模型

# 前端
https://github.com/TiannV/ai-summary/blob/main/summary.js
在文章页面内引入如下代码
```
<!-- 可以在网页结构的任何位置插入,只要你能够 -->
<script src="上面的js文件"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>

<!-- 但要确保的是,下列代码一定要在上述 js 之后插入 -->
<script data-pjax defer>
  const { createClient } = supabase
  client = createClient(app_url, app_key)

  new ChucklePostAI({
    // 文章内容所在的元素属性的选择器,也是AI挂载的容器,AI将会挂载到该容器的最前面
    el: '#post>#article-container',
	summary_directly: true,
	summary_toggle: false,
	rec_method: 'web',
	pjax: true,
	supabase: client,
	summary_url: summary_url
  })
</script>
```
app_url,app_key 填写对应应用的信息，summary_url填写上面云函数的地址

# 仓库地址
https://github.com/TiannV/ai-summary
# 参考
[给博客添加一个AI摘要](https://blog.csun.site/posts/0.html)
