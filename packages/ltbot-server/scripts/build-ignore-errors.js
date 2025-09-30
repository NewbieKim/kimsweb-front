#!/usr/bin/env node

import { execSync } from 'child_process'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// 创建dist目录
const distDir = join(projectRoot, 'dist')
try {
  mkdirSync(distDir, { recursive: true })
  console.log('✅ 创建dist目录成功')
} catch (error) {
  console.log('ℹ️  dist目录已存在')
}

// 复制静态文件
const copyFiles = () => {
  const filesToCopy = ['products.json', 'routes']

  filesToCopy.forEach((item) => {
    const sourcePath = join(projectRoot, item)
    const targetPath = join(distDir, item)

    try {
      if (statSync(sourcePath).isDirectory()) {
        // 复制目录
        copyDirectory(sourcePath, targetPath)
        console.log(`✅ 复制目录: ${item}`)
      } else {
        // 复制文件
        copyFileSync(sourcePath, targetPath)
        console.log(`✅ 复制文件: ${item}`)
      }
    } catch (error) {
      console.error(`❌ 复制失败: ${item}`, error.message)
    }
  })
}

// 递归复制目录
const copyDirectory = (source, target) => {
  if (!statSync(target).isDirectory()) {
    mkdirSync(target, { recursive: true })
  }

  const items = readdirSync(source)
  items.forEach((item) => {
    const sourcePath = join(source, item)
    const targetPath = join(target, item)

    if (statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath)
    } else {
      copyFileSync(sourcePath, targetPath)
    }
  })
}

// 执行TypeScript编译（忽略错误）
const compileTypeScript = () => {
  console.log('🔨 开始编译TypeScript（忽略错误模式）...')

  try {
    // 使用 --noEmitOnError false 强制编译，即使有错误
    execSync('tsc --noEmitOnError false', {
      cwd: projectRoot,
      stdio: 'inherit'
    })
    console.log('✅ TypeScript编译完成')
  } catch (error) {
    console.log('⚠️  TypeScript编译过程中发现错误，但继续构建...')
    console.log('📝 错误详情:', error.message)

    // 检查是否有编译输出
    if (statSync(distDir).isDirectory()) {
      const files = readdirSync(distDir)
      if (files.length > 0) {
        console.log('✅ 发现编译输出文件，继续构建流程')
      } else {
        console.log('⚠️  没有编译输出，尝试强制编译...')
        try {
          execSync('tsc --skipLibCheck --noEmitOnError false', {
            cwd: projectRoot,
            stdio: 'inherit'
          })
          console.log('✅ 强制编译完成')
        } catch (forceError) {
          console.log('⚠️  强制编译也失败，但继续构建流程...')
        }
      }
    }
  }
}

// 主构建流程
const main = () => {
  console.log('🚀 开始构建ecommerce-server（忽略错误模式）...')

  // 1. 编译TypeScript（忽略错误）
  compileTypeScript()

  // 2. 复制静态文件
  copyFiles()

  console.log('🎉 构建完成！')
  console.log('📁 输出目录: dist/')
  console.log('🚀 使用 npm start 启动服务器')
  console.log('💡 注意：构建过程中可能忽略了TypeScript错误，请检查代码质量')
}

main()
