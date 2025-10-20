import { useState } from "react";
import * as React from 'react';
import "./ToolPanel.css"; // 引入样式

import ToolStyle from './ToolPanel.module.css';

export function ToolPanel() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState("fast");

  const handleTest = () => console.log("测试中...", url, mode);
  const handleDownload = () => console.log("下载中...");
  const handleView = () => console.log("查看结果.s..");

  return (
    <div className={ToolStyle.toolContainer}>
      <div className={ToolStyle.toolCard} style={{display: "flex",  flexDirection: "column"}}>
        <h2 className="tool-title">工具控制面板</h2>
        <p className="tool-subtitle">一个简单的测试 / 下载 / 查看工具界面</p>

        <div className="tool-form">
          {/* 输入框 */}
          <div className="form-group">
            <label htmlFor="url" style={{color: "black"}}>输入地址：</label>
            <input
              id="url"
              type="text"
              placeholder="请输入测试地址..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* 下拉框 */}
          <div className="form-group">
            <label htmlFor="mode">选择模式：</label>
            <select
              id="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="fast">快速模式</option>
              <option value="safe">安全模式</option>
              <option value="custom">自定义模式</option>
            </select>
          </div>

          {/* 附加参数 */}
          <div className="form-group">
            <label htmlFor="param">附加参数：</label>
            <input id="param" type="text" placeholder="例如：--verbose" />
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="tool-buttons">
          <button className="btn btn-secondary" onClick={handleTest}>测试</button>
          <button className="btn btn-outline" onClick={handleDownload}>下载</button>
          <button className="btn btn-primary" onClick={handleView}>查看</button>
        </div>
      </div>
    </div>
  );
}
