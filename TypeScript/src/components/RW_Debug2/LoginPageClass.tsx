import * as React from "react";

type FormState = {
  form: {
    username: string;
    password: string;
    remember: boolean;
  };
};

export class LoginPage extends React.Component<{}, FormState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      form: {
        username: "",
        password: "",
        remember: false,
      },
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    console.log(`name: ${name}, value: ${value}, type: ${type}`);
    this.setState(prev => ({
      form: {
        ...(prev as FormState).form,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  }

  handleSubmit(e: React.FormEvent) {
    const { username, password, remember } = this.state.form;
    console.log(`用户名：${username}\n密码：${password}\n记住我：${remember}`);
  }

  render() {
    const { form } = this.state;

    const styles: any = {
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
        flexDirection: "column",
      },
      title: {
        textAlign: "center" as any,
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
        marginTop: "16px",
        fontSize: "14px",
        color: "#555",
      },
    };

    return (
      <div style={styles.container}>
        <div style={styles.formBox} onSubmit={this.handleSubmit}>
          <h2 style={styles.title}>登录账号</h2>

          <label style={styles.label}>用户名</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={this.handleChange}
            required
            style={styles.input}
            placeholder="请输入用户名"
          />

          <label style={styles.label}>密码</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={this.handleChange}
            required
            style={styles.input}
            placeholder="请输入密码"
          />

          <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={this.handleChange}
              style={{ marginRight: "4px" }}
            />
            <label style={{ display: "inline-block" }}>记住我</label>
            <p style={styles.link}>忘记密码？</p>
          </div>

          <button type="submit" style={styles.button} onClick={this.handleSubmit}>
            登录
          </button>

          <div style={styles.footer}>
            没有账号？ <span style={styles.link}>注册一个</span>
          </div>
        </div>
      </div>
    );
  }
}

export default LoginPage;