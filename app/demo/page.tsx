"use client";

import { useState } from "react";

export default function DemoPage() {
  const [timeRange, setTimeRange] = useState("72h");
  const [view, setView] = useState<"news" | "newsletter">("news");
  
  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">全球政经要闻 Newsletter</h1>
              <p className="text-sm text-gray-500">海外重点媒体聚合 · 优化演示</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                演示模式 · 查看优化效果
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">筛选器</h2>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mr-3">时间范围：</label>
                  <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="72h">72小时</option>
                    <option value="48h">48小时</option>
                    <option value="24h">24小时</option>
                    <option value="today">Today</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Time Range Options */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">时间选项对比：</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-red-600 mb-2">优化前</h4>
                  <div className="flex space-x-2">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">24小时</span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">3天</span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">一周</span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">一月</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-green-600 mb-2">优化后 ✅</h4>
                  <div className="flex space-x-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">72小时</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">48小时</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">24小时</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">Today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Newsletter Button */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Newsletter按钮对比：</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-red-600 mb-2">优化前</h4>
                  <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md flex items-center space-x-2">
                    <span>Newsletter</span>
                    <span className="bg-gray-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                  </button>
                </div>
                <div>
                  <h4 className="font-medium text-green-600 mb-2">优化后 ✅</h4>
                  <button 
                    onClick={() => setView(view === "news" ? "newsletter" : "news")}
                    className={`px-4 py-2 ${view === "newsletter" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"} rounded-md`}
                  >
                    Newsletter
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow">
            {/* View Toggle */}
            <div className="flex border-b">
              <button 
                onClick={() => setView("news")}
                className={`flex-1 py-3 px-4 text-center ${view === "news" ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
              >
                新闻列表
              </button>
              <button 
                onClick={() => setView("newsletter")}
                className={`flex-1 py-3 px-4 text-center ${view === "newsletter" ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
              >
                Newsletter
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {view === "news" ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">新闻列表演示</h3>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">全球政经要事</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">地缘政治紧张局势升级，市场反应强烈</h4>
                          <p className="text-sm text-gray-600 mb-2">路透社 · 2026年7月29日</p>
                          <p className="text-sm text-gray-700">随着地缘政治紧张局势的升级，全球金融市场出现明显波动...</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">国际贸易与政策</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">国际贸易协定谈判取得重大突破</h4>
                          <p className="text-sm text-gray-600 mb-2">金融时报 · 2026年7月29日</p>
                          <p className="text-sm text-gray-700">经过多轮艰苦谈判，主要经济体终于在贸易协定问题上达成共识...</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">亚太政经动态</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">亚太地区经济合作论坛召开</h4>
                          <p className="text-sm text-gray-600 mb-2">BBC News · 2026年7月29日</p>
                          <p className="text-sm text-gray-700">亚太地区主要经济体在基础设施建设和数字经济合作方面达成多项协议...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Newsletter视图</h3>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                      📋 复制 Newsletter
                    </button>
                  </div>
                  
                  {/* Newsletter Content */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-bold mb-3 pb-2 border-b border-gray-200">AIIB in the News</h2>
                      <div className="space-y-2">
                        <div className="pl-4">
                          <div className="text-sm font-medium text-gray-900">亚洲基础设施投资银行批准新贷款项目</div>
                          <a href="#" className="text-xs text-blue-600 hover:underline block mt-1">查看原文</a>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-base font-bold mb-3 pb-2 border-b border-gray-200">Macro and Political</h2>
                      <div className="space-y-2">
                        <div className="pl-4">
                          <div className="text-sm font-medium text-gray-900">国际贸易谈判取得重要进展</div>
                          <a href="#" className="text-xs text-blue-600 hover:underline block mt-1">查看原文</a>
                        </div>
                        <div className="pl-4">
                          <div className="text-sm font-medium text-gray-900">美联储利率决议维持不变</div>
                          <a href="#" className="text-xs text-blue-600 hover:underline block mt-1">查看原文</a>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-base font-bold mb-3 pb-2 border-b border-gray-200">Asia-Pacific</h2>
                      <div className="space-y-2">
                        <div className="pl-4">
                          <div className="text-sm font-medium text-gray-900">亚太地区经济合作论坛召开</div>
                          <a href="#" className="text-xs text-blue-600 hover:underline block mt-1">查看原文</a>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-base font-bold mb-3 pb-2 border-b border-gray-200">Finance and Capital Markets</h2>
                      <div className="space-y-2">
                        <div className="pl-4">
                          <div className="text-sm font-medium text-gray-900">全球股市波动分析</div>
                          <a href="#" className="text-xs text-blue-600 hover:underline block mt-1">查看原文</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optimization Summary */}
          <div className="bg-blue-50 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-medium text-blue-900 mb-4">🎯 优化效果总结</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-green-600 mb-2">✅ 时间范围优化</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 新增72小时、48小时选项</li>
                  <li>• 添加Today选项筛选当天新闻</li>
                  <li>• 更灵活的时间选择</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-green-600 mb-2">✅ 界面简化</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Newsletter按钮移除数字显示</li>
                  <li>• 更简洁的界面设计</li>
                  <li>• 减少视觉干扰</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-green-600 mb-2">✅ 字体优化</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 使用Arial字体12px</li>
                  <li>• 分类标题加粗14px</li>
                  <li>• 更好的阅读体验</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-green-600 mb-2">✅ 内容精准</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 过滤企业新闻，聚焦政策</li>
                  <li>• 国际贸易政策更精准</li>
                  <li>• 提高内容质量</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}