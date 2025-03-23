// Cloudflare Workers 脚本
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * 处理请求
 * @param {Request} request
 */
async function handleRequest(request) {
  // 允许跨域请求
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // 处理 OPTIONS 请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // 检查请求方法
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    // 获取 POST 数据
    const data = await request.json();

    // 验证数据
    if (!data.to || !data.subject || !data.template) {
      return new Response(JSON.stringify({ message: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 获取客户端传递的模板内容
    let template = data.template;

    // 对模板内容进行安全处理（非常重要）
    template = cleanHTML(template);

    // 发送邮件
    const result = await sendEmail(data.to, data.subject, template);

    return new Response(JSON.stringify({ message: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * 发送邮件
 * @param {string} to
 * @param {string} subject
 * @param {string} template
 */
async function sendEmail(to, subject, template) {
  // SMTP 服务器配置
  const smtpHost = SMTP_HOST; // 从环境变量或者 Cloudflare Secrets 中获取 SMTP 服务器地址
  const smtpPort = SMTP_PORT; // 从环境变量或者 Cloudflare Secrets 中获取 SMTP 服务器端口
  const smtpUser = SMTP_USER; // 从环境变量或者 Cloudflare Secrets 中获取 SMTP 用户名
  const smtpPassword = SMTP_PASSWORD; // 从环境变量或者 Cloudflare Secrets 中获取 SMTP 密码
  const fromEmail = 'your_email@example.com';

  // 构建邮件内容
  const message = `From: ${fromEmail}\r\n` +
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n` +
    `\r\n` +
    `${template}\r\n`;

  // 编码邮件内容
  const encodedMessage = btoa(message);

  // 构建 SMTP 命令
  const smtpCommands = [
    `EHLO yourdomain.com\r\n`,
    `AUTH LOGIN\r\n`,
    `${btoa(smtpUser)}\r\n`,
    `${btoa(smtpPassword)}\r\n`,
    `MAIL FROM:<${fromEmail}>\r\n`,
    `RCPT TO:<${to}>\r\n`,
    `DATA\r\n`,
    `${message}\r\n.\r\n`,
    `QUIT\r\n`,
  ];

  try {
    // 连接到 SMTP 服务器
    const socket = await connect(smtpHost, smtpPort);

    // 发送 SMTP 命令
    for (const command of smtpCommands) {
      await socket.write(command);
      const response = await socket.read();
      console.log(`Command: ${command}, Response: ${response}`);
      // 检查响应状态码
      if (!response.startsWith('2')) {
        throw new Error(`SMTP Error: ${response}`);
      }
    }

    // 关闭连接
    socket.close();

    return 'Message has been sent';
  } catch (error) {
    console.error(error);
    return `Message could not be sent. Mailer Error: ${error.message}`;
  }
}

/**
 * 自定义的 HTML 清理函数
 * @param {string} html
 */
function cleanHTML(html) {
  // 这里可以使用 DOMPurify 库进行更严格的清理（推荐）
  // 需要将 DOMPurify 库添加到 Cloudflare Workers 中
  // 例如：import DOMPurify from 'dompurify';
  // const clean = DOMPurify.sanitize(html);
  // return clean;

  // 简单的过滤示例（不推荐直接使用，仅作为示例）
  const allowedTags = ['p', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'div', 'span', 'br', 'ul', 'ol', 'li', 'strong', 'em'];
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  html = html.replace(tagRegex, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      return match;
    } else {
      return '';
    }
  });
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  return html;
}

/**
 * 连接到 TCP 服务器
 * @param {string} host
 * @param {number} port
 */
async function connect(host, port) {
  // 这里需要使用 Cloudflare Workers 提供的 TCP Socket API
  // 但是 Cloudflare Workers 目前还没有提供 TCP Socket API
  // 因此，无法直接连接到 SMTP 服务器
  // 这里只是一个示例，无法实际运行
  throw new Error('TCP Socket API is not available in Cloudflare Workers');
}

// 𓆟 <--- 小鱼干
