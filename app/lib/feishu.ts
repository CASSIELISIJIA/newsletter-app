// 飞书API集成
interface FeishuConfig {
  appId: string;
  appSecret: string;
  documentToken: string;
}

interface NewsDocumentContent {
  title: string;
  articles: {
    category: string;
    title: string;
    source: string;
    url: string;
    publishedAt: string;
  }[];
}

class FeishuClient {
  private config: FeishuConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: FeishuConfig) {
    this.config = config;
  }

  // 获取访问令牌
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: this.config.appId,
        app_secret: this.config.appSecret,
      }),
    });

    const data = await response.json();
    if (data.code !== 0) {
      throw new Error(`飞书API错误: ${data.msg}`);
    }

    this.accessToken = data.tenant_access_token;
    this.tokenExpiry = Date.now() + (data.expire - 300) * 1000; // 提前5分钟过期
    return this.accessToken;
  }

  // 创建文档内容
  private createDocumentContent(articles: any[]): string {
    const categories = {};
    
    // 按类别分组
    articles.forEach(article => {
      if (!categories[article.category]) {
        categories[article.category] = [];
      }
      categories[article.category].push(article);
    });

    let content = '# 📰 新闻日报\n\n';
    content += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

    Object.entries(categories).forEach(([categoryId, categoryArticles]) => {
      const category = NEWS_CATEGORIES.find(c => c.id === categoryId);
      content += `## ${category?.label || categoryId}\n\n`;
      
      categoryArticles.forEach((article: any) => {
        const publishedAt = new Date(article.publishedAt).toLocaleString('zh-CN');
        content += `### ${article.title}\n`;
        content += `- **来源**: ${article.sourceName}\n`;
        content += `- **时间**: ${publishedAt}\n`;
        content += `- **链接**: [查看原文](${article.url})\n\n`;
      });
    });

    return content;
  }

  // 推送新闻到飞书文档
  async pushNewsToDocument(articles: any[]): Promise<void> {
    try {
      const token = await this.getAccessToken();
      const content = this.createDocumentContent(articles);

      // 使用文档写入API
      const response = await fetch(
        `https://open.feishu.cn/open-apis/docx/v1/documents/${this.config.documentToken}/content/blocks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            block_type: 'docx_paragraph',
            paragraph_elements: [
              {
                text_run: {
                  text: content,
                  style: {
                    font_size: 12,
                  },
                },
              },
            ],
          }),
        }
      );

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(`飞书文档写入失败: ${data.msg}`);
      }

      console.log('新闻已成功推送到飞书文档');
    } catch (error) {
      console.error('推送新闻到飞书文档失败:', error);
      throw error;
    }
  }
}

// 导出配置函数
export function getFeishuConfig(): FeishuConfig {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const documentToken = process.env.FEISHU_DOCUMENT_TOKEN;

  if (!appId || !appSecret || !documentToken) {
    throw new Error('请配置飞书环境变量: FEISHU_APP_ID, FEISHU_APP_SECRET, FEISHU_DOCUMENT_TOKEN');
  }

  return { appId, appSecret, documentToken };
}

// 导出飞书客户端
export async function createFeishuClient(): Promise<FeishuClient> {
  const config = getFeishuConfig();
  return new FeishuClient(config);
}

// 导出推送函数
export async function pushNewsToFeishu(articles: any[]): Promise<void> {
  const client = await createFeishuClient();
  await client.pushNewsToDocument(articles);
}