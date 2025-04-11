// src/build.ts
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

// 配置
const SOURCE_DIR = path.join(__dirname, '..');  // 项目根目录
const OUT_DIR = path.join(SOURCE_DIR, 'dist'); // 输出目录
const IGNORE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.map'] as string[]; // 忽略的扩展名

// 主函数
async function build() {
  try {
    // 1. 清空输出目录
    await fs.emptyDir(OUT_DIR);

    // 2. 编译 TypeScript
    console.log('🛠  Compiling TypeScript...');
    execSync('tsc', { stdio: 'inherit' });

    // 3. 复制非脚本文件
    console.log('📂 Copying static files...');
    await copyNonScriptFiles(SOURCE_DIR, OUT_DIR);

    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// 递归复制非脚本文件
async function copyNonScriptFiles(source: string, dest: string) {
  const files = await fs.readdir(source);
 
  for (const file of files) {
    const srcPath = path.join(source, file);
    const destPath = path.join(dest, file);

    // 跳过 node_modules 和输出目录
    if (file === 'node_modules' || srcPath === OUT_DIR) continue;

    const stat = await fs.stat(srcPath);
    const ext = path.extname(file).toLowerCase();

    if (stat.isDirectory()) {
      await fs.ensureDir(destPath);
      await copyNonScriptFiles(srcPath, destPath);
    } else if (!IGNORE_EXTENSIONS.includes(ext)) {
      await fs.copy(srcPath, destPath);
    }
  }
}

// 执行构建
build();