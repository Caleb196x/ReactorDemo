import { useState,useRef } from "react";
import * as React from "react";

export function LoginPage() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    remember: false,
  });
  const formRef = useRef(form);

  const handleChange = (e) => {
    
    const { name, value, type, checked } = e.target;
    console.log(`handleChange --  ${form.username}`);
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    console.log(`handleChange2 --  ${form.username}`);
    formRef.current = form;
  };

  const handleSubmit = (e) => {
    // e.preventDefault();
    const formVal = formRef.current;
    console.log(`用户名：${formVal.username}\n密码：${formVal.password}\n记住我：${formVal.remember}`);
  };

  // 简单样式对象
  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f3f4f6",
      fontFamily: "Arial, sans-serif",
    },
    formBox: {
      backgroundColor: "#fff",
      padding: "40px",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      width: "320px",
      FlexDirection: "colum"
    },
    title: {
      textAlign: "center" as React.CSSProperties["textAlign"],
      marginBottom: "24px",
      fontSize: "24px",
      color: "#333",
    },
    label: {
      display: "block",
      marginBottom: "6px",
      fontSize: "14px",
      color: "#555",
    },
    input: {
      width: "100%",
      padding: "10px",
      marginBottom: "16px",
      borderRadius: "6px",
      border: "1px solid #ccc",
      fontSize: "14px",
      // boxSizing: "border-box",
    },
    checkboxRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
      fontSize: "14px",
      color: "#555",
    },
    button: {
      width: "100%",
      padding: "10px",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
    },
    link: {
      color: "#007bff",
      textDecoration: "none",
      fontSize: "14px",
    },
    footer: {
      // textAlign: "center",
      marginTop: "16px",
      fontSize: "14px",
      color: "#555",
    },
  };

  return (
    <div style={styles.container}>
        <div style={{ backgroundColor: "rgba(233, 233, 146, 1)", padding: "40px", borderRadius: "10px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: "320px", flexDirection: "column"}} 
                      onSubmit={handleSubmit}>
        <h2 style={styles.title}>登录账号</h2>

        <label style={styles.label}>用户名</label>
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
          required
          style={styles.input}
          placeholder="请输入用户名"
        />

        <label style={styles.label}>密码</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          style={styles.input}
          placeholder="请输入密码"
        />

        <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
              style={{ marginRight: "4px" }}
            />
          <label>
            记住我
          </label>
          <p style={styles.link}>
            忘记密码？
          </p>
        </div>

        <button type="submit" style={styles.button} onClick={handleSubmit}>
          登录
        </button>

        <div style={styles.footer}>
          没有账号？ <p style={styles.link}>注册一个</p>
        </div>
      </div>
    </div>
  );
}
