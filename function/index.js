var { createClient } = require('@supabase/supabase-js')
var SHA256 = require("crypto-js/sha256");

exports.handler = async (req, resp, context) => {
    // 解决跨域问题
    resp.setHeader('Access-Control-Allow-Origin', '*') // *可以改成你的服务域名
    resp.setHeader('Access-Control-Allow-Methods', '*');
    resp.setHeader('Access-Control-Allow-Headers', '*');
    resp.setHeader('Access-Control-Max-Age', '3600');

    resp.setHeader('Content-Type', 'application/json')

    if (req.method === "OPTIONS") {
        resp.send("SUCCESS");
        return;
    }
  

  var params = {
      path: req.path,
      queries: req.queries,
      headers: req.headers,
      method : req.method,
      requestURI : req.url,
      clientIP : req.clientIP,
  }
 
  var body = JSON.parse(req.body);
  var token = body.token;
  var content = body.content
  var hash = SHA256(content).toString();
  const supabase = createClient(process.env.appUrl, process.env.appKey)

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

    var response_target;
    try {
      response_target = await fetch(process.env.apiUrl, init);
    } catch(error) {
      resp.send(JSON.stringify(error))
      return;
    }
    

    const res = await response_target.json()
    var content = res.choices[0].message.content;
    const { data:data1, error:error1 } = await supabase
    .from('summary')
    .upsert({ hash: hash, summary: content})
    .select()

    console.log(data1[0])
    if (error1) {
      resp.send(JSON.stringify(error1))
      return;
    }
    resp.send(JSON.stringify(data1[0]));
}
